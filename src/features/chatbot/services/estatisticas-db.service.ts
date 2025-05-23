import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import {
  MenuUsageStatistic,
  SessionStatistic,
  EstatisticasRelatorioPeriodo,
} from '../interfaces/estatisticas.interface';
import { SessionState } from '@prisma/client';

@Injectable()
export class EstatisticasService {
  private readonly logger = new Logger(EstatisticasService.name);
  private currentEstatisticaId: string | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.inicializarEstatisticaDoDia();
  }

  /**
   * Inicializa ou recupera o registro de estatística do dia
   */
  private async inicializarEstatisticaDoDia(): Promise<void> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let estatistica = await this.prisma.estatistica.findFirst({
      where: { data: { equals: hoje } },
    });
    if (!estatistica) {
      estatistica = await this.prisma.estatistica.create({
        data: {
          data: hoje,
          total_sessoes: 0,
          sessoes_ativas: 0,
          duracao_media_sessao: 0,
        },
      });
    }
    this.currentEstatisticaId = estatistica.id;
  }

  /**
   * Registra o acesso a um menu específico (incrementa no banco)
   */
  async registrarAcessoMenu(menuType: SessionState): Promise<void> {
    await this.inicializarEstatisticaDoDia();
    let menu = await this.prisma.menuAcesso.findFirst({
      where: {
        estatistica_id: this.currentEstatisticaId!,
        tipo_menu: menuType,
      },
    });
    if (menu) {
      await this.prisma.menuAcesso.update({
        where: { id: menu.id },
        data: {
          contagem: { increment: 1 },
          ultimo_acesso: new Date(),
        },
      });
    } else {
      await this.prisma.menuAcesso.create({
        data: {
          estatistica_id: this.currentEstatisticaId!,
          tipo_menu: menuType,
          contagem: 1,
          ultimo_acesso: new Date(),
        },
      });
    }
  }

  /**
   * Registra a criação de uma nova sessão
   */
  async registrarNovaSessao(): Promise<void> {
    await this.inicializarEstatisticaDoDia();
    await this.prisma.estatistica.update({
      where: { id: this.currentEstatisticaId! },
      data: {
        total_sessoes: { increment: 1 },
        sessoes_ativas: { increment: 1 },
      },
    });
  }

  /**
   * Registra o encerramento de uma sessão
   */
  async registrarEncerramentoSessao(duracaoMinutos: number): Promise<void> {
    await this.inicializarEstatisticaDoDia();
    const estatistica = await this.prisma.estatistica.findUnique({
      where: { id: this.currentEstatisticaId! },
    });
    // Atualiza a média
    let novaMedia = duracaoMinutos;
    if (estatistica && estatistica.total_sessoes > 1) {
      const totalDuracao =
        (estatistica.duracao_media_sessao || 0) *
          (estatistica.total_sessoes - 1) +
        duracaoMinutos;
      novaMedia = totalDuracao / estatistica.total_sessoes;
    }
    await this.prisma.estatistica.update({
      where: { id: this.currentEstatisticaId! },
      data: {
        sessoes_ativas: { decrement: 1 },
        duracao_media_sessao: novaMedia,
      },
    });
  }

  /**
   * Obtém as estatísticas atuais de uso
   */
  async obterEstatisticas(): Promise<SessionStatistic> {
    await this.inicializarEstatisticaDoDia();
    const estatistica = await this.prisma.estatistica.findUnique({
      where: { id: this.currentEstatisticaId! },
      include: { menu_acessos: true },
    });
    const menuUsage: Record<string, MenuUsageStatistic> = {};
    estatistica?.menu_acessos.forEach((menu) => {
      menuUsage[menu.tipo_menu] = {
        menuType: menu.tipo_menu,
        count: menu.contagem,
        lastAccessed: menu.ultimo_acesso,
      };
    });
    return {
      totalSessions: estatistica?.total_sessoes || 0,
      activeSessions: estatistica?.sessoes_ativas || 0,
      averageSessionDuration: estatistica?.duracao_media_sessao || 0,
      menuUsage,
    };
  }

  /**
   * Reseta as estatísticas de uso do dia
   */
  async resetarEstatisticas(): Promise<void> {
    await this.inicializarEstatisticaDoDia();
    await this.prisma.estatistica.update({
      where: { id: this.currentEstatisticaId! },
      data: {
        total_sessoes: 0,
        sessoes_ativas: 0,
        duracao_media_sessao: 0,
      },
    });
    await this.prisma.menuAcesso.deleteMany({
      where: { estatistica_id: this.currentEstatisticaId! },
    });
  }

  /**
   * Obtém os menus mais acessados
   */
  async obterMenusMaisAcessados(limit = 5): Promise<MenuUsageStatistic[]> {
    await this.inicializarEstatisticaDoDia();
    const menus = await this.prisma.menuAcesso.findMany({
      where: { estatistica_id: this.currentEstatisticaId! },
      orderBy: { contagem: 'desc' },
      take: limit,
    });
    return menus.map((menu) => ({
      menuType: menu.tipo_menu,
      count: menu.contagem,
      lastAccessed: menu.ultimo_acesso,
    }));
  }

 

  /**
   * Obtém relatório de estatísticas do período
   * @param dataInicio Data de início do período
   * @param dataFim Data de fim do período
   */
  async obterRelatorioPeriodo(dataInicio: Date, dataFim: Date): Promise<any> {
    try {
      const estatisticas = await this.prisma.estatistica.findMany({
        where: {
          data: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        include: {
          menu_acessos: true,
        },
        orderBy: {
          data: 'asc',
        },
      });

      // Calcula estatísticas agregadas
      const totalSessoes = estatisticas.reduce(
        (sum, est) => sum + est.total_sessoes,
        0,
      );
      const duracaoMediaGeral =
        estatisticas
          .filter((est) => est.duracao_media_sessao > 0)
          .reduce((sum, est) => sum + est.duracao_media_sessao, 0) /
          estatisticas.filter((est) => est.duracao_media_sessao > 0).length ||
        0;

      // Agrupa acessos a menus
      const menuAcessos: Record<string, number> = {};

      estatisticas.forEach((est) => {
        est.menu_acessos.forEach((acesso) => {
          if (!menuAcessos[acesso.tipo_menu]) {
            menuAcessos[acesso.tipo_menu] = 0;
          }
          menuAcessos[acesso.tipo_menu] += acesso.contagem;
        });
      });

      // Encontra os menus mais acessados
      const menusMaisAcessados = Object.entries(menuAcessos)
        .map(([tipo, contagem]) => ({ tipo, contagem }))
        .sort((a, b) => b.contagem - a.contagem)
        .slice(0, 5);

      return {
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
        totalSessoes,
        duracaoMediaGeral,
        menusMaisAcessados,
        estatisticasDiarias: estatisticas.map((est) => ({
          data: est.data,
          totalSessoes: est.total_sessoes,
          sessoesAtivas: est.sessoes_ativas,
          duracaoMedia: est.duracao_media_sessao,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter relatório de período: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
