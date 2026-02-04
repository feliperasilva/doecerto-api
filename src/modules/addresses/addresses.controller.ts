import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from 'generated/prisma';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor', 'ong', 'admin')
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @CurrentUser() user: User,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(createAddressDto, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<AddressResponseDto[]> {
    return this.addressesService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<AddressResponseDto> {
    return this.addressesService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor', 'ong', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @CurrentUser() user: User,
  ): Promise<AddressResponseDto> {
    return this.addressesService.update(+id, updateAddressDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor', 'ong', 'admin')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.addressesService.remove(+id, user);
  }

  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  async geocodeAddress(
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<GeocodeAddressDto> {
    return this.addressesService.geocodeAddress(createAddressDto);
  }

  @Get('donor/:donorId')
  @HttpCode(HttpStatus.OK)
  async findByDonorId(
    @Param('donorId') donorId: string,
  ): Promise<AddressResponseDto | null> {
    return this.addressesService.findByDonorId(+donorId);
  }

  @Get('ong/:ongId')
  @HttpCode(HttpStatus.OK)
  async findByOngId(@Param('ongId') ongId: string): Promise<AddressResponseDto | null> {
    return this.addressesService.findByOngId(+ongId);
  }
}
