import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

export interface EstudanteCSV {
  CPF: string;
  Nome: string;
  Numero_telefone: string;
  Curso: string;
  Matricula: string;
}

@Injectable()
export class CSVMatriculasService {
  private readonly logger = new Logger(CSVMatriculasService.name);
  private readonly csvFilePath = path.join(process.cwd(), 'matriculas', 'matriculas.csv');

  /**
   * Busca um estudante pelo CPF no arquivo CSV
   * @param cpf CPF do estudante (apenas números, sem formatação)
   * @returns Dados do estudante ou null se não encontrado
   */
  async buscarEstudantePorCPF(cpf: string): Promise<EstudanteCSV | null> {
    try {
      const cpfLimpo = cpf.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
      return new Promise((resolve) => {
        const results: EstudanteCSV[] = [];
        
        fs.createReadStream(this.csvFilePath)
          .pipe(csv())
          .on('data', (data: EstudanteCSV) => {
            // Limpa o CPF do registro para comparação
            const cpfRegistro = data.CPF.replace(/\D/g, '');
            
            if (cpfRegistro === cpfLimpo) {
              results.push(data);
            }
          })
          .on('end', () => {
            if (results.length > 0) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          })
          .on('error', (error) => {
            this.logger.error(`Erro ao ler arquivo CSV: ${error.message}`, error.stack);
            resolve(null);
          });
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar estudante por CPF: ${error.message}`, error.stack);
      return null;
    }
  }
}
