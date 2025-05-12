import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // O Google OAuth redireciona para o callback
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    // Após autenticação bem-sucedida, recebemos o usuário do Guard
    const user = req.user as User;

    // Chamamos o serviço de login para gerar o token JWT
    const authResult = await this.authService.login(user);

    // Você pode redirecionar o usuário para a sua aplicação frontend
    // com o token, ou simplesmente retornar o token como resposta

    // Opção 1: Redirecionamento para o frontend
    // return res.redirect(`${process.env.FRONTEND_URL}?token=${authResult.access_token}`);

    // Opção 2: Retornar token diretamente (para APIs)
    console.log('User authenticated:', user);
    console.log('JWT Token:', authResult.access_token);
    
    return res.status(200).json(authResult);
  }
}
