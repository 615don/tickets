export interface XeroConnectionStatus {
  isConnected: boolean;
  organizationName?: string;
  organizationId?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  isValid?: boolean;
  error?: string;
  billableRate?: number; // Hourly rate from Xero "Consulting Services" item
}

export interface XeroOAuthCallback {
  code?: string;
  state?: string;
  error?: string;
}

export interface XeroTestResult {
  success: boolean;
  organizationName?: string;
  message?: string;
  error?: string;
}

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export interface InfoListItem {
  label: string;
  value: string | React.ReactNode;
}
