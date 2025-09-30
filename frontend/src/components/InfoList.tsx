import { InfoListItem } from '@/types/xero';

interface InfoListProps {
  items: InfoListItem[];
}

export const InfoList = ({ items }: InfoListProps) => {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-2 border-b border-border last:border-0"
        >
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-sm font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
};
