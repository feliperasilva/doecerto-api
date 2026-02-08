import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import type { User } from 'generated/prisma';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  private readonly TOKEN_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authData = await this.authService.signIn(loginDto);
    this.setTokenCookie(response, authData.accessToken);
    return {
      message: 'Login successful',
      accessToken: authData.accessToken,
      user: authData.user
    };
  }

  @Post('register/donor')
  @HttpCode(HttpStatus.CREATED)
  async signUpDonor(
    @Body() registerDonorDto: RegisterDonorDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authData = await this.authService.signUpDonor(registerDonorDto);
    this.setTokenCookie(response, authData.accessToken);
    return {
      message: 'Donor registered successfully',
      accessToken: authData.accessToken,
      user: authData.user,
      profile: authData.profile
    };
  }

  @Post('register/ong')
  @HttpCode(HttpStatus.CREATED)
  async signUpOng(
    @Body() registerOngDto: RegisterOngDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authData = await this.authService.signUpOng(registerOngDto);
    this.setTokenCookie(response, authData.accessToken);
    return {
      message: 'ONG registered successfully',
      accessToken: authData.accessToken,
      user: authData.user,
      profile: authData.profile
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'Se o email existir na plataforma, um link de recuperação será enviado',
    };
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Body() validateTokenDto: ValidateTokenDto) {
    const isValid = await this.authService.validateResetToken(
      validateTokenDto.token,
    );
    return { valid: isValid };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Senha atualizada com sucesso' };
  }

  private setTokenCookie(response: Response, accessToken: string): void {
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + this.TOKEN_EXPIRY),
    });
  }
}
