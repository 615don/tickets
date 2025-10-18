/**
 * AssetForm Component
 * Form for creating and editing assets
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Asset, AssetFormData } from '@tickets/shared';
import { useContacts } from '@/hooks/useContacts';
import { useClients } from '@/hooks/useClients';
import { useCreateAsset, useUpdateAsset } from '@/hooks/useAssets';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { assetsApi } from '@/lib/api/assets';

const assetSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required').max(255, 'Hostname must be less than 255 characters'),
  client_id: z.number().min(1, 'Client is required'),
  contact_id: z.number().nullable(),
  manufacturer: z.string().max(255).optional().or(z.literal('')),
  model: z.string().max(255).optional().or(z.literal('')),
  serial_number: z.string().max(255).optional().or(z.literal('')),
  in_service_date: z.string().min(1, 'In-service date is required'),
  warranty_expiration_date: z.string().optional().or(z.literal('')),
  pdq_device_id: z.string().max(255).optional().or(z.literal('')),
  screenconnect_session_id: z.string().max(255).optional().or(z.literal('')),
});

type AssetFormInputs = z.infer<typeof assetSchema>;

interface AssetFormProps {
  mode: 'create' | 'edit';
  asset?: Asset;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AssetForm = ({ mode, asset, onSuccess, onCancel }: AssetFormProps) => {
  // Fetch contacts and clients for dropdown
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: clients = [] } = useClients();

  // Lenovo warranty lookup state
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Determine initial client_id and contact_id from asset if in edit mode
  const { initialClientId, initialContactId } = useMemo(() => {
    if (asset) {
      // Asset always has client_id (required field)
      // Contact_id may be null (optional field)
      return {
        initialClientId: asset.client_id || 0,
        initialContactId: asset.contact_id || null
      };
    }
    return { initialClientId: 0, initialContactId: null };
  }, [asset, contacts]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AssetFormInputs>({
    resolver: zodResolver(assetSchema),
    mode: 'onChange',
    defaultValues: {
      hostname: asset?.hostname || '',
      client_id: initialClientId,
      contact_id: initialContactId,
      manufacturer: asset?.manufacturer || '',
      model: asset?.model || '',
      serial_number: asset?.serial_number || '',
      in_service_date: asset?.in_service_date
        ? new Date(asset.in_service_date).toISOString().split('T')[0]
        : '',
      warranty_expiration_date: asset?.warranty_expiration_date
        ? new Date(asset.warranty_expiration_date).toISOString().split('T')[0]
        : '',
      pdq_device_id: asset?.pdq_device_id || '',
      screenconnect_session_id: asset?.screenconnect_session_id || '',
    },
  });

  const clientId = watch('client_id');
  const contactId = watch('contact_id');
  const manufacturer = watch('manufacturer');
  const serialNumber = watch('serial_number');

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  // Check if manufacturer is Lenovo (case-insensitive)
  const isLenovo = useMemo(() => {
    return manufacturer?.toLowerCase().includes('lenovo') || false;
  }, [manufacturer]);

  // Handle Lenovo warranty lookup
  const handleWarrantyLookup = async () => {
    if (!serialNumber) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      // Use different endpoint based on mode (create vs edit)
      const warrantyInfo = mode === 'create'
        ? await assetsApi.lookupLenovoWarrantyBySerial(serialNumber)
        : await assetsApi.lookupLenovoWarranty(asset!.id, serialNumber);

      // Auto-populate fields with warranty data
      if (warrantyInfo.warranty_expiration_date) {
        setValue('warranty_expiration_date', warrantyInfo.warranty_expiration_date, { shouldValidate: true });
      }
      if (warrantyInfo.in_service_date) {
        setValue('in_service_date', warrantyInfo.in_service_date, { shouldValidate: true });
      }
      // Optionally update model if empty and product name returned
      if (warrantyInfo.product_name && !watch('model')) {
        setValue('model', warrantyInfo.product_name, { shouldValidate: true });
      }
    } catch (error) {
      // Handle error responses
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Serial number not found') || errorMessage.includes('404')) {
        setLookupError('Serial number not found in Lenovo database');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setLookupError('Lenovo API rate limit exceeded. Please try again later.');
      } else if (errorMessage.includes('Unable to connect') || errorMessage.includes('503')) {
        setLookupError('Unable to connect to Lenovo API. Please enter warranty information manually.');
      } else if (errorMessage.includes('API key not configured')) {
        setLookupError('Lenovo API key not configured');
      } else {
        setLookupError('Unable to lookup warranty information. Please try again later.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Filter contacts by selected client
  const filteredContacts = useMemo(() => {
    if (!clientId) return [];
    return contacts.filter((contact) => contact.clientId === clientId);
  }, [contacts, clientId]);

  const onSubmit = async (data: AssetFormInputs) => {
    try {
      const formData: AssetFormData = {
        hostname: data.hostname,
        client_id: data.client_id,
        contact_id: data.contact_id || undefined,
        manufacturer: data.manufacturer || undefined,
        model: data.model || undefined,
        serial_number: data.serial_number || undefined,
        in_service_date: data.in_service_date,
        warranty_expiration_date: data.warranty_expiration_date || undefined,
        pdq_device_id: data.pdq_device_id || undefined,
        screenconnect_session_id: data.screenconnect_session_id || undefined,
      };

      if (mode === 'create') {
        await createAsset.mutateAsync(formData);
      } else if (asset) {
        await updateAsset.mutateAsync({ id: asset.id, data: formData });
      }

      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hostname - Required */}
      <div className="space-y-2">
        <Label htmlFor="hostname">
          Hostname <span className="text-destructive">*</span>
        </Label>
        <Input
          id="hostname"
          {...register('hostname')}
          placeholder="WIN-DESKTOP-01"
        />
        {errors.hostname && (
          <p className="text-sm text-destructive">{errors.hostname.message}</p>
        )}
      </div>

      {/* Client - Required */}
      <div className="space-y-2">
        <Label htmlFor="client">
          Client <span className="text-destructive">*</span>
        </Label>
        <Select
          value={clientId?.toString() || ''}
          onValueChange={(value) => {
            const newClientId = parseInt(value);
            setValue('client_id', newClientId, { shouldValidate: true });

            // Clear contact selection when client changes
            // Contact must belong to the selected client
            const currentContact = contacts.find((c) => c.id === contactId);
            if (currentContact && currentContact.clientId !== newClientId) {
              setValue('contact_id', null, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.client_id && (
          <p className="text-sm text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      {/* Contact Dropdown - Optional */}
      <div className="space-y-2">
        <Label htmlFor="contact">Contact (Optional)</Label>
        {contactsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border border-border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading contacts...
          </div>
        ) : (
          <Select
            value={contactId?.toString() || 'none'}
            onValueChange={(value) =>
              setValue('contact_id', value === 'none' ? null : parseInt(value), { shouldValidate: true })
            }
            disabled={!clientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={clientId ? "Select a contact (optional)" : "Select a client first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific contact</SelectItem>
              {filteredContacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id.toString()}>
                  {contact.name}
                </SelectItem>
              ))}
              {filteredContacts.length === 0 && clientId && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground italic">
                  No contacts available for this client
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        {clientId && filteredContacts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available for this client
          </p>
        )}
      </div>

      {/* Manufacturer */}
      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          {...register('manufacturer')}
          placeholder="Lenovo, Dell, HP, etc."
        />
        {errors.manufacturer && (
          <p className="text-sm text-destructive">{errors.manufacturer.message}</p>
        )}
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          {...register('model')}
          placeholder="ThinkPad X1 Carbon Gen 9"
        />
        {errors.model && (
          <p className="text-sm text-destructive">{errors.model.message}</p>
        )}
      </div>

      {/* Serial Number */}
      <div className="space-y-2">
        <Label htmlFor="serial_number">Serial Number</Label>
        <div className="flex gap-2">
          <Input
            id="serial_number"
            {...register('serial_number')}
            placeholder="PF3ABCDE"
            className="flex-1"
          />
          {/* Lenovo Warranty Lookup Button */}
          {isLenovo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWarrantyLookup}
                      disabled={!serialNumber || lookupLoading}
                    >
                      {lookupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        'Lookup Warranty'
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!serialNumber && (
                  <TooltipContent>
                    Enter serial number first
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {errors.serial_number && (
          <p className="text-sm text-destructive">{errors.serial_number.message}</p>
        )}
        {lookupError && (
          <p className="text-sm text-destructive">{lookupError}</p>
        )}
      </div>

      {/* In-Service Date - Required */}
      <div className="space-y-2">
        <Label htmlFor="in_service_date">
          In-Service Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="in_service_date"
          type="date"
          {...register('in_service_date')}
        />
        {errors.in_service_date && (
          <p className="text-sm text-destructive">{errors.in_service_date.message}</p>
        )}
      </div>

      {/* Warranty Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="warranty_expiration_date">Warranty Expiration Date</Label>
        <Input
          id="warranty_expiration_date"
          type="date"
          {...register('warranty_expiration_date')}
        />
        {errors.warranty_expiration_date && (
          <p className="text-sm text-destructive">{errors.warranty_expiration_date.message}</p>
        )}
      </div>

      {/* PDQ Device ID */}
      <div className="space-y-2">
        <Label htmlFor="pdq_device_id">PDQ Device ID</Label>
        <Input
          id="pdq_device_id"
          {...register('pdq_device_id')}
          placeholder="device-uuid"
        />
        {errors.pdq_device_id && (
          <p className="text-sm text-destructive">{errors.pdq_device_id.message}</p>
        )}
      </div>

      {/* ScreenConnect Session ID */}
      <div className="space-y-2">
        <Label htmlFor="screenconnect_session_id">ScreenConnect Session ID</Label>
        <Input
          id="screenconnect_session_id"
          {...register('screenconnect_session_id')}
          placeholder="session-guid"
        />
        {errors.screenconnect_session_id && (
          <p className="text-sm text-destructive">{errors.screenconnect_session_id.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Asset' : 'Save Changes'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
