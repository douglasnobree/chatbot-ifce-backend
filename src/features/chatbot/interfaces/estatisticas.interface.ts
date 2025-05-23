/**
 * Interface para estatísticas de uso de um menu específico
 */
export interface MenuUsageStatistic {
  menuType: string;
  count: number;
  lastAccessed: Date;
}

/**
 * Interface para estatísticas gerais de sessões
 */
export interface SessionStatistic {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number; // em minutos
  menuUsage: Record<string, MenuUsageStatistic>;
}

/**
 * Interface para o relatório de estatísticas de um período
 */
export interface EstatisticasRelatorioPeriodo {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  totalSessoes: number;
  duracaoMediaGeral: number;
  menusMaisAcessados: {
    tipo: string;
    contagem: number;
  }[];
  estatisticasDiarias: {
    data: Date;
    totalSessoes: number;
    sessoesAtivas: number;
    duracaoMedia: number;
  }[];
}
