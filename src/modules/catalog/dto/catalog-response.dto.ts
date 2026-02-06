// src/catalog/dto/catalog-response.dto.ts

export class CategoryDto {
  id: number;
  name: string;
}

export class NgoItemDto {
  id: number;
  name: string;
  avatarUrl: string | null;
  categories: CategoryDto[];
  createdAt: Date;
}

export class CatalogSectionDto {
  title: string;
  type: string;
  items: NgoItemDto[];
}