import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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

     
      const redirectUrl = `http://localhost:3000/auth?token=${authResult.access_token}`;
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
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req) {
    return {
      message: 'Token válido',
      user: req.user,
    };
  }
}
