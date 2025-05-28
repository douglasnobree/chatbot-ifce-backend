import { Test, TestingModule } from '@nestjs/testing';
import { AtendentesService } from '../services/atendentes.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('AtendentesService', () => {
  let service: AtendentesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    atendente: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtendentesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AtendentesService>(AtendentesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateIfceEmail', () => {
    it('deve aceitar email @ifce.edu.br', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = service['validateIfceEmail']('usuario@ifce.edu.br');
      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('deve rejeitar email não-IFCE em produção', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = service['validateIfceEmail']('usuario@gmail.com');
      expect(result).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('deve aceitar email @aluno.ifce.edu.br em desenvolvimento', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = service['validateIfceEmail']('aluno@aluno.ifce.edu.br');
      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('create', () => {
    const createAtendenteDto = {
      nome: 'João Silva',
      email: 'joao@ifce.edu.br',
      cargo: 'Assistente',
      departamento: 'TI',
    };

    it('deve criar atendente com sucesso', async () => {
      const mockAtendente = { id: '1', ...createAtendenteDto };

      mockPrismaService.atendente.findUnique.mockResolvedValue(null);
      mockPrismaService.atendente.create.mockResolvedValue(mockAtendente);

      const result = await service.create(createAtendenteDto);

      expect(result).toEqual(mockAtendente);
      expect(mockPrismaService.atendente.create).toHaveBeenCalledWith({
        data: {
          ...createAtendenteDto,
          email: createAtendenteDto.email.toLowerCase(),
        },
      });
    });

    it('deve lançar ConflictException se email já existe', async () => {
      const existingAtendente = { id: '1', ...createAtendenteDto };

      mockPrismaService.atendente.findUnique.mockResolvedValue(
        existingAtendente,
      );

      await expect(service.create(createAtendenteDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar BadRequestException para email inválido', async () => {
      const invalidDto = { ...createAtendenteDto, email: 'invalid@gmail.com' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByEmail', () => {
    it('deve retornar atendente por email', async () => {
      const mockAtendente = {
        id: '1',
        email: 'joao@ifce.edu.br',
        nome: 'João',
      };

      mockPrismaService.atendente.findUnique.mockResolvedValue(mockAtendente);

      const result = await service.findByEmail('joao@ifce.edu.br');

      expect(result).toEqual(mockAtendente);
      expect(mockPrismaService.atendente.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@ifce.edu.br' },
      });
    });

    it('deve retornar null se atendente não existe', async () => {
      mockPrismaService.atendente.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('inexistente@ifce.edu.br');

      expect(result).toBeNull();
    });
  });

  describe('createOrUpdateFromGoogleAuth', () => {
    const mockGoogleProfile = {
      emails: [{ value: 'usuario@ifce.edu.br' }],
      name: { givenName: 'João', familyName: 'Silva' },
    };

    it('deve criar novo atendente do Google', async () => {
      const mockAtendente = {
        id: '1',
        email: 'usuario@ifce.edu.br',
        nome: 'João Silva',
      };

      mockPrismaService.atendente.findUnique.mockResolvedValue(null);
      mockPrismaService.atendente.create.mockResolvedValue(mockAtendente);

      const result =
        await service.createOrUpdateFromGoogleAuth(mockGoogleProfile);

      expect(result).toEqual(mockAtendente);
    });

    it('deve lançar BadRequestException para email não-IFCE', async () => {
      const invalidProfile = {
        ...mockGoogleProfile,
        emails: [{ value: 'usuario@gmail.com' }],
      };

      await expect(
        service.createOrUpdateFromGoogleAuth(invalidProfile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
