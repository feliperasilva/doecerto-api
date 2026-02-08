
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { OngsBankAccountService } from './ongs-bank-account.service';
import { CreateOngsBankAccountDto } from './dto/create-ongs-bank-account.dto';
import { UpdateOngsBankAccountDto } from './dto/update-ongs-bank-account.dto';
import type { User } from 'generated/prisma';



@Controller('ongs/bank-account')
export class OngsBankAccountController {
  constructor(private readonly ongsBankAccountService: OngsBankAccountService) {}

  /**
   * Cria ou atualiza a conta bancária da ONG autenticada
   */
  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async createOrUpdate(
    @Body() dto: CreateOngsBankAccountDto,
    @CurrentUser() user: User,
  ) {
    return this.ongsBankAccountService.create(dto, user.id);
  }

  /**
   * Retorna todas as contas bancárias da ONG autenticada
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async findMyAccounts(@CurrentUser() user: User) {
    return this.ongsBankAccountService.findAll(user.id);
  }

  /**
   * Retorna dados seguros da conta bancária de uma ONG para tela de transação
   */
  @Get(':ongId')
  @UseGuards(JwtAuthGuard) // Permite acesso público, mas requer JWT para identificar ONG
  async getPublicBankAccount(@Param('ongId', ParseIntPipe) ongId: number) {
    return this.ongsBankAccountService.getPublicBankAccounts(ongId);
  }

  /**
   * Atualiza a conta bancária da ONG autenticada
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async update(
    @Body() dto: UpdateOngsBankAccountDto,
    @CurrentUser() user: User,
  ) {
    return this.ongsBankAccountService.update(user.id, dto);
  }

  /**
   * Remove a conta bancária da ONG autenticada
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async remove(@CurrentUser() user: User) {
    return this.ongsBankAccountService.remove(user.id);
  }
}
