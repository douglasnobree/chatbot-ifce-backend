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
import { PrismaService } from 'src/prisma/prisma.service';
import { InstanceResponseCreateDto } from '../dto/instance-response-create.dto';
import { SessionService } from 'src/features/chatbot/services/session.service';

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

  constructor(
    private configService: ConfigService,
    private readonly PrismaService: PrismaService,
    private readonly sessionService: SessionService,
  ) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    this.apiKey = this.configService.get<string>('WHATSAPP_API_KEY');

    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apiKey: this.apiKey,
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
  async newInstance(dados: NewInstanceDto): Promise<InstanceResponseCreateDto> {
    this.logger.log(`Creating new WhatsApp instance: ${dados.instanceName}`);

    if (!dados.instanceName) {
      throw new HttpException(
        'Nome da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.makeRequest<InstanceResponseCreateDto>({
        method: 'POST',
        url: '/instance/create',
        data: dados,
      });
      await this.PrismaService.whatsAppSession.create({
        data: {
          id: response.id,
          InstanceName: dados.instanceName,
          jwt_token: response.Auth.token,
          numero_telefone: '',
          status: false,
        },
      });
      return response;
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
      const response = await this.makeRequest<InstanceResponseDto>({
        method: 'GET',
        url: `/instance/fetchInstance/${instance}`,
      });
      const instanceData = await this.PrismaService.whatsAppSession.findFirst({
        where: {
          id: response.id,
        },
      });
      if (response.connectionStatus === 'ONLINE') {
        await this.PrismaService.whatsAppSession.update({
          where: {
            id: response.id,
          },
          data: {
            status: true,
            numero_telefone: response.ownerJid,
          },
        });
      } else {
        await this.PrismaService.whatsAppSession.update({
          where: {
            id: response.id,
          },
          data: {
            status: false,
          },
        });
      }
      return response;
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
      const response = await this.makeRequest<QrCodeConnectionDTO>({
        method: 'GET',
        url: `/instance/connect/${instance}`,
      });

      return response;
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
    const responseSessionWhatsCurrent =
      await this.sessionService.getSessionWhatsAppCurrentState();
    if (!responseSessionWhatsCurrent) {
      throw new HttpException(
        'Nenhuma instância ativa encontrada',
        HttpStatus.BAD_REQUEST,
      );
    }

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
      if (isOnline) {
        await this.PrismaService.whatsAppSession.update({
          where: {
            id: instanceData.id,
          },
          data: {
            status: true,
          },
        });
      } else {
        await this.PrismaService.whatsAppSession.update({
          where: {
            id: instanceData.id,
          },
          data: {
            status: false,
          },
        });
      }

      return {
        online: isOnline,
        connectionState: connectionState,
      };
    } catch (error) {
      this.logger.error(`Failed to check instance status: ${instance}`, error);
      return { online: false };
    }
  }

  async getInstanceName() {
    try {
      const response = await this.PrismaService.whatsAppSession.findFirst({
        where: {},
      });
      if (!response) {
        throw new HttpException(
          'Nenhuma instância ativa encontrada',
          HttpStatus.BAD_REQUEST,
        );
      }

      return { instanceName: response.InstanceName };
    } catch (error) {
      throw error;
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
      await this.PrismaService.whatsAppSession.update({
        where: {
          InstanceName: instance,
        },
        data: {
          status: false,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to disconnect instance: ${instance}`, error);
      throw error;
    }
  }

  async setupWebhook(
    instance: string,
    url: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Setting up webhook for instance: ${instance}`);

    if (!instance) {
      throw new HttpException(
        'ID da instância é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!url) {
      throw new HttpException(
        'URL do webhook é obrigatória',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.makeRequest({
        method: 'PUT',
        url: `/webhook/set/${instance}`,
        data: {
          enabled: true,
          url: url,
          events: {
            qrcodeUpdated: true,
            messagesSet: true,
            messagesUpsert: true,
            messagesUpdated: true,
            sendMessage: true,
            contactsSet: true,
            contactsUpsert: true,
            contactsUpdated: true,
            chatsSet: true,
            chatsUpsert: true,
            chatsUpdated: true,
            chatsDeleted: true,
            presenceUpdated: true,
            groupsUpsert: true,
            groupsUpdated: true,
            groupsParticipantsUpdated: true,
            connectionUpdated: true,
            statusInstance: true,
            refreshToken: true,
          },
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to setup webhook for instance: ${instance}`,
        error,
      );
      throw error;
    }
  }

  async removeInstance(instance: string): Promise<{ success: boolean }> {
    this.logger.log(`Removing WhatsApp instance: ${instance}`);

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

      await this.makeRequest({
        method: 'DELETE',
        url: `/instance/delete/${instance}`,
      });
      await this.PrismaService.whatsAppSession.delete({
        where: {
          InstanceName: instance,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to remove instance: ${instance}`, error);
      throw error;
    }
  }
}
