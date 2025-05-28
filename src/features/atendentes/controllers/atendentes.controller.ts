import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtendentesService } from '../services/atendentes.service';
import { CreateAtendenteDto, UpdateAtendenteDto } from '../dto/atendente.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AtendenteGuard } from '../guards/atendente.guard';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';

@ApiTags('atendentes')
@ApiBearerAuth()
@Controller('atendentes')
@UseGuards(JwtAuthGuard)
export class AtendentesController {
  private readonly logger = new Logger(AtendentesController.name);

  constructor(private readonly atendentesService: AtendentesService) {}
  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar novo atendente' })
  @ApiResponse({ status: 201, description: 'Atendente criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 409, description: 'Email já existe.' })
  async create(
    @Body(ValidationPipe) createAtendenteDto: CreateAtendenteDto,
    @CurrentUser() user: User,
  ) {
    this.logger.log(
      `Criando atendente: ${createAtendenteDto.email} por ${user.email}`,
    );
    return this.atendentesService.create(createAtendenteDto);
  }

  @Get()
  @UseGuards(AtendenteGuard)
  @ApiOperation({ summary: 'Listar todos os atendentes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de atendentes retornada com sucesso.',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async findAll(@CurrentUser() user: User) {
    this.logger.log(`Listando atendentes - solicitado por: ${user.email}`);
    return this.atendentesService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do atendente logado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Atendente não encontrado.' })
  async getMyProfile(@CurrentUser() user: User) {
    this.logger.log(`Buscando perfil próprio: ${user.email}`);
    return this.atendentesService.findByEmail(user.email);
  }

  @Get(':id')
  @UseGuards(AtendenteGuard)
  @ApiOperation({ summary: 'Buscar atendente por ID' })
  @ApiResponse({ status: 200, description: 'Atendente encontrado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Atendente não encontrado.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(
      `Buscando atendente: ${id} - solicitado por: ${user.email}`,
    );
    return this.atendentesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Atualizar atendente' })
  @ApiResponse({
    status: 200,
    description: 'Atendente atualizado com sucesso.',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Atendente não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAtendenteDto: UpdateAtendenteDto,
    @CurrentUser() user: User,
  ) {
    this.logger.log(`Atualizando atendente: ${id} por ${user.email}`);
    return this.atendentesService.update(id, updateAtendenteDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remover atendente' })
  @ApiResponse({ status: 200, description: 'Atendente removido com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Atendente não encontrado.' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(`Removendo atendente: ${id} por ${user.email}`);
    await this.atendentesService.remove(id);
    return { message: 'Atendente removido com sucesso' };
  }
}
