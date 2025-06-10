import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Req,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { WhatsappService } from '../service/whatsapp.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { QrCodeConnectionDTO } from '../dto/instance-response.dto';
import { SetupWebhookDto } from '../dto/setup-webhook.dto';
import { NewInstanceDto } from '../dto/new-instance.dto';
import { InstanceResponseCreateDto } from '../dto/instance-response-create.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('sendText/:instanceName')
  @UseGuards(AuthGuard('jwt'))
  async sendText(
    @Param('instanceName') instanceName: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.whatsappService.sendTextMessage(instanceName, sendMessageDto);
  }

  @Get('getInstanceName')
  async getInstanceName() {
    const instanceName = await this.whatsappService.getInstanceName();
    return instanceName;
  }

  @Post('sendMediaFile/:protocolId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Validar tipos de arquivo permitidos
        const allowedMimeTypes = [
          // Imagens
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          // Documentos
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          // Vídeos
          'video/mp4',
          'video/mpeg',
          'video/webm',
          // Áudios
          'audio/mpeg',
          'audio/ogg',
          'audio/wav',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Tipo de arquivo não permitido: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 16 * 1024 * 1024, // Limite de 16MB
      },
    }),
  )
  async sendMediaFile(
    @Param('protocolId') protocolId: string,
    @UploadedFile() file,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado ou inválido');
    }

    const {
      number,
      caption,
      mediatype,
      presence,
      delay,
      quotedMessageId,
      externalAttributes,
    } = req.body;

    if (!number) {
      // Remover o arquivo se os dados forem inválidos
      fs.unlink(file.path, (err) => {
        if (err) console.error('Erro ao remover arquivo temporário:', err);
      });
      throw new BadRequestException('Número de telefone é obrigatório');
    }

    if (
      !mediatype ||
      !['image', 'document', 'video', 'audio'].includes(mediatype)
    ) {
      // Remover o arquivo se os dados forem inválidos
      fs.unlink(file.path, (err) => {
        if (err) console.error('Erro ao remover arquivo temporário:', err);
      });
      throw new BadRequestException(
        'Tipo de mídia inválido. Use: image, document, video ou audio',
      );
    }

    try {
      const instanceName = await this.whatsappService.getInstanceName();
      const number =
        await this.whatsappService.getEstudantNumberByProtocolId(protocolId);
      console.log(number);
      const result = await this.whatsappService.sendMediaFile(
        instanceName.instanceName,
        {
          number,
          caption: caption || '',
          mediaPath: file.path,
          fileName: file.originalname,
          mediaType: mediatype,
          presence: presence || 'composing',
          delay: delay ? parseInt(delay) : undefined,
          quotedMessageId: quotedMessageId
            ? parseInt(quotedMessageId)
            : undefined,
          externalAttributes: externalAttributes
            ? JSON.parse(externalAttributes)
            : undefined,
        },
      );

      // Cria uma URL para acesso ao arquivo
      const fileUrl = `/uploads/media/${file.filename}`;

      return {
        success: true,
        data: result,
        mediaUrl: fileUrl,
      };
    } catch (error) {
      // Em caso de erro, remove o arquivo que foi salvo
      fs.unlink(file.path, (err) => {
        if (err)
          console.error('Erro ao remover arquivo temporário após falha:', err);
      });

      throw error;
    }
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

  @Post('instance')
  @ApiOperation({ summary: 'Criar nova instância WhatsApp' })
  @ApiBody({ type: NewInstanceDto })
  @ApiResponse({ status: 201, type: InstanceResponseCreateDto })
  newInstance(
    @Body() dados: NewInstanceDto,
  ): Promise<InstanceResponseCreateDto> {
    return this.whatsappService.newInstance(dados);
  }
}
