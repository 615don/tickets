/**
 * AssetWidget Component
 * Displays contact's assets on ticket detail page with quick access to ScreenConnect and PDQ
 * Loads asynchronously - does not block ticket page render
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assetsApi } from '@/lib/api/assets';
import { Asset } from '@tickets/shared';
import { WarrantyBadge } from './WarrantyBadge';
import { ExternalToolLinks } from './ExternalToolLinks';
import AssetWidgetSkeleton from './AssetWidgetSkeleton';

interface AssetWidgetProps {
  ticketId: number;
}

export function AssetWidget({ ticketId }: AssetWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contactName, setContactName] = useState<string | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const [clientId, setClientId] = useState<number | null>(null);
  const [totalAssets, setTotalAssets] = useState(0);
  const [unassignedAssetsCount, setUnassignedAssetsCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.getAssetWidget(ticketId);
      setAssets(data.assets);
      setContactName(data.contact_name);
      setContactId(data.contact_id);
      setClientId(data.client_id);
      setTotalAssets(data.total_assets);
      setUnassignedAssetsCount(data.unassigned_assets_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Loading state
  if (loading) {
    return <AssetWidgetSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="flex items-start gap-4 p-6">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Unable to load assets</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button onClick={fetchAssets} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no assets for this contact
  if (assets.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Assets for {contactName || 'Contact'}</h3>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No assets tracked for {contactName || 'this contact'}
          </p>
          {contactId && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* Show "Assign Existing" button if there are unassigned assets for this client */}
              {unassignedAssetsCount > 0 && clientId && (
                <Button asChild variant="default">
                  <Link to={`/assets?client_id=${clientId}&status=active&contact_id=null&assign_to=${contactId}`}>
                    Assign Existing ({unassignedAssetsCount})
                  </Link>
                </Button>
              )}
              {/* Always show "Add New Asset" button */}
              <Button asChild variant={unassignedAssetsCount > 0 ? "outline" : "default"}>
                <Link to={`/assets?create=true&contact_id=${contactId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Asset
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mobile view: Show button to toggle widget visibility
  const mobileToggleButton = (
    <div className="mb-6 block md:hidden">
      <Button
        onClick={() => setMobileExpanded(!mobileExpanded)}
        variant="outline"
        className="w-full"
      >
        {mobileExpanded ? 'Hide' : 'View'} Assets ({totalAssets})
      </Button>
    </div>
  );

  // Main widget content
  const widgetContent = (
    <Card className={cn('mb-6', 'hidden md:block', mobileExpanded && 'block')}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <h3 className="text-lg font-semibold">Assets for {contactName || 'Contact'}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Asset list - up to 2 assets */}
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Left side: Hostname + Warranty badge centered in available space */}
              <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
                <Link
                  to={`/assets/${asset.id}`}
                  className="text-base font-semibold text-primary hover:underline"
                >
                  {asset.hostname}
                </Link>
                <WarrantyBadge warrantyExpirationDate={asset.warranty_expiration_date} />
              </div>

              {/* Right side: External tool buttons */}
              <div className="flex-shrink-0">
                <ExternalToolLinks
                  screenconnectSessionId={asset.screenconnect_session_id}
                  pdqDeviceId={asset.pdq_device_id}
                  hostname={asset.hostname}
                />
              </div>
            </div>
          ))}

          {/* "View all X assets" link if more than 2 assets */}
          {totalAssets > 2 && contactId && (
            <div className="pt-2 text-center">
              <Link
                to={`/assets?contact_id=${contactId}`}
                className="text-sm text-primary hover:underline"
              >
                View all {totalAssets} assets →
              </Link>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <>
      {mobileToggleButton}
      {widgetContent}
    </>
  );
}
