import { Module } from '@nestjs/common';
import { OngProfilesService } from './ong-profiles.service';
import { OngProfilesController } from './ong-profiles.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ImageProcessingService } from '../../common/services/image-processing.service';
import { OngsBankAccountModule } from 'src/modules/ongs-bank-account/ongs-bank-account.module';

@Module({
  imports: [PrismaModule, OngsBankAccountModule],
  controllers: [OngProfilesController],
  providers: [
    OngProfilesService,
    ImageProcessingService,
  ],
})
export class OngProfilesModule {}