import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { HandleWebhookEventCommand } from '../commands/handlewebhook.command';
import { WebhookEventType } from '../enums/enum';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Recebe eventos de webhook do WhatsApp' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', enum: Object.values(WebhookEventType) },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Evento processado com sucesso' })
  async handleWebhook(@Body() payload: { event: WebhookEventType; data: any }) {
    const { event, data } = payload;
    await this.commandBus.execute(new HandleWebhookEventCommand(event, data));
    return { status: 'success' };
  }
}
