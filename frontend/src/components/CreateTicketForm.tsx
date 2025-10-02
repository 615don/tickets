import { useState, useEffect, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Client, Contact, CreateTicketForm as FormData } from '@/types';
import { toast } from 'sonner';

interface CreateTicketFormProps {
  clients: Client[];
  contacts: Contact[];
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting?: boolean;
  formResetRef?: React.MutableRefObject<(() => void) | null>;
}

export const CreateTicketForm = ({ clients, contacts, onSubmit, isSubmitting = false, formResetRef }: CreateTicketFormProps) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      billable: true,
      workDate: getTodayLocalDate()
    }
  });

  // Expose reset function to parent component
  useImperativeHandle(formResetRef, () => () => {
    reset({
      billable: true,
      workDate: getTodayLocalDate()
    });
    setSelectedClientId(null);
    setSelectedContactId(null);
    // Focus client dropdown for next entry
    setTimeout(() => {
      document.getElementById('client-select')?.focus();
    }, 0);
  });

  const billable = watch('billable');

  useEffect(() => {
    if (selectedClientId) {
      const filtered = contacts.filter(c =>
        c.clientId === selectedClientId && !c.isSystemContact
      );
      setFilteredContacts(filtered);
      // Reset contact selection when client changes
      setSelectedContactId(null);
    } else {
      setFilteredContacts([]);
      setSelectedContactId(null);
    }
  }, [selectedClientId, contacts]);

  const parseTime = (timeStr: string): number | null => {
    const str = timeStr.trim().toLowerCase();
    
    // Match patterns: 2h, 2, 45m, 1.5h, 1h30m
    const hourMinPattern = /^(\d+)h\s*(\d+)m$/;
    const hourPattern = /^(\d+(?:\.\d+)?)h?$/;
    const minPattern = /^(\d+)m$/;
    
    let match = str.match(hourMinPattern);
    if (match) {
      return parseFloat(match[1]) + parseFloat(match[2]) / 60;
    }
    
    match = str.match(hourPattern);
    if (match) {
      return parseFloat(match[1]);
    }
    
    match = str.match(minPattern);
    if (match) {
      return parseFloat(match[1]) / 60;
    }
    
    return null;
  };

  const onFormSubmit = async (data: FormData) => {
    const hours = parseTime(data.time);

    if (!hours) {
      toast.error('Invalid time format. Use: 2h, 45m, 1.5, or 1h30m');
      return;
    }

    if (hours <= 0 || hours > 24) {
      toast.error('Time must be between 0 and 24 hours');
      return;
    }

    const workDate = new Date(data.workDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    workDate.setHours(0, 0, 0, 0);
    if (workDate > today) {
      toast.error('Work date cannot be in the future');
      return;
    }

    await onSubmit({ ...data, time: data.time });
    // Form reset is handled by parent component after successful mutation
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="client-select" className="text-sm font-medium">
          Client <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedClientId?.toString() || undefined}
          onValueChange={(value) => {
            const clientId = parseInt(value);
            setSelectedClientId(clientId);
            setValue('clientId', clientId);
          }}
        >
          <SelectTrigger id="client-select" className="h-11">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.clientId && (
          <p className="text-sm text-destructive">Please select a client</p>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="contact-select" className="text-sm font-medium">
          Contact <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedContactId?.toString() || undefined}
          disabled={!selectedClientId}
          onValueChange={(value) => {
            const contactId = parseInt(value);
            setSelectedContactId(contactId);
            setValue('contactId', contactId);
          }}
        >
          <SelectTrigger id="contact-select" className="h-11">
            <SelectValue placeholder={selectedClientId ? "Select a contact" : "Select client first"} />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {filteredContacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id.toString()}>
                {contact.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contactId && (
          <p className="text-sm text-destructive">Please select a contact</p>
        )}
      </div>

      {/* Time and Billable Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm font-medium">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time"
            {...register('time', { required: true })}
            placeholder="2h, 45m, 1.5"
            className="h-11"
          />
          {errors.time && (
            <p className="text-sm text-destructive">Enter time (e.g., 2h, 45m, 1.5)</p>
          )}
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center space-x-2 h-11">
            <Checkbox
              id="billable"
              checked={billable}
              onCheckedChange={(checked) => setValue('billable', checked as boolean)}
            />
            <Label htmlFor="billable" className="text-sm font-medium cursor-pointer">
              Billable
            </Label>
          </div>
        </div>
      </div>

      {/* Work Date */}
      <div className="space-y-2">
        <Label htmlFor="workDate" className="text-sm font-medium">
          Work Date
        </Label>
        <Input
          id="workDate"
          type="date"
          {...register('workDate')}
          className="h-11"
        />
      </div>

      {/* Description and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
            Description <span className="text-xs">(optional)</span>
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Brief description of work..."
            className="min-h-[100px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
            Notes <span className="text-xs">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Internal notes..."
            className="min-h-[100px] resize-y"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base font-medium"
      >
        {isSubmitting ? 'Creating...' : 'Create Ticket'}
      </Button>
    </form>
  );
};
