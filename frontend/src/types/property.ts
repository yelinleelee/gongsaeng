export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "guesthouse"
  | "hotel"
  | "unique";

export type RoomType = "entire" | "private" | "shared";

export type PropertyHost = {
  id: number;
  email: string;
  name: string;
  avatar: string;
};

export type Property = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  host_id: number;
  host: PropertyHost;

  title: string;
  description: string;
  property_type: PropertyType;
  room_type: RoomType;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;

  price: number;
  currency: string;

  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;

  amenities: string[];
  images: string[];

  is_available: boolean;
  rating: number;
  review_count: number;
};

export type PropertyFilters = {
  city?: string;
  property_type?: PropertyType;
  min_price?: number;
  max_price?: number;
  guests?: number;
};

export type PropertyInput = {
  title: string;
  description?: string;
  property_type: PropertyType;
  room_type: RoomType;
  max_guests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  price: number;
  currency?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  images?: string[];
  is_available?: boolean;
};
