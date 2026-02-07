import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCatalogDto } from './dto/get-catalog.dto';
import { CatalogSectionDto, NgoItemDto } from './dto/catalog-response.dto';
import { sortCatalogItems } from 'src/common/utils/sorting.util';

// Tipo interno que inclui matchCount para ordenação
type NgoItemWithMatch = NgoItemDto & { matchCount: number };

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Método principal que orquestra as diferentes seções do catálogo
   * Se houver searchTerm, retorna uma única lista filtrada
   * Caso contrário, retorna 4 listas com ordenações diferentes
   */
  async getCatalog(filters: GetCatalogDto): Promise<CatalogSectionDto[] | CatalogSectionDto> {
    // Se houver termo de pesquisa, retorna uma única lista filtrada
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchResults = await this.searchCatalog(filters);
      return {
        title: `Resultados para "${filters.searchTerm}"`,
        type: 'search',
        items: this.sanitizeForResponse(searchResults),
      };
    }

    // Caso contrário, executa todas as queries em paralelo para não bloquear o event loop
    const [topRated, newest, topFavored, oldest] = await Promise.all([
      this.getTopRated(filters),
      this.getNewest(filters),
      this.getTopFavored(filters),
      this.getOldest(filters),
    ]);

    return [
      { title: 'Melhor Avaliadas', type: 'topRated', items: this.sanitizeForResponse(topRated) },
      { title: 'Mais Recentes', type: 'newest', items: this.sanitizeForResponse(newest) },
      { title: 'Mais Favoritas', type: 'topFavored', items: this.sanitizeForResponse(topFavored) },
      { title: 'Mais Antigas', type: 'oldest', items: this.sanitizeForResponse(oldest) },
    ];
  }

  // --- MÉTODOS DE ACESSO PÚBLICO PARA SEÇÕES ESPECÍFICAS ---

  /**
   * Busca no catálogo por termo (nome de ONG ou categoria)
   */
  private async searchCatalog(filters: GetCatalogDto): Promise<NgoItemWithMatch[]> {
    const { searchTerm, categoryIds } = filters;
    const take = filters.limit || 20;
    const skip = filters.offset || 0;

    const whereClause: any = {
      verificationStatus: 'verified',
      OR: [
        {
          user: {
            name: { search: searchTerm },
          },
        },
        {
          profile: {
            categories: {
              some: {
                name: { contains: searchTerm },
              },
            },
          },
        },
      ],
    };

    // Se houver filtro de categorias, adiciona AND com as categorias
    if (categoryIds && categoryIds.length > 0) {
      whereClause.profile = {
        categories: {
          some: { id: { in: categoryIds } },
        },
      };
    }

    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true },
        },
        profile: {
          include: { categories: true },
        },
      },
      orderBy: [{ averageRating: 'desc' }, { userId: 'asc' }],
      skip,
      take,
    });

    return ongs.map((ong) => this.mapToDto(ong, categoryIds));
  }

  private async getTopRated(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'averageRating', 'rating.average', 'desc');
  }

  private async getNewest(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'createdAt', 'createdAt', 'desc');
  }

  private async getTopFavored(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'numberOfRatings', 'rating.count', 'desc');
  }

  private async getOldest(filters: GetCatalogDto) {
    return this.findWithPriority(filters, 'createdAt', 'createdAt', 'asc');
  }

  /**
   * Lógica central de busca com ranking de prioridade por causas/categorias
   * @param prismaField - Campo do modelo Prisma (banco de dados)
   * @param dtoField - Campo do DTO (para re-ordenação em memória)
   */
  private async findWithPriority(
    filters: GetCatalogDto,
    prismaField: string,
    dtoField: string,
    orderByDirection: 'asc' | 'desc',
  ): Promise<NgoItemWithMatch[]> {
    const { categoryIds } = filters;
    const take = filters.limit || 10;
    const skip = filters.offset || 0;

    // 1. Construção do Filtro
    const whereClause: any = {
      verificationStatus: 'verified',
    };

    if (categoryIds && categoryIds.length > 0) {
      whereClause.profile = {
        categories: {
          some: { id: { in: categoryIds } },
        },
      };
    }

    // 2. Busca no Prisma
    // Se houver filtros de categorias, buscamos amostra maior para re-ranquear no código
    const shouldFetchMore = categoryIds && categoryIds.length > 0;
    const fetchLimit = shouldFetchMore ? Math.max(take * 5, 50) : take;

    const ongs = await this.prisma.ong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        profile: {
          select: { categories: true, avatarUrl: true },
        },
      },
      orderBy: [
        { [prismaField]: orderByDirection },
        { userId: 'asc' }, // Desempate determinístico usando PK
      ],
      // Paginação no DB apenas se não houver ranking de match
      skip: shouldFetchMore ? 0 : skip,
      take: fetchLimit,
    });

    // 3. Mapeamento para DTO
    let mappedResults = ongs.map((ong) => this.mapToDto(ong, categoryIds));

    // 4. Re-ordenação por Prioridade + Paginação Manual (Se houver filtro)
    if (shouldFetchMore) {
      mappedResults = sortCatalogItems(mappedResults, dtoField, orderByDirection);
      mappedResults = mappedResults.slice(skip, skip + take);
    }

    return mappedResults;
  }

  /**
   * Transforma a entidade do Prisma para o DTO de Resposta
   * Retorna também o matchCount internamente para ordenação
   */
  private mapToDto(ong: any, filterCategoryIds?: number[]): NgoItemWithMatch {
    const categories = ong.profile?.categories || [];
    
    // Calcula quantos IDs batem com o filtro para o ranking (uso interno)
    const matchCount = filterCategoryIds?.length
      ? categories.filter((c) => filterCategoryIds.includes(c.id)).length
      : 0;

    return {
      id: ong.userId,
      name: ong.user?.name || 'ONG sem nome',
      avatarUrl: ong.profile?.avatarUrl || null,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      createdAt: ong.createdAt,
      matchCount, // Usado apenas para ordenação interna
    };
  }

  /**
   * Remove campos internos antes de retornar ao cliente
   */
  private sanitizeForResponse(items: NgoItemWithMatch[]): NgoItemDto[] {
    return items.map(({ matchCount, ...item }) => item);
  }
}