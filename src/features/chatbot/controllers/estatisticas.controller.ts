import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EstatisticasService } from '../services/estatisticas-db.service';
import { ParseDatePipe } from '../pipes/parse-date.pipe';

@Controller('estatisticas')
@ApiTags('Estatísticas')
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtém as estatísticas atuais do chatbot' })
  obterEstatisticasAtuais() {
    return this.estatisticasService.obterEstatisticas();
  }

  @Get('menus-populares')
  @ApiOperation({ summary: 'Obtém os menus mais acessados' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  obterMenusPopulares(@Query('limit', new DefaultValuePipe(5)) limit: number) {
    return this.estatisticasService.obterMenusMaisAcessados(limit);
  }

  @Get('relatorio')
  @ApiOperation({ summary: 'Obtém relatório de estatísticas de um período' })
  @ApiQuery({ name: 'dataInicio', required: true, type: String })
  @ApiQuery({ name: 'dataFim', required: true, type: String })
  async obterRelatorioPeriodo(
    @Query('dataInicio', ParseDatePipe) dataInicio: Date,
    @Query('dataFim', ParseDatePipe) dataFim: Date,
  ) {
    return this.estatisticasService.obterRelatorioPeriodo(dataInicio, dataFim);
  }
}
