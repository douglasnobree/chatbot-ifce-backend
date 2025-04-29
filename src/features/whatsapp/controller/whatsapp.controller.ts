import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('instance')
  @ApiOperation({ summary: 'Criar nova instância WhatsApp' })
  @ApiBody({ type: NewInstanceDto })
  @ApiResponse({ status: 201, type: InstanceResponseDto })
  newInstance(@Body() dados: NewInstanceDto): Promise<InstanceResponseDto> {
    return this.whatsappService.newInstance(dados);
  }

  @Get('instance/:id')
  @ApiOperation({ summary: 'Buscar instância por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InstanceResponseDto })
  searchInstance(@Param('id') id: string): Promise<InstanceResponseDto> {
    return this.whatsappService.searchInstance(id);
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
}
