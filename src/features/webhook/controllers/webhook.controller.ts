import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { HandleWebhookEventCommand } from '../commands/handlewebhook.command';
import { WebhookEventType } from '../enums/enum';
import { WebhookEventDto } from '../dto/webhook-event.dto';
import { WebhookMessageDto } from '../dto/webhook-message.dto';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post()
  @ApiOperation({ summary: 'Recebe eventos de webhook do WhatsApp' })
  @ApiBody({ type: WebhookEventDto })
  @ApiResponse({
    status: 200,
    description: 'Evento processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
      },
    },
  })
  async handleWebhook(@Body() payload: WebhookEventDto) {
    const { event, data } = payload;
    await this.commandBus.execute(new HandleWebhookEventCommand(event, data));
    return { status: 'success' };
  }
}
