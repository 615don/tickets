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
import { Contact, Client } from '@/types';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  clientId: z.number().min(1, 'Please select a client'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  clients: Client[];
  existingEmails: string[];
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
}

export const ContactForm = ({ contact, clients, existingEmails, onSubmit, onCancel }: ContactFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      name: contact?.name || '',
      email: contact?.email || '',
      clientId: contact?.clientId || 0,
    },
  });

  const clientId = watch('clientId');
  const email = watch('email');

  const validateEmail = () => {
    if (email && existingEmails.includes(email) && email !== contact?.email) {
      return 'This email already exists for another contact';
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="John Smith"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email', { validate: validateEmail })}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client">
          Client <span className="text-destructive">*</span>
        </Label>
        {clients.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3 border border-border rounded-md">
            No clients available. Please create a client first.
          </div>
        ) : (
          <Select
            value={clientId?.toString()}
            onValueChange={(value) => setValue('clientId', parseInt(value))}
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
        )}
        {errors.clientId && (
          <p className="text-sm text-destructive">{errors.clientId.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={!isValid || clients.length === 0}>
          {contact ? 'Save Changes' : 'Create Contact'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
