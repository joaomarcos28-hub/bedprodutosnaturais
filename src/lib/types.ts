export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  category: string | null;
  unit_cost: number;
  sale_price: number;
  central_stock: number;
  low_stock_threshold: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  supervisor_id: string | null;
  created_at: string;
}

export interface SellerStock {
  seller_id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface Sale {
  id: string;
  seller_id: string;
  customer_name: string | null;
  payment_method: string;
  total: number;
  campaign_id: string | null;
  day_number: number | null;
  photo_url: string | null;
  signature_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
}

export interface Movement {
  id: string;
  product_id: string | null;
  type: string;
  quantity: number;
  actor_id: string | null;
  seller_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  number: number;
  name: string | null;
  start_date: string;
  end_date: string;
  supervisor_id: string | null;
  status: string;
  created_at: string;
}

export interface LocationPing {
  id: string;
  seller_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}
