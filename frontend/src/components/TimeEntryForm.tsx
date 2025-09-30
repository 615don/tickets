import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeEntryFormData } from '@/types';

const formSchema = z.object({
  workDate: z.string().min(1, 'Work date is required'),
  time: z.string()
    .min(1, 'Duration is required')
    .regex(/^\d+(\.\d+)?[hm]?\s*(\d+m)?$|^\d+h\s*\d+m$/, 'Invalid time format (e.g., 2h, 1.5h, 1h30m)'),
  billable: z.boolean(),
});

interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<TimeEntryFormData>;
  isEdit?: boolean;
}

export const TimeEntryForm = ({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: TimeEntryFormProps) => {
  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workDate: defaultValues?.workDate || format(new Date(), 'yyyy-MM-dd'),
      time: defaultValues?.time || '',
      billable: defaultValues?.billable ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="workDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Work Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'MMM dd, yyyy')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2h, 1.5h, 1h30m"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billable"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex items-center space-x-2 h-10">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="billable"
                    />
                  </FormControl>
                  <FormLabel htmlFor="billable" className="!mt-0 cursor-pointer">
                    Billable
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            {isEdit ? 'Save Changes' : 'Add Time Entry'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
