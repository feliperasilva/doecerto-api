import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOngsBankAccountDto } from './dto/create-ongs-bank-account.dto';
import { UpdateOngsBankAccountDto } from './dto/update-ongs-bank-account.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OngsBankAccountService {

  constructor(private readonly prisma: PrismaService) {}


  private async getOngProfileIdByOngId(ongId: number): Promise<number> {
    const ongProfile = await this.prisma.ongProfile.findFirst({ where: { ongId } });
    if (!ongProfile) throw new NotFoundException('ONG profile not found');
    return ongProfile.id;
  }

  async create(createOngsBankAccountDto: CreateOngsBankAccountDto, ongId: number) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    const { bankName, agencyNumber, accountNumber, accountType, pixKey } = createOngsBankAccountDto;
    return await this.prisma.ongBankAccount.create({
      data: {
        bankName,
        agencyNumber,
        accountNumber,
        accountType,
        pixKey,
        ongProfile: {
          connect: { id: ongProfileId },
        },
      },
    });
  }


  async findAll(ongId: number) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    return await this.prisma.ongBankAccount.findMany({
      where: { ongProfileId },
    });
  }


  async findOne(ongId: number) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    return await this.prisma.ongBankAccount.findFirst({
      where: {
        ongProfileId,
      },
    });
  }

    /**
   * Retorna apenas dados seguros da conta bancária de uma ONG
   */
  async getPublicBankAccounts(ongId: number) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    const accounts = await this.prisma.ongBankAccount.findMany({ where: { ongProfileId } });
    return accounts.map(account => ({
      bankName: account.bankName,
      agencyNumber: account.agencyNumber,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      pixKey: account.pixKey,
    }));
  }


  async update(ongId: number, updateOngsBankAccountDto: UpdateOngsBankAccountDto) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    // Busca a conta bancária associada ao perfil
    const bankAccount = await this.prisma.ongBankAccount.findFirst({ where: { ongProfileId } });
    if (!bankAccount) throw new NotFoundException('Bank account not found');
    return await this.prisma.ongBankAccount.update({
      where: {
        id: bankAccount.id,
        ongProfileId,
      },
      data: {
        ...updateOngsBankAccountDto,
      },
    });
  }

  async remove(ongId: number) {
    const ongProfileId = await this.getOngProfileIdByOngId(ongId);
    const bankAccount = await this.prisma.ongBankAccount.findFirst({ where: { ongProfileId } });
    if (!bankAccount) throw new NotFoundException('Bank account not found');
    return await this.prisma.ongBankAccount.delete({
      where: {
        id: bankAccount.id,
        ongProfileId,
      },
    });
  }
}
