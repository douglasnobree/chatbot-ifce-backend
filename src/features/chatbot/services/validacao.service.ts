import { Injectable, Logger } from '@nestjs/common';
import { Session } from '../entities/session.entity';

@Injectable()
export class ValidacaoService {
  private readonly logger = new Logger(ValidacaoService.name);

  /**
   * Valida se o texto informado é um CPF válido
   * @param cpf CPF a ser validado
   */
  validarCPF(cpf: string): boolean {
    try {
      const cpfLimpo = cpf.replace(/\D/g, '');

      // Verifica se possui 11 dígitos
      if (cpfLimpo.length !== 11) {
        return false;
      }

      // Verifica se todos os dígitos são iguais (caso inválido)
      if (/^(\d)\1+$/.test(cpfLimpo)) {
        return false;
      }

      // Implementação simples - em um ambiente real, incluiria validação completa com dígitos verificadores
      return true;
    } catch (error) {
      this.logger.error(`Erro ao validar CPF: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Valida se o texto é um número de telefone válido
   * @param telefone Número de telefone a validar
   */
  validarTelefone(telefone: string): boolean {
    try {
      const telefoneLimpo = telefone.replace(/\D/g, '');

      // Verifica se tem pelo menos 8 dígitos (pode variar conforme região)
      if (telefoneLimpo.length < 8) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao validar telefone: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Valida se o texto é um email válido
   * @param email Email a validar
   */
  validarEmail(email: string): boolean {
    try {
      // Regex simples para validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      this.logger.error(`Erro ao validar email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Extrai dados importantes de um texto de formulário enviado pelo usuário
   * @param texto Texto do formulário
   */
  extrairDadosFormulario(texto: string): Record<string, string> {
    try {
      const linhas = texto.split('\n');
      const dados: Record<string, string> = {};

      // Tenta extrair informações básicas
      for (const linha of linhas) {
        // Nome
        if (/nome/i.test(linha)) {
          const nome = linha.replace(/.*nome.*?:/i, '').trim();
          if (nome) dados.nome = nome;
        }

        // Telefone
        if (/telefone|tel|fone/i.test(linha)) {
          const telefone = linha
            .replace(/.*(?:telefone|tel|fone).*?:/i, '')
            .trim();
          if (telefone) dados.telefone = telefone;
        }

        // Email
        if (/e-?mail/i.test(linha)) {
          const email = linha.replace(/.*e-?mail.*?:/i, '').trim();
          if (email) dados.email = email;
        }

        // Curso
        if (/curso/i.test(linha)) {
          const curso = linha.replace(/.*curso.*?:/i, '').trim();
          if (curso) dados.curso = curso;
        }
      }

      return dados;
    } catch (error) {
      this.logger.error(
        `Erro ao extrair dados do formulário: ${error.message}`,
        error.stack,
      );
      return {};
    }
  }
}
