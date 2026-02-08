import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOngProfileDto } from './dto/update-ong-profile.dto';
import { OngsBankAccountService } from 'src/modules/ongs-bank-account/ongs-bank-account.service';

@Injectable()
export class OngProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ongsBankAccountService: OngsBankAccountService,
  ) {}
  /**
   * Centralizamos o select para garantir consistência em todos os métodos de busca.
   * Inclui dados do Perfil, Categorias, ONG (CNPJ/Ratings) e Usuário Base.
   */
  private readonly profileSelect = {
    id: true,
    ongId: true,
    bio: true,
    avatarUrl: true,
    bannerUrl: true,
    contactNumber: true,
    websiteUrl: true,
    // Relacionamento Many-to-Many com Categorias (Causas)
    categories: {
      select: {
        id: true,
        name: true,
      },
    },
    // Relacionamento One-to-One com a entidade ONG
    ong: {
      select: {
        userId: true,
        cnpj: true,
        averageRating: true,
        numberOfRatings: true,
        // Dados do Usuário associado (Nome/Email)
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        // Endereço pertence à ONG, não ao OngProfile
        address: true,
      },
    },
  } as const;


  /**
   * Cria ou atualiza o perfil da ONG (Upsert).
   * @param userId ID do usuário extraído do JWT (segurança contra IDOR)
   * @param dto Dados de atualização vindos do Body
   * @param avatarPath Caminho da imagem de avatar já processada pelo ImageProcessingService
   * @param bannerPath Caminho da imagem de banner já processada pelo ImageProcessingService
   */
  async createOrUpdate(userId: number, dto: UpdateOngProfileDto, avatarPath?: string, bannerPath?: string) {
    const { categoryIds, bankAccount, ...profileData } = dto;

    // 1. Validar se a ONG (entidade principal) existe
    const ongExists = await this.prisma.ong.findUnique({
      where: { userId },
    });

    if (!ongExists) {
      throw new NotFoundException(`ONG com userId ${userId} não encontrada.`);
    }

    // 2. Preparar objeto de dados para atualização (Update)
    const updateData = {
      ...profileData,
      // Só sobrescreve as URLs se novas imagens foram enviadas
      ...(avatarPath && { avatarUrl: avatarPath }),
      ...(bannerPath && { bannerUrl: bannerPath }),
      categories: {
        set: categoryIds?.map((id) => ({ id })),
      },
    };

    // 3. Preparar objeto de dados para criação (Create)
    const createData = {
      ongId: userId,
      ...profileData,
      avatarUrl: avatarPath || null,
      bannerUrl: bannerPath || null,
      categories: {
        connect: categoryIds?.map((id) => ({ id })),
      },
    };

    try {
      // 4. Executa a operação de Upsert (Update or Insert)
      const profile = await this.prisma.ongProfile.upsert({
        where: { ongId: userId },
        create: createData,
        update: updateData,
        select: this.profileSelect,
      });

      // 5. Se vier dados de conta bancária, faz create/update da conta bancária
      if (bankAccount) {
        await this.ongsBankAccountService.create(bankAccount, userId);
      }

      return profile;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao processar a atualização do perfil. Verifique se os dados estão corretos.',
      );
    }
  }

  /**
   * Busca os detalhes completos de um perfil
   * @param userId ID da ONG/Usuário
   */
  async findOne(userId: number) {
    // Busca o perfil da ONG
    const profile = await this.prisma.ongProfile.findUnique({
      where: { ongId: userId },
      select: this.profileSelect,
    });
    if (!profile) {
      throw new NotFoundException('Perfil da ONG não encontrado.');
    }

    // Busca a quantidade de doações recebidas
    const receivedDonations = await this.prisma.donation.count({
      where: { ongId: userId },
    });

    // Busca o endereço detalhado, se existir
    const address = await this.getOngAddress(profile.ong?.address);

    // Busca dados públicos da conta bancária de forma assíncrona
    const bankAccounts = await this.ongsBankAccountService.getPublicBankAccounts(userId);
    // Se houver apenas uma conta, adiciona pixKey no root do perfil para facilitar acesso rápido
    const pixKey = Array.isArray(bankAccounts) && bankAccounts.length === 1 ? bankAccounts[0].pixKey : undefined;
    // Retorna perfil + dados bancários
    return {
      ...this.cleanProfileResponse(profile, receivedDonations, address),
      bankAccounts,
      pixKey,
    };
  }

  /**
   * Busca e normaliza o endereço da ONG
   */
  private async getOngAddress(rawAddress: any): Promise<{
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null> {
    if (!rawAddress || typeof rawAddress !== 'object') return null;
    // Se já está populado
    if ('street' in rawAddress) {
      const {
        street = '',
        number = '',
        complement = null,
        neighborhood = '',
        city = '',
        state = '',
        zipCode = '',
        country = '',
        latitude = null,
        longitude = null,
      } = rawAddress;
      return { street, number, complement, neighborhood, city, state, zipCode, country, latitude, longitude };
    }
    // Se só tem id, busca do banco
    if ('id' in rawAddress && rawAddress.id) {
      return await this.prisma.address.findUnique({
        where: { id: rawAddress.id },
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });
    }
    return null;
  }

  /**
   * Limpa e organiza a resposta do perfil da ONG para evitar dados duplicados e redundantes
   */
  private cleanProfileResponse(
    profile: any,
    receivedDonations = 0,
    address?: {
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
    } | null
  ) {
    if (!profile) return null;
    const {
      ongId,
      bio,
      avatarUrl,
      contactNumber,
      websiteUrl,
      categories,
      ong,
    } = profile;
    return {
      id: ongId,
      name: ong?.user?.name || null,
      email: ong?.user?.email || null,
      avatarUrl: avatarUrl || null,
      about: bio || null,
      contactNumber: contactNumber || null,
      websiteUrl: websiteUrl || null,
      receivedDonations,
      rating: {
        average: ong?.averageRating || 0,
        count: ong?.numberOfRatings || 0,
      },
      categories: categories?.map((c: any) => ({ id: c.id, name: c.name })) || [],
      address: address ?? null,
      createdAt: ong?.user?.createdAt || null,
      updatedAt: ong?.user?.updatedAt || null,
    };
  }
}