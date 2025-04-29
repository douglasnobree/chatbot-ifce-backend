import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('instance')
  newInstance(@Body() dados: any) {
    return this.whatsappService.newInstance(dados);
  }

  @Get('instance/:id')
  searchInstance(@Param('id') id: string) {
    return this.whatsappService.searchInstance(id);
  }

  @Post('connect')
  connectInstance(@Body('id') id: string) {
    return this.whatsappService.connectInstance(id);
  }

  @Post('send')
  sendMessage(@Body() dados: any) {
    return this.whatsappService.sendMessage(dados);
  }
}
