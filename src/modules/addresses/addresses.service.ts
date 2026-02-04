import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import type { User, Address as PrismaAddress } from 'generated/prisma';

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /**
   * Cria um novo endereço e automaticamente geocodifica usando a API Nominatim
   */
  async create(
    createAddressDto: CreateAddressDto,
    user: User,
  ): Promise<AddressResponseDto> {
    try {
      let donorId = createAddressDto.donorId;
      let ongId = createAddressDto.ongId;

      if (user.role === 'donor') {
        donorId = user.id;
        ongId = undefined;
      } else if (user.role === 'ong') {
        ongId = user.id;
        donorId = undefined;
      } else if (user.role === 'admin') {
        if (!donorId && !ongId) {
          throw new BadRequestException(
            'Informe um donorId ou ongId para vincular o endereço',
          );
        }

        if (donorId && ongId) {
          throw new BadRequestException(
            'Informe apenas um: donorId ou ongId',
          );
        }
      } else {
        throw new BadRequestException('Usuário inválido para cadastro de endereço');
      }

      if (donorId) {
        const donor = await this.prisma.donor.findUnique({
          where: { userId: donorId },
        });
        if (!donor) {
          throw new BadRequestException('Doador não encontrado');
        }
      }

      if (ongId) {
        const ong = await this.prisma.ong.findUnique({
          where: { userId: ongId },
        });
        if (!ong) {
          throw new BadRequestException('ONG não encontrada');
        }
      }

      const fullAddress = this.buildFullAddress(createAddressDto);

      // Se não possui coordenadas, tenta geocodificar
      let latitude = createAddressDto.latitude;
      let longitude = createAddressDto.longitude;

      if (!latitude || !longitude) {
        try {
          const geocodeResult = await this.geocodingService.geocode(
            fullAddress,
          );
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
        } catch (error) {
          // Se a geocodificação falhar, continua sem coordenadas
          console.warn(
            'Aviso: Falha ao geocodificar endereço automaticamente',
            error.message,
          );
        }
      }

      const data = {
        ...createAddressDto,
        donorId,
        ongId,
        latitude,
        longitude,
      };

      let address: PrismaAddress | null = null;
      if (donorId) {
        const existing = await this.prisma.address.findUnique({
          where: { donorId },
        });
        address = existing
          ? await this.prisma.address.update({
              where: { donorId },
              data,
            })
          : await this.prisma.address.create({ data });
      }

      if (ongId) {
        const existing = await this.prisma.address.findUnique({
          where: { ongId },
        });
        address = existing
          ? await this.prisma.address.update({
              where: { ongId },
              data,
            })
          : await this.prisma.address.create({ data });
      }

      if (!address) {
        throw new InternalServerErrorException('Erro ao criar endereço');
      }

      return this.mapToResponseDto(address);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao criar endereço',
      );
    }
  }

  /**
   * Busca todos os endereços
   */
  async findAll(): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany();
    return addresses.map((address) => this.mapToResponseDto(address));
  }

  /**
   * Busca um endereço específico pelo ID
   */
  async findOne(id: number): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(address);
  }

  /**
   * Busca endereço de um doador
   */
  async findByDonorId(donorId: number): Promise<AddressResponseDto | null> {
    const address = await this.prisma.address.findUnique({
      where: { donorId },
    });

    if (!address) {
      return null;
    }

    return this.mapToResponseDto(address);
  }

  /**
   * Busca endereço de uma ONG
   */
  async findByOngId(ongId: number): Promise<AddressResponseDto | null> {
    const address = await this.prisma.address.findUnique({
      where: { ongId },
    });

    if (!address) {
      return null;
    }

    return this.mapToResponseDto(address);
  }

  /**
   * Atualiza um endereço e regeocodifica se necessário
   */
  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
    user: User,
  ): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    try {
      if (user.role !== 'admin') {
        const isOwnerDonor = user.role === 'donor' && address.donorId === user.id;
        const isOwnerOng = user.role === 'ong' && address.ongId === user.id;
        if (!isOwnerDonor && !isOwnerOng) {
          throw new ForbiddenException('Você não pode atualizar este endereço');
        }
      }

      // Prepara os dados da atualização (não permite trocar vínculo)
      const { donorId, ongId, ...dataToUpdate } = updateAddressDto;

      // Se houver mudança no endereço e não houver coordenadas fornecidas, regeocodifica
      const hasAddressChange =
        updateAddressDto.street ||
        updateAddressDto.number ||
        updateAddressDto.neighborhood ||
        updateAddressDto.city ||
        updateAddressDto.state ||
        updateAddressDto.zipCode;

      if (
        hasAddressChange &&
        !updateAddressDto.latitude &&
        !updateAddressDto.longitude
      ) {
        const mergedAddress = { ...address, ...updateAddressDto };
        const fullAddress = this.buildFullAddress(mergedAddress);

        try {
          const geocodeResult = await this.geocodingService.geocode(
            fullAddress,
          );
          dataToUpdate.latitude = geocodeResult.latitude;
          dataToUpdate.longitude = geocodeResult.longitude;
        } catch (error) {
          console.warn(
            'Aviso: Falha ao regeocodificar endereço',
            error.message,
          );
        }
      }

      const updatedAddress = await this.prisma.address.update({
        where: { id },
        data: dataToUpdate,
      });

      return this.mapToResponseDto(updatedAddress);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao atualizar endereço',
      );
    }
  }

  /**
   * Deleta um endereço
   */
  async remove(id: number, user: User): Promise<void> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    if (user.role !== 'admin') {
      const isOwnerDonor = user.role === 'donor' && address.donorId === user.id;
      const isOwnerOng = user.role === 'ong' && address.ongId === user.id;
      if (!isOwnerDonor && !isOwnerOng) {
        throw new ForbiddenException('Você não pode remover este endereço');
      }
    }

    await this.prisma.address.delete({
      where: { id },
    });
  }

  /**
   * Geocodifica um endereço (retorna apenas coordenadas)
   */
  async geocodeAddress(
    createAddressDto: CreateAddressDto,
  ): Promise<GeocodeAddressDto> {
    const fullAddress = this.buildFullAddress(createAddressDto);
    return this.geocodingService.geocode(fullAddress);
  }

  /**
   * Constrói um endereço completo formatado para a API Nominatim
   */
  private buildFullAddress(address: CreateAddressDto | any): string {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode,
      address.country || 'Brasil',
    ];

    return parts.filter((part) => part).join(', ');
  }

  /**
   * Mapeia a entidade Address para o DTO de resposta
   */
  private mapToResponseDto(address: any): AddressResponseDto {
    return {
      id: address.id,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      donorId: address.donorId,
      ongId: address.ongId,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
