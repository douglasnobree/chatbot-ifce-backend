import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WhatsAppSessionService {
  private readonly logger = new Logger(WhatsAppSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém o estado atual da sessão do WhatsApp
   */
  async getSessionWhatsAppCurrentState() {
    try {
      const response = await this.prisma.whatsAppSession.findFirst({
        where: {
          status: true,
        },
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Erro ao obter o estado atual do WhatsApp: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Obtém o nome da sessão pelo ID
   */
  async getSessionNameById(id: number) {
    try {
      const response = await this.prisma.whatsAppSession.findUnique({
        where: {
          id: id,
        },
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Erro ao obter o nome da sessão pelo ID: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
