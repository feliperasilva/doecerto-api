import { Injectable, BadRequestException } from '@nestjs/common';
interface NominatimResponse {
  lat: string;
  lon: string;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

@Injectable()
export class GeocodingService {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly userAgent = 'DoeCerto-API (https://doecerto.com.br)';

  /**
   * Converte um endereço em coordenadas (latitude e longitude)
   * usando a API Nominatim do OpenStreetMap
   */
  async geocode(fullAddress: string): Promise<GeocodeResult> {
    try {
      const params = new URLSearchParams({
        q: fullAddress,
        format: 'json',
        limit: '1',
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${this.nominatimUrl}?${params.toString()}`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new BadRequestException(
          'Erro ao conectar com serviço de geocodificação',
        );
      }

      const data = (await response.json()) as NominatimResponse[];

      if (!data || data.length === 0) {
        throw new BadRequestException(
          'Endereço não encontrado. Verifique os dados fornecidos.',
        );
      }

      const result = data[0];

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro ao geocodificar endereço. Tente novamente mais tarde.',
      );
    }
  }
}
