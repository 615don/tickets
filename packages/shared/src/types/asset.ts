/**
 * Asset Management Type Definitions
 * Epic 15: Asset Management Integration
 *
 * Defines TypeScript interfaces for asset data structures used across
 * frontend and backend for client hardware/device inventory management.
 */

/**
 * Asset database entity
 * Represents a single hardware/device asset in the system
 */
export interface Asset {
  /** Unique asset identifier (auto-generated) */
  id: number;

  /** Device hostname or computer name (required) */
  hostname: string;

  /** Associated contact ID (nullable - asset can be unassigned or contact deleted) */
  contact_id: number | null;

  /** Hardware manufacturer (e.g., Dell, HP, Apple) */
  manufacturer: string | null;

  /** Device model (e.g., Latitude 5520, MacBook Pro) */
  model: string | null;

  /** Device serial number for warranty/support lookups */
  serial_number: string | null;

  /** Date asset was placed into service (required for warranty tracking) */
  in_service_date: Date;

  /** Warranty expiration date (nullable - some assets have no warranty) */
  warranty_expiration_date: Date | null;

  /** PDQ Inventory/Deploy device identifier for integration */
  pdq_device_id: string | null;

  /** ScreenConnect (ConnectWise Control) session ID for remote support */
  screenconnect_session_id: string | null;

  /** Asset lifecycle state: 'active' (in use) or 'retired' (decommissioned) */
  status: 'active' | 'retired';

  /** Timestamp when asset was retired (null if active) */
  retired_at: Date | null;

  /** Record creation timestamp */
  created_at: Date;

  /** Record last update timestamp */
  updated_at: Date;
}

/**
 * Asset form submission data
 * Used for creating or updating assets via API
 * Dates as ISO strings for JSON serialization
 */
export interface AssetFormData {
  /** Device hostname or computer name (required) */
  hostname: string;

  /** Associated contact ID (optional - can be unassigned) */
  contact_id?: number | null;

  /** Hardware manufacturer (optional) */
  manufacturer?: string;

  /** Device model (optional) */
  model?: string;

  /** Device serial number (optional) */
  serial_number?: string;

  /** Date asset was placed into service (ISO date format: YYYY-MM-DD) */
  in_service_date: string;

  /** Warranty expiration date (ISO date format: YYYY-MM-DD, optional) */
  warranty_expiration_date?: string;

  /** PDQ Inventory/Deploy device identifier (optional) */
  pdq_device_id?: string;

  /** ScreenConnect session ID (optional) */
  screenconnect_session_id?: string;
}

/**
 * Asset list/search filter parameters
 * Used for querying and filtering assets in list views
 */
export interface AssetFilters {
  /** Filter assets by client (via contact relationship) */
  client_id?: number;

  /** Filter assets by specific contact */
  contact_id?: number;

  /** Filter by lifecycle status (active or retired) */
  status?: 'active' | 'retired';

  /** Search term for hostname, manufacturer, model, or serial number */
  search?: string;
}

/**
 * Asset with populated contact relationship
 * Returned by API when contact details are included
 */
export interface AssetWithContact extends Asset {
  contact?: {
    id: number;
    name: string;
    email: string;
    client_id: number;
  } | null;
}

/**
 * Asset warranty status helper type
 * Used for UI color-coding and alerts
 */
export type WarrantyStatus = 'valid' | 'expiring-soon' | 'expired' | 'no-warranty';

/**
 * Helper function type for calculating warranty status
 * Can be implemented in utils or components
 */
export type GetWarrantyStatus = (asset: Asset) => WarrantyStatus;
