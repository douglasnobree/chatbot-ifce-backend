import { WebhookEventType } from "../enums/enum";
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventBus } from '@nestjs/cqrs';
import { WebhookEventTriggered } from "../events/webhook-Triggered"; 

export class HandleWebhookEventCommand {
  constructor(
    public readonly type: WebhookEventType,
    public readonly data: any,
  ) {}
}



@CommandHandler(HandleWebhookEventCommand)
export class HandleWebhookEventCommandHandler
  implements ICommandHandler<HandleWebhookEventCommand>
{
  constructor(private readonly eventBus: EventBus) {}

  async execute(command: HandleWebhookEventCommand): Promise<void> {
    const { type, data } = command;

    // Emite um evento interno para processar o dado
    this.eventBus.publish(new WebhookEventTriggered(type, data));
  }
}

