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
    try {
      // Após autenticação bem-sucedida, recebemos o usuário do Guard
      const user = req.user as User;

      // Chamamos o serviço de login para gerar o token JWT
      const authResult = await this.authService.login(user);

      console.log('User authenticated:', user.email);
      console.log('JWT Token generated'); // Redirecionar para a página do painel com o token
      const redirectUrl = `http://localhost:3000/?token=${authResult.access_token}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Erro no callback do Google:', error);

      // Redirecionar com erro
      const errorMessage = encodeURIComponent(
        'Erro na autenticação. Tente novamente.',
      );
    }
  }

  @Get('verify')
  async verifyToken(@Req() req) {
    // Endpoint para verificar se o token é válido
    // Este endpoint será protegido automaticamente pelo JwtAuthGuard quando usado
    return {
      message: 'Token válido',
      user: req.user,
    };
  }
}
