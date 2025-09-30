import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  variant?: 'success' | 'warning' | 'info' | 'locked';
}

export const SummaryCard = ({ title, value, subtext, icon: Icon, variant = 'info' }: SummaryCardProps) => {
  const variantStyles = {
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    info: 'border-border bg-card',
    locked: 'border-muted bg-muted/20'
  };

  const iconStyles = {
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-primary',
    locked: 'text-muted-foreground'
  };

  return (
    <Card className={`${variantStyles[variant]} transition-shadow hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
          </div>
          <div className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
