/**
 * AssetList Component
 * Displays all assets with filtering, search, and bulk operations
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { SearchBar } from '../SearchBar';
import { ActionButtons } from '../ActionButtons';
import { EmptyState } from '../EmptyState';
import { WarrantyBadge } from './WarrantyBadge';
import { AssetForm } from './AssetForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAssets, useRetireAsset } from '@/hooks/useAssets';
import { useClients } from '@/hooks/useClients';
import { Asset } from '@tickets/shared';
import { Monitor, Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api-client';

export const AssetList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'retired' | 'all'>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [assetToRetire, setAssetToRetire] = useState<Asset | null>(null);
  const { toast } = useToast();

  // Fetch assets with current filters
  const assetFilters = useMemo(() => {
    const filters: {
      client_id?: number;
      status?: 'active' | 'retired';
      search?: string;
    } = {};
    if (clientFilter !== 'all') filters.client_id = parseInt(clientFilter);
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (searchQuery) filters.search = searchQuery;
    return filters;
  }, [clientFilter, statusFilter, searchQuery]);

  const { data: assets = [], isLoading, error } = useAssets(assetFilters);
  const { data: clients = [] } = useClients();
  const retireAsset = useRetireAsset();

  // Client-side search filtering (real-time with debounce handled by backend)
  const filteredAssets = useMemo(() => {
    return assets;
  }, [assets]);

  const handleAddAsset = () => {
    setIsFormOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    navigate(`/assets/${asset.id}`);
  };

  const handleEditAsset = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsEditModalOpen(true);
  };

  const handleRetireAsset = (asset: Asset) => {
    setAssetToRetire(asset);
    setRetireDialogOpen(true);
  };

  const confirmRetire = async () => {
    if (!assetToRetire) return;

    try {
      await retireAsset.mutateAsync(assetToRetire.id);
      toast({
        title: 'Asset retired',
        description: `${assetToRetire.hostname} has been retired.`,
      });
      setRetireDialogOpen(false);
      setAssetToRetire(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: 'Retire failed',
        description: apiError.message || 'Could not retire asset',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    toast({
      title: 'Asset created',
      description: 'The asset has been added successfully.',
    });
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setAssetToEdit(null);
    toast({
      title: 'Asset updated',
      description: 'The asset has been updated successfully.',
    });
  };

  // Get contact and client names for display
  const getAssetDisplay = (asset: Asset): { contactName: string; clientName: string } => {
    const assetWithRelations = asset as Asset & {
      contact?: { id: number; name: string; email: string; client_id: number } | null;
      client?: { id: number; company_name: string } | null;
    };
    return {
      contactName: assetWithRelations.contact?.name || 'Unassigned',
      clientName: assetWithRelations.client?.company_name || 'N/A',
    };
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader title="Assets" />
        <EmptyState
          icon={Monitor}
          message={`Failed to load assets: ${(error as ApiError).message}`}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Assets"
        count={assets.length}
        primaryAction={{
          label: 'Add Asset',
          onClick: handleAddAsset,
        }}
      />

      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <SearchBar
              placeholder="Search by hostname, model, or serial number..."
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Client Filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: 'active' | 'retired' | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Results Summary */}
        {(searchQuery || clientFilter !== 'all' || statusFilter !== 'active') && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
            {statusFilter === 'active' && ' (active only)'}
            {statusFilter === 'retired' && ' (retired only)'}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAssets.length === 0 && !searchQuery && clientFilter === 'all' && statusFilter === 'active' ? (
        /* Empty State - No Assets */
        <EmptyState
          icon={Monitor}
          message="No assets yet. Add your first asset to get started."
          actionLabel="Add Asset"
          onAction={handleAddAsset}
        />
      ) : filteredAssets.length === 0 ? (
        /* Empty State - No Search Results */
        <EmptyState
          icon={Monitor}
          message="No assets match your search or filters."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Warranty Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const { contactName, clientName } = getAssetDisplay(asset);
                  return (
                    <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell
                        className="font-medium"
                        onClick={() => handleViewAsset(asset)}
                      >
                        {asset.hostname}
                      </TableCell>
                      <TableCell onClick={() => handleViewAsset(asset)}>
                        {contactName}
                      </TableCell>
                      <TableCell onClick={() => handleViewAsset(asset)}>
                        {clientName}
                      </TableCell>
                      <TableCell onClick={() => handleViewAsset(asset)}>
                        <WarrantyBadge warrantyExpirationDate={asset.warranty_expiration_date} />
                      </TableCell>
                      <TableCell onClick={() => handleViewAsset(asset)}>
                        <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewAsset(asset)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAsset(asset)}
                          >
                            Edit
                          </Button>
                          {asset.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetireAsset(asset)}
                            >
                              Retire
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredAssets.map((asset) => {
              const { contactName, clientName } = getAssetDisplay(asset);
              return (
                <Card key={asset.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{asset.hostname}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contactName} • {clientName}
                      </p>
                    </div>
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Warranty:</span>
                      <WarrantyBadge warrantyExpirationDate={asset.warranty_expiration_date} />
                    </div>
                    {asset.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{asset.model}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewAsset(asset)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditAsset(asset)}
                    >
                      Edit
                    </Button>
                    {asset.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetireAsset(asset)}
                      >
                        Retire
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Create Asset Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to your inventory with warranty and remote tool information.
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Asset Form Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update asset information, warranty dates, and remote tool configurations.
            </DialogDescription>
          </DialogHeader>
          {assetToEdit && (
            <AssetForm
              mode="edit"
              asset={assetToEdit}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditModalOpen(false);
                setAssetToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Retire Confirmation Dialog */}
      <AlertDialog open={retireDialogOpen} onOpenChange={setRetireDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to retire <strong>{assetToRetire?.hostname}</strong>?
              The asset will be hidden from active lists but can be viewed in the retired filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRetireDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRetire}>
              Retire Asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
