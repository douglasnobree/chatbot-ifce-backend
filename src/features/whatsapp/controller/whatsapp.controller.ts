import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { WhatsappService } from '../service/whatsapp.service';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { NewInstanceDto } from '../dto/new-instance.dto';
import {
  InstanceResponseDto,
  QrCodeConnectionDTO,
} from '../dto/instance-response.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { SetupWebhookDto } from '../dto/setup-webhook.dto';
import { InstanceResponseCreateDto } from '../dto/instance-response-create.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('instance')
  @ApiOperation({ summary: 'Criar nova instância WhatsApp' })
  @ApiBody({ type: NewInstanceDto })
  @ApiResponse({ status: 201, type: InstanceResponseCreateDto })
  newInstance(@Body() dados: NewInstanceDto): Promise<InstanceResponseCreateDto> {
    return this.whatsappService.newInstance(dados);
  }

  @Get('instance/:instance')
  @ApiOperation({ summary: 'Buscar instância por nome da Instancia' })
  @ApiParam({ name: 'instance', type: String })
  @ApiResponse({ status: 200, type: InstanceResponseDto })
  searchInstance(@Param('instance') instance: string): Promise<InstanceResponseDto> {
    return this.whatsappService.searchInstance(instance);
  }

  @Get('connect-instance/:instance')
  @ApiParam({ name: 'instance', type: String })
  @ApiOperation({ summary: 'Conectar a uma instância (retorna QR Code)' })
  @ApiResponse({ status: 200, type: QrCodeConnectionDTO })
  connectInstance(
    @Param('instance') instance: string,
  ): Promise<QrCodeConnectionDTO> {
    return this.whatsappService.connectInstance(instance);
  }

  @Post('sendMessage/:instance')
  @ApiParam({ name: 'instance', type: String })
  @ApiOperation({ summary: 'Enviar mensagem pelo WhatsApp' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  sendMessage(
    @Body() dados: SendMessageDto,
    @Param('instance') instance: string,
  ): Promise<any> {
    return this.whatsappService.sendMessage(dados, instance);
  }

  @Put('setupWebhook/:instance')
  @ApiParam({ name: 'instance', type: String })
  @ApiOperation({ summary: 'Configurar Webhook para instância' })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  @ApiBody({ type: SetupWebhookDto })
  setupWebhook(
    @Param('instance') instance: string,
    @Body() dados: SetupWebhookDto,
  ): Promise<{ success: boolean }> {
    return this.whatsappService.setupWebhook(instance, dados.url);
  }

  @Get('checkConnection/:instance')
  @ApiParam({ name: 'instance', type: String })

  @ApiOperation({ summary: 'Verificar conexão com o WhatsApp' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        status: 'connected',
        instanceName: 'instance1',
        lastConnectionTime: '2023-10-01T12:00:00Z',
      },
    },
  })
  checkConnection(@Param('instance') instance: string): Promise<any> {
    return this.whatsappService.checkInstanceStatus(instance);
  }

  @Get('getInstanceName')
  @ApiOperation({ summary: 'Obter nome da instancia' })
  getInstanceName(): Promise<any> {
    return this.whatsappService.getInstanceName();
  }
  
  @Delete('instance/:instance')
  @ApiParam({ name: 'instance', type: String })
  @ApiOperation({ summary: 'Remover instância do WhatsApp' })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  removeInstance(@Param('instance') instance: string): Promise<any> {
    return this.whatsappService.removeInstance(instance);
  }
}
