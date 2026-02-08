import { Module } from '@nestjs/common';
import { OngsBankAccountService } from './ongs-bank-account.service';
import { OngsBankAccountController } from './ongs-bank-account.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OngsBankAccountController],
  providers: [OngsBankAccountService],
  exports: [OngsBankAccountService],
})
export class OngsBankAccountModule {}
