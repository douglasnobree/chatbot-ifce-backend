import { WebhookEventType } from '../enums/enum';

export class WebhookEventTriggered {
  constructor(
    public readonly type: WebhookEventType,
    public readonly data: any,
  ) {}
}
