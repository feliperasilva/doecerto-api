export class AddressResponseDto {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  donorId?: number | null;
  ongId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
