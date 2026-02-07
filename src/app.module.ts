import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { DonorsModule } from './modules/donors/donors.module';
import { OngsModule } from './modules/ongs/ongs.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminsModule } from './modules/admins/admins.module';
import { DonationsModule } from './modules/donations/donations.module';
import { WhishlistItemModule } from './modules/whishlist-items/whishlist-item.module';
import { OngProfilesModule } from './modules/ong-profile/ong-profiles.module';
import { DonorProfileModule } from './modules/donor-profiles/donor-profiles.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OngsBankAccountModule } from './ongs-bank-account/ongs-bank-account.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    DonorsModule,
    OngsModule,
    AuthModule,
    AdminsModule,
    DonationsModule, 
    WhishlistItemModule,
    OngProfilesModule,
    DonorProfileModule,
    RatingsModule,
    CatalogModule,
    CategoriesModule,
    AddressesModule,
    OngsBankAccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
