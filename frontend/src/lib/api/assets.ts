/**
 * Asset API service
 * Handles all asset-related API calls
 */

import { apiClient } from '../api-client';
import { Asset, AssetFormData, AssetFilters } from '@tickets/shared';

/**
 * Backend response format (snake_case)
 */
export interface AssetResponse {
  id: number;
  hostname: string;
  client_id: number;
  contact_id: number | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  in_service_date: string;
  warranty_expiration_date: string | null;
  pdq_device_id: string | null;
  screenconnect_session_id: string | null;
  status: 'active' | 'retired';
  retired_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Asset list response with pagination
 */
export interface AssetListResponse {
  assets: AssetResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Asset with populated relationships
 */
export interface AssetWithRelationsResponse extends AssetResponse {
  contact?: {
    id: number;
    name: string;
    email: string;
    client_id: number;
  } | null;
  client?: {
    id: number;
    company_name: string;
  } | null;
}

/**
 * Warranty information response from Lenovo API
 */
export interface WarrantyInfo {
  warranty_expiration_date: string | null;
  in_service_date: string | null;
  service_level: string | null;
  product_name: string | null;
}

/**
 * Asset widget response for ticket detail page
 */
export interface AssetWidgetResponse {
  assets: AssetResponse[];
  contact_name: string | null;
  contact_id: number | null;
  client_id: number;
  total_assets: number;
  unassigned_assets_count: number;
}

/**
 * Transform backend snake_case response to frontend Asset type
 */
function transformAsset(data: AssetResponse | AssetWithRelationsResponse): Asset & {
  contact?: { id: number; name: string; email: string; client_id: number } | null;
  client?: { id: number; company_name: string } | null;
} {
  const asset: Asset & {
    contact?: { id: number; name: string; email: string; client_id: number } | null;
    client?: { id: number; company_name: string } | null;
  } = {
    id: data.id,
    hostname: data.hostname,
    client_id: data.client_id,
    contact_id: data.contact_id,
    manufacturer: data.manufacturer,
    model: data.model,
    serial_number: data.serial_number,
    in_service_date: new Date(data.in_service_date),
    warranty_expiration_date: data.warranty_expiration_date ? new Date(data.warranty_expiration_date) : null,
    pdq_device_id: data.pdq_device_id,
    screenconnect_session_id: data.screenconnect_session_id,
    status: data.status,
    retired_at: data.retired_at ? new Date(data.retired_at) : null,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };

  // Add relationships if present
  if ('contact' in data && data.contact) {
    asset.contact = data.contact;
  }
  if ('client' in data && data.client) {
    asset.client = data.client;
  }

  return asset;
}

/**
 * Transform AssetFormData to backend request format
 */
function transformAssetFormData(data: AssetFormData): Record<string, string | number | null | undefined> {
  return {
    hostname: data.hostname,
    client_id: data.client_id,
    contact_id: data.contact_id || null,
    manufacturer: data.manufacturer || null,
    model: data.model || null,
    serial_number: data.serial_number || null,
    in_service_date: data.in_service_date,
    warranty_expiration_date: data.warranty_expiration_date || null,
    pdq_device_id: data.pdq_device_id || null,
    screenconnect_session_id: data.screenconnect_session_id || null,
  };
}

export const assetsApi = {
  /**
   * Get all assets with optional filters
   */
  getAll: async (filters?: AssetFilters): Promise<Asset[]> => {
    const params: Record<string, string | number> = {};

    if (filters?.client_id) params.client_id = filters.client_id;
    if (filters?.contact_id) params.contact_id = filters.contact_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;

    const response = await apiClient.get<AssetListResponse>('/api/assets', params);
    return response.assets.map(transformAsset);
  },

  /**
   * Get asset by ID
   */
  getById: async (id: number): Promise<Asset & {
    contact?: { id: number; name: string; email: string; client_id: number } | null;
    client?: { id: number; company_name: string } | null;
  }> => {
    const data = await apiClient.get<AssetWithRelationsResponse>(`/api/assets/${id}`);
    return transformAsset(data);
  },

  /**
   * Create new asset
   */
  create: async (asset: AssetFormData): Promise<Asset> => {
    const data = await apiClient.post<AssetResponse>(
      '/api/assets',
      transformAssetFormData(asset)
    );
    return transformAsset(data);
  },

  /**
   * Update existing asset
   */
  update: async (id: number, asset: AssetFormData): Promise<Asset> => {
    const data = await apiClient.put<AssetResponse>(
      `/api/assets/${id}`,
      transformAssetFormData(asset)
    );
    return transformAsset(data);
  },

  /**
   * Retire asset (soft delete)
   */
  retire: async (id: number): Promise<void> => {
    await apiClient.delete<{ message: string; asset_id: number; retired_at: string }>(
      `/api/assets/${id}`
    );
  },

  /**
   * Permanently delete asset (hard delete)
   */
  permanentDelete: async (id: number): Promise<void> => {
    await apiClient.delete<{ message: string }>(`/api/assets/${id}/permanent`);
  },

  /**
   * Reactivate retired asset
   */
  reactivate: async (id: number): Promise<Asset> => {
    const data = await apiClient.post<{ message: string; asset_id: number; asset: AssetResponse }>(
      `/api/assets/${id}/reactivate`,
      {}
    );
    return transformAsset(data.asset);
  },

  /**
   * Lookup Lenovo warranty information (requires asset ID)
   */
  lookupLenovoWarranty: async (assetId: number, serialNumber: string): Promise<WarrantyInfo> => {
    const data = await apiClient.post<WarrantyInfo>(
      `/api/assets/${assetId}/warranty-lookup`,
      { serial_number: serialNumber }
    );
    return data;
  },

  /**
   * Lookup Lenovo warranty information by serial number only (no asset ID required)
   */
  lookupLenovoWarrantyBySerial: async (serialNumber: string): Promise<WarrantyInfo> => {
    const data = await apiClient.post<WarrantyInfo>(
      '/api/assets/warranty-lookup',
      { serial_number: serialNumber }
    );
    return data;
  },

  /**
   * Get asset widget data for ticket detail page
   * Returns up to 2 assets for the ticket's contact with total count and unassigned assets info
   */
  getAssetWidget: async (ticketId: number): Promise<{
    assets: Asset[];
    contact_name: string | null;
    contact_id: number | null;
    client_id: number;
    total_assets: number;
    unassigned_assets_count: number;
  }> => {
    const data = await apiClient.get<AssetWidgetResponse>(`/api/assets/widget/${ticketId}`);
    return {
      assets: data.assets.map(transformAsset),
      contact_name: data.contact_name,
      contact_id: data.contact_id,
      client_id: data.client_id,
      total_assets: data.total_assets,
      unassigned_assets_count: data.unassigned_assets_count,
    };
  },
};
