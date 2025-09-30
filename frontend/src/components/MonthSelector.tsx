import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface MonthOption {
  value: string;
  label: string;
}

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: MonthOption[];
}

export const MonthSelector = ({ selectedMonth, onMonthChange, availableMonths }: MonthSelectorProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="month-selector" className="text-sm font-medium">
        Invoice Month
      </Label>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger id="month-selector" className="w-[200px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
