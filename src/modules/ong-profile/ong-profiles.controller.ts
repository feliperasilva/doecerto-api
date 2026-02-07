import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFiles, 
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OngProfilesService } from './ong-profiles.service';
import { UpdateOngProfileDto } from './dto/update-ong-profile.dto';
import { ImageProcessingService } from '../../common/services/image-processing.service';
import { diskStorage } from 'multer';
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, callback) => {
          const { ext } = require('path').parse(file.originalname);
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    })
  )
  async createOrUpdate(
    @Body() dto: UpdateOngProfileDto,
    @CurrentUser() user: User,
    @UploadedFiles() files?: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    let avatarPath: string | undefined;
    let bannerPath: string | undefined;

    // Processar avatar se fornecido
    if (files?.avatar?.[0]) {
      try {
        avatarPath = await this.imageProcessingService.processAvatarImage(
          files.avatar[0].path,
          512,
        );
      } catch (error) {
        throw new BadRequestException('Falha ao processar imagem do avatar');
      }
    }

    // Processar banner se fornecido
    if (files?.banner?.[0]) {
      try {
        bannerPath = await this.imageProcessingService.processBannerImage(
          files.banner[0].path,
          1920,
        );
      } catch (error) {
        throw new BadRequestException('Falha ao processar imagem do banner');
      }
    }

    return this.ongProfilesService.createOrUpdate(user.id, dto, avatarPath, bannerPath);
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