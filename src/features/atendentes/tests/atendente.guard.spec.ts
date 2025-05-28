import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AtendenteGuard } from '../guards/atendente.guard';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AtendenteGuard', () => {
  let guard: AtendenteGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    atendente: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtendenteGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<AtendenteGuard>(AtendenteGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('deve permitir acesso para atendente válido', async () => {
      const user = { email: 'atendente@ifce.edu.br' };
      const mockAtendente = {
        id: '1',
        email: 'atendente@ifce.edu.br',
        nome: 'Atendente',
      };

      mockPrismaService.atendente.findUnique.mockResolvedValue(mockAtendente);

      const context = createMockExecutionContext(user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.atendente.findUnique).toHaveBeenCalledWith({
        where: { email: 'atendente@ifce.edu.br' },
      });
    });

    it('deve negar acesso para usuário não autenticado', async () => {
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve negar acesso para usuário sem email', async () => {
      const user = {};
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve negar acesso para usuário não-atendente', async () => {
      const user = { email: 'naoatendente@ifce.edu.br' };

      mockPrismaService.atendente.findUnique.mockResolvedValue(null);

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lidar com erros do banco de dados', async () => {
      const user = { email: 'atendente@ifce.edu.br' };

      mockPrismaService.atendente.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
