import { PartialType } from '@nestjs/mapped-types';
import { CreateOngsBankAccountDto } from './create-ongs-bank-account.dto';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateOngsBankAccountDto extends PartialType(CreateOngsBankAccountDto) {
    @IsOptional()
    @IsString()
    bankName?: string;

    @IsOptional()
    @IsString()
    @Length(3, 10)
    agencyNumber?: string;

    @IsOptional()
    @IsString()
    @Length(3, 20)
    accountNumber?: string;

    @IsOptional()
    @IsString()
    accountType?: string;
}
