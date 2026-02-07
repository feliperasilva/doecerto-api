import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OngProfilesService } from './ong-profiles.service';
import { UpdateOngProfileDto } from './dto/update-ong-profile.dto';
import { ImageProcessingService } from '../../common/services/image-processing.service';
import { multerAvatarConfig } from '../../config/multer-avatar.config';
import { multerBannerConfig } from '../../config/multer-banner.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from 'generated/prisma';

@Controller('ongs')
export class OngProfilesController {
  constructor(
    private readonly ongProfilesService: OngProfilesService,
    private readonly imageProcessingService: ImageProcessingService, // ✅ Injetado para processamento de imagem
  ) {}

  
  @Post('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  @UseInterceptors(FileInterceptor('file', multerAvatarConfig)) // ✅ Configuração centralizada do Multer
  async createOrUpdate(
    @Body() dto: UpdateOngProfileDto,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let avatarPath: string | undefined;

    // Se um ficheiro for enviado, processamos através do serviço especializado
    if (file) {
      try {
        // ✅ Processar imagem: corta 1:1, redimensiona para 512x512 e comprime via Sharp
        avatarPath = await this.imageProcessingService.processAvatarImage(
          file.path,
          512,
        );
      } catch (error) {
        throw new BadRequestException('Falha ao processar imagem do avatar');
      }
    }
    
    // ✅ Envia para o service o ID da ONG do JWT, o DTO (incluindo categoryIds) e o caminho da imagem
    return this.ongProfilesService.createOrUpdate(user.id, dto, avatarPath);
  }

  /**
   * Upload de banner da ONG (imagem maior para cabeçalho do perfil).
   */
  @Post('me/profile/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  @UseInterceptors(FileInterceptor('file', multerBannerConfig))
  async uploadBanner(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    let bannerPath: string;

    try {
      // Processar imagem: mantém proporção, redimensiona largura para 1920px e comprime
      bannerPath = await this.imageProcessingService.processBannerImage(
        file.path,
        1920,
      );
    } catch (error) {
      throw new BadRequestException('Falha ao processar imagem do banner');
    }

    return this.ongProfilesService.updateBanner(user.id, bannerPath);
  }

  /**
   * Procura o perfil detalhado da ONG autenticada.
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async findMyProfile(@CurrentUser() user: User) {
    return this.ongProfilesService.findOne(Number(user.id));
  }

  /**
   * Procura o perfil detalhado de uma ONG pelo seu ID.
   */
  @Get(':ongId/profile')
  async findOne(@Param('ongId', ParseIntPipe) ongId: number) {
    return this.ongProfilesService.findOne(ongId);
  }
}