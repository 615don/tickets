import { useForm, useFieldArray } from 'react-hook-form';
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
import { X, Plus } from 'lucide-react';
import { Client } from '@/types';

const domainRegex = /^[a-z0-9-]+\.[a-z]{2,}$/i;

const clientSchema = z.object({
  companyName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  xeroCustomerId: z.string().optional(),
  maintenanceContractType: z.enum(['On Demand', 'Regular Maintenance']),
  domains: z.array(z.object({
    value: z.string().regex(domainRegex, 'Invalid domain format (e.g., example.com)').optional().or(z.literal(''))
  }))
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export const ClientForm = ({ client, onSubmit, onCancel }: ClientFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      companyName: client?.companyName || '',
      xeroCustomerId: client?.xeroCustomerId || '',
      maintenanceContractType: client?.maintenanceContractType || 'On Demand',
      domains: client?.domains.map(d => ({ value: d })) || [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'domains',
  });

  const contractType = watch('maintenanceContractType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">
          Company Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="companyName"
          {...register('companyName')}
          placeholder="Acme Corp"
        />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="xeroCustomerId">Xero Customer ID</Label>
        <Input
          id="xeroCustomerId"
          {...register('xeroCustomerId')}
          placeholder="CUST-001"
        />
        <p className="text-xs text-muted-foreground">Find this in Xero</p>
        {errors.xeroCustomerId && (
          <p className="text-sm text-destructive">{errors.xeroCustomerId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenanceContractType">
          Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={contractType}
          onValueChange={(value) => setValue('maintenanceContractType', value as 'On Demand' | 'Regular Maintenance')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="On Demand">On Demand</SelectItem>
            <SelectItem value="Regular Maintenance">Regular Maintenance</SelectItem>
          </SelectContent>
        </Select>
        {errors.maintenanceContractType && (
          <p className="text-sm text-destructive">{errors.maintenanceContractType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Email Domains</Label>
        <p className="text-xs text-muted-foreground">
          Used to auto-detect client from email addresses
        </p>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`domains.${index}.value`)}
                placeholder="example.com"
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.domains && (
            <p className="text-sm text-destructive">
              {errors.domains.message || errors.domains.find(d => d?.value)?.value?.message}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Domain
        </Button>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={!isValid}>
          {client ? 'Save Changes' : 'Create Client'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
