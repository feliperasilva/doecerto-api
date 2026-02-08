import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { User } from 'generated/prisma';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  // Criar novo admin (só admin pode criar outros admins)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.createAdmin(createAdminDto);
  }

  // ✅ CORREÇÃO: Rotas específicas (/me) VÊM ANTES das rotas genéricas (/:id)
  // Ver dados do admin logado
  @Get('admins/me')
  getMyAdmin(@CurrentUser() user: User) {
    return this.adminsService.findAdminById(user.id);
  }

  // Ver estatísticas do próprio admin
  @Get('admins/me/stats')
  getMyStats(@CurrentUser() user: User) {
    return this.adminsService.getAdminStats(user.id);
  }

  // ✅ Agora sim, rota genérica vem depois
  @Get('admins/:adminId')
  getAdminById(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.adminsService.findAdminById(adminId);
  }

  // Ver estatísticas de outro admin (admin pode ver de qualquer admin)
  @Get('admins/:adminId/stats')
  getAdminStats(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.adminsService.getAdminStats(adminId);
  }

  // Deletar admin
  @Delete('admins/:adminId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.adminsService.deleteAdmin(adminId);
  }

  // Listar ONGs pendentes de verificação
  @Get('ongs/status/pending')
  getPendingOngs() {
    return this.adminsService.pendentOngs();
  }

  // Listar ONGs verificadas/aprovadas
  @Get('ongs/status/verified')
  getVerifiedOngs() {
    return this.adminsService.verifiedOngs();
  }

  // Listar ONGs rejeitadas
  @Get('ongs/status/rejected')
  getRejectedOngs() {
    return this.adminsService.rejectedOngs();
  }

  // Aprovar ONG
  @Patch('ongs/:ongId/verification/approve')
  @HttpCode(HttpStatus.OK)
  approveOng(
    @Param('ongId', ParseIntPipe) ongId: number,
    @CurrentUser() user: User,
  ) {
    return this.adminsService.approveOng(ongId, user.id);
  }

  // Reprovar ONG
  @Patch('ongs/:ongId/verification/reject')
  @HttpCode(HttpStatus.OK)
  rejectOng(
    @Param('ongId', ParseIntPipe) ongId: number,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.adminsService.rejectOng(ongId, user.id, reason);
  }
}