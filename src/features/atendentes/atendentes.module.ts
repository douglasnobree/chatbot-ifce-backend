import { Module, forwardRef } from '@nestjs/common';
import { AtendentesController } from './controllers/atendentes.controller';
import { AtendentesService } from './services/atendentes.service';
import { AtendenteGuard } from './guards/atendente.guard';
import { AdminGuard } from './guards/admin.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AtendentesController],
  providers: [AtendentesService, AtendenteGuard, AdminGuard],
  exports: [AtendentesService],
})
export class AtendentesModule {}
