import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateOngsBankAccountDto {
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 10)
    agencyNumber: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 20)
    accountNumber: string;

    @IsString()
    @IsNotEmpty()
    accountType: string;
}
