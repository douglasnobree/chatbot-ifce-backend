import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { NewInstanceDto } from '../dto/new-instance.dto';
import {
  InstanceResponseDto,
  QrCodeConnectionDTO,
} from '../dto/instance-response.dto';
import { SendMessageDto } from '../dto/send-message.dto';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiClient: AxiosInstance;
  private readonly defaultTimeout = 30000; // 30 segundos
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    this.apiKey = this.configService.get<string>('WHATSAPP_API_KEY');

    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'apiKey': this.apiKey,
      },
    });

    this.setupInterceptors();
  }

  onModuleInit() {
    this.logger.log(
      `WhatsApp Service initialized with API URL: ${this.apiUrl}`,
    );
    this.validateConfiguration();
  }

  private validateConfiguration() {
    if (!this.apiUrl) {
      this.logger.error('Missing WHATSAPP_API_URL configuration');
      throw new Error('WhatsApp API URL is not configured');
    }
  }

  private setupInterceptors() {
    // Interceptor para logs de requisição
    this.apiClient.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Request: ${config.method.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    // Interceptor para logs de resposta
    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Response: ${response.status} from ${response.config.url}`,
        );
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      },
    );
  }

  private handleApiError(error: AxiosError) {
    const status = error.response?.status || 500;
    const message =
      //@ts-ignore
      error.response?.data?.message || error.message || 'Erro desconhecido';
    const url = error.config?.url || 'URL desconhecida';

    this.logger.error(`API Error: ${status} - ${message} (${url})`);

    if (error.response) {
      this.logger.debug(
        `Response data: ${JSON.stringify(error.response.data)}`,
      );
    }

    throw new HttpException(
      {
        status,
        error: message,
        details: error.response?.data,
      },
      status,
    );
  }

  private async makeRequest<T>(
    config: AxiosRequestConfig,
    retryCount = 0,
  ): Promise<T> {
    try {
      const response = await this.apiClient.request<T>(config);
      return response.data;
    } catch (error) {
      // Implementação de retry em caso de falha de rede
      if (
        axios.isAxiosError(error) &&
        !error.response &&
        retryCount < this.maxRetries
      ) {
        const nextRetry = retryCount + 1;
        const delay = this.getRetryDelay(nextRetry);

        this.logger.warn(
          `Retrying request (${nextRetry}/${this.maxRetries}) to ${config.url} after ${delay}ms`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.makeRequest<T>(config, nextRetry);
      }

      throw error;
    }
  }

  private getRetryDelay(retryCount: number): number {
    return Math.pow(2, retryCount) * 1000; // Exponential backoff
  }

  /**
   * Cria uma nova instância do WhatsApp
   * @param dados Dados da nova instância
   * @returns Detalhes da instância criada
   */
  async newInstance(dados: NewInstanceDto): Promise<InstanceResponseDto> {
    this.logger.log(`Creating new WhatsApp instance: ${dados.instanceName}`);

    if (!dados.instanceName) {
      throw new HttpException(
        'Nome da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.makeRequest<InstanceResponseDto>({
        method: 'POST',
        url: '/instance/create',
        data: dados,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create instance: ${dados.instanceName}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Busca uma instância pelo ID
   * @param instance ID da instância
   * @returns Detalhes da instância encontrada
   */
  async searchInstance(instance: string): Promise<InstanceResponseDto> {
    this.logger.log(`Searching for WhatsApp instance: ${instance}`);

    if (!instance) {
      throw new HttpException(
        'ID da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.makeRequest<InstanceResponseDto>({
        method: 'GET',
        url: `/instance/fetchInstance/${instance}`,
      });
    } catch (error) {
      this.logger.error(`Failed to fetch instance: ${instance}`, error);
      throw error;
    }
  }

  /**
   * Conecta à uma instância do WhatsApp
   * @param instance ID da instância
   * @returns Dados de conexão com QR Code
   */
  async connectInstance(instance: string): Promise<QrCodeConnectionDTO> {
    this.logger.log(`Connecting to WhatsApp instance: ${instance}`);
 
    if (!instance) {
      throw new HttpException(
        'ID da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.makeRequest<QrCodeConnectionDTO>({
        method: 'GET',
        url: `/instance/connect/${instance}`,
      });
    } catch (error) {
      this.logger.error(`Failed to connect to instance: ${instance}`, error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem pelo WhatsApp
   * @param dados Dados da mensagem
   * @param instance ID da instância
   * @returns Resultado do envio
   */
  async sendMessage(
    dados: SendMessageDto,
    instance: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    this.logger.log(
      `Sending message to ${dados.number} via instance: ${instance}`,
    );

    if (!instance) {
      throw new HttpException(
        'ID da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!dados.number || !dados.textMessage?.text) {
      throw new HttpException(
        'Número e texto da mensagem são obrigatórios',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.makeRequest<any>({
        method: 'POST',
        url: `/message/sendText/${instance}`,
        data: dados,
      });

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Failed to send message to ${dados.number}`, error);
      return {
        success: false,
        error:
          error instanceof HttpException
            ? error.message
            : 'Falha ao enviar mensagem',
      };
    }
  }

  /**
   * Verifica o status de uma instância
   * @param instance ID da instância
   * @returns Status da instância
   */
  async checkInstanceStatus(
    instance: string,
  ): Promise<{ online: boolean; connectionState?: string }> {
    try {
      const instanceData = await this.searchInstance(instance);
      const isOnline = instanceData.connectionStatus === 'ONLINE';
      const connectionState = instanceData.Whatsapp?.connection?.state;

      return {
        online: isOnline,
        connectionState: connectionState,
      };
    } catch (error) {
      this.logger.error(`Failed to check instance status: ${instance}`, error);
      return { online: false };
    }
  }

  /**
   * Desconecta uma instância ativa
   * @param instance ID da instância
   * @returns Resultado da operação
   */
  async disconnectInstance(instance: string): Promise<{ success: boolean }> {
    this.logger.log(`Disconnecting WhatsApp instance: ${instance}`);

    if (!instance) {
      throw new HttpException(
        'ID da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.makeRequest({
        method: 'DELETE',
        url: `/instance/logout/${instance}`,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to disconnect instance: ${instance}`, error);
      throw error;
    }
  }
}
