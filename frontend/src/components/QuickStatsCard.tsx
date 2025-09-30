import { LucideIcon } from 'lucide-react';

interface QuickStatsCardProps {
  label: string;
  value: string | number;
  indicator?: 'success' | 'warning' | 'error';
  icon?: LucideIcon;
}

export const QuickStatsCard = ({ label, value, indicator, icon: Icon }: QuickStatsCardProps) => {
  const getIndicatorClasses = () => {
    if (!indicator) return '';
    
    const classes = {
      success: 'border-l-4 border-l-success bg-success/5',
      warning: 'border-l-4 border-l-warning bg-warning/5',
      error: 'border-l-4 border-l-destructive bg-destructive/5'
    };
    
    return classes[indicator];
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${getIndicatorClasses()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${
            indicator === 'success' ? 'bg-success/10 text-success' :
            indicator === 'warning' ? 'bg-warning/10 text-warning' :
            indicator === 'error' ? 'bg-destructive/10 text-destructive' :
            'bg-muted text-muted-foreground'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
