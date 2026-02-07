import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { unlink } from 'fs/promises';

@Injectable()
export class ImageProcessingService {
  /**
   * Processa imagem para avatar: corta para 1:1, redimensiona e comprime
   */
  async processAvatarImage(filePath: string, size: number = 512): Promise<string> {
    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png|webp)$/i,
        '-processed.jpg',
      );

      await sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(outputPath);

      await unlink(filePath);

      return outputPath;
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Processa imagem para banner: redimensiona largura e comprime mantendo proporção
   */
  async processBannerImage(filePath: string, width: number = 1920): Promise<string> {
    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png|webp)$/i,
        '-processed.jpg',
      );

      await sharp(filePath)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(outputPath);

      await unlink(filePath);

      return outputPath;
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process banner image: ${error.message}`);
    }
  }

  /**
   * Valida se a imagem está na proporção 1:1
   */
  async validateAspectRatio(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        return false;
      }

      const aspectRatio = width / height;
      const tolerance = 0.05;

      return Math.abs(aspectRatio - 1) <= tolerance;
    } catch (error) {
      return false;
    }
  }

  /**
   * Processa comprovante de pagamento (imagem): comprime mantendo proporção
   * PDF não é processado, apenas retorna o caminho
   */
  async processPaymentProof(filePath: string): Promise<string> {
    // Se for PDF, não processa, apenas retorna o caminho
    if (filePath.toLowerCase().endsWith('.pdf')) {
      return filePath;
    }

    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png)$/i,
        '-processed.jpg',
      );

      // Comprime a imagem mantendo proporção original
      await sharp(filePath)
        .resize(1200, 1200, {
          fit: 'inside', // Mantém proporção, não corta
          withoutEnlargement: true, // Não aumenta se já for menor
        })
        .jpeg({
          quality: 80, // Boa compressão
          progressive: true,
        })
        .toFile(outputPath);

      // Remove arquivo original
      await unlink(filePath);

      return outputPath;
    } catch (error) {
      // Se falhar, remove o arquivo original
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process payment proof: ${error.message}`);
    }
  }
}