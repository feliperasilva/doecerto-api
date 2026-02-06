import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOngProfileDto } from './dto/update-ong-profile.dto';

@Injectable()
export class OngProfilesService {
  /**
   * Centralizamos o select para garantir consistência em todos os métodos de busca.
   * Inclui dados do Perfil, Categorias, ONG (CNPJ/Ratings) e Usuário Base.
   */
  private readonly profileSelect = {
    id: true,
    ongId: true,
    bio: true,
    avatarUrl: true,
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
        // Campos de rating para exibição no perfil/vitrine
        averageRating: true,
        numberOfRatings: true,
        // Dados do Usuário associado (Nome/Email)
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Endereço pertence à ONG, não ao OngProfile
        address: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria ou atualiza o perfil da ONG (Upsert).
   * @param userId ID do usuário extraído do JWT (segurança contra IDOR)
   * @param dto Dados de atualização vindos do Body
   * @param avatarPath Caminho da imagem já processada pelo ImageProcessingService
   */
  async createOrUpdate(userId: number, dto: UpdateOngProfileDto, avatarPath?: string) {
    const { categoryIds, ...profileData } = dto;

    // 1. Validar se a ONG (entidade principal) existe
    const ongExists = await this.prisma.ong.findUnique({
      where: { userId },
    });

    if (!ongExists) {
      throw new NotFoundException(`ONG com userId ${userId} não encontrada.`);
    }

    // 2. Preparar objeto de dados para atualização (Update)
    // O Prisma 6 permite usar 'set' para sincronizar relações Many-to-Many de forma atômica
    const updateData = {
      ...profileData,
      // Só sobrescreve a URL do avatar se uma nova imagem foi enviada
      ...(avatarPath && { avatarUrl: avatarPath }),
      categories: {
        // 'set' remove o que não está na lista e adiciona o que é novo
        set: categoryIds?.map((id) => ({ id })),
      },
    };

    // 3. Preparar objeto de dados para criação (Create)
    const createData = {
      ongId: userId,
      ...profileData,
      avatarUrl: avatarPath || null,
      categories: {
        connect: categoryIds?.map((id) => ({ id })),
      },
    };

    try {
      // 4. Executa a operação de Upsert (Update or Insert)
      return await this.prisma.ongProfile.upsert({
        where: { ongId: userId },
        create: createData,
        update: updateData,
        select: this.profileSelect, // Retorna o perfil completo com as novas categorias
      });
    } catch (error) {
      // Captura erros de integridade, como IDs de categorias que não existem no banco
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
    const profile = await this.prisma.ongProfile.findUnique({
      where: { ongId: userId },
      select: this.profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Perfil da ONG não encontrado.');
    }

    return profile;
  }
}