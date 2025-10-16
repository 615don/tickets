/**
 * AssetDetailPage Component
 * Displays full details of a single asset with edit/retire/delete actions
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAsset, useRetireAsset, usePermanentDeleteAsset } from '@/hooks/useAssets';
import { useQueryClient } from '@tanstack/react-query';
import { assetKeys } from '@/hooks/useAssets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Edit, AlertTriangle, Trash2, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssetForm } from '@/components/assets/AssetForm';
import { WarrantyBadge } from '@/components/assets/WarrantyBadge';
import { ExternalToolLinks } from '@/components/assets/ExternalToolLinks';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assetId = id ? parseInt(id, 10) : 0;
  const { data: asset, isLoading, error } = useAsset(assetId);

  const retireAsset = useRetireAsset();
  const permanentDeleteAsset = usePermanentDeleteAsset();

  // Modal and dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state: Asset not found
  if (error || !asset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Asset Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The asset you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/assets')}>
              Return to Asset List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate if asset is eligible for permanent deletion (retired >2 years ago)
  const isPermanentDeleteEligible =
    asset.status === 'retired' &&
    asset.retired_at &&
    Date.now() - new Date(asset.retired_at).getTime() > 2 * 365 * 24 * 60 * 60 * 1000;

  // Handle retire asset
  const handleRetire = async () => {
    try {
      await retireAsset.mutateAsync(assetId);
      toast({
        title: 'Asset Retired',
        description: `${asset.hostname} has been retired successfully.`,
      });
      setIsRetireDialogOpen(false);
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to retire asset. Please try again.',
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    try {
      await permanentDeleteAsset.mutateAsync(assetId);
      toast({
        title: 'Asset Deleted',
        description: `${asset.hostname} has been permanently deleted.`,
      });
      setIsDeleteDialogOpen(false);
      navigate('/assets');
    } catch (err) {
      const errorMessage =
        (err as Error)?.message || 'Failed to delete asset. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    toast({
      title: 'Asset Updated',
      description: `${asset.hostname} has been updated successfully.`,
    });
    // Invalidate cache to refresh data
    queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Link to="/assets" className="hover:text-foreground">
            Assets
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          {asset.client && (
            <>
              <Link to={`/clients`} className="hover:text-foreground">
                {asset.client.company_name}
              </Link>
              <ChevronRight className="h-4 w-4 mx-1" />
            </>
          )}
          {asset.contact && (
            <>
              <span className="text-foreground">{asset.contact.name}</span>
              <ChevronRight className="h-4 w-4 mx-1" />
            </>
          )}
          <span className="text-foreground">{asset.hostname}</span>
        </div>

        {/* Title and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{asset.hostname}</h1>
            <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
              {asset.status === 'active' ? 'Active' : 'Retired'}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {asset.status === 'active' && (
              <Button
                variant="destructive"
                onClick={() => setIsRetireDialogOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Retire
              </Button>
            )}
            {isPermanentDeleteEligible && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </Button>
            )}
          </div>
        </div>

        {/* Retired Message */}
        {asset.status === 'retired' && asset.retired_at && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Retired on {format(new Date(asset.retired_at), 'PPP')}
            </span>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Hostname
              </label>
              <p className="text-base">{asset.hostname}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                  {asset.status === 'active' ? 'Active' : 'Retired'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Client
              </label>
              <p className="text-base">
                {asset.client?.company_name || 'No client assigned'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Contact
              </label>
              <p className="text-base">
                {asset.contact?.name || 'Unassigned'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Manufacturer
              </label>
              <p className="text-base">{asset.manufacturer || '—'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Model
              </label>
              <p className="text-base">{asset.model || '—'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Serial Number
              </label>
              <p className="text-base">{asset.serial_number || '—'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                In-Service Date
              </label>
              <p className="text-base">
                {format(new Date(asset.in_service_date), 'PPP')}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Warranty Expiration
              </label>
              {asset.warranty_expiration_date ? (
                <div className="space-y-1">
                  <p className="text-base">
                    {format(new Date(asset.warranty_expiration_date), 'MMMM do, yyyy')}
                  </p>
                  <WarrantyBadge
                    warrantyExpirationDate={new Date(asset.warranty_expiration_date)}
                  />
                </div>
              ) : (
                <p className="text-base">—</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                PDQ Device ID
              </label>
              <p className="text-base font-mono text-sm">
                {asset.pdq_device_id || '—'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                ScreenConnect Session ID
              </label>
              <p className="text-base font-mono text-sm">
                {asset.screenconnect_session_id || '—'}
              </p>
            </div>
          </div>

          <Separator />

          {/* External Tool Links */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Remote Access Tools
            </h3>
            <ExternalToolLinks
              screenconnectSessionId={asset.screenconnect_session_id}
              pdqDeviceId={asset.pdq_device_id}
              hostname={asset.hostname}
            />
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <label className="font-medium">Created At</label>
              <p>{format(new Date(asset.created_at), 'PPP p')}</p>
            </div>
            <div>
              <label className="font-medium">Last Updated</label>
              <p>{format(new Date(asset.updated_at), 'PPP p')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm
            mode="edit"
            asset={asset}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Retire Confirmation Dialog */}
      <AlertDialog open={isRetireDialogOpen} onOpenChange={setIsRetireDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Retire <strong>{asset.hostname}</strong>? Asset will be hidden from
              active lists but can be reactivated later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetire}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retire Asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{asset.hostname}</strong>? This action
              cannot be undone and the asset will be removed from the database
              forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
