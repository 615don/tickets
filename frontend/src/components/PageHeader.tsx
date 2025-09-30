import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  count?: number;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const PageHeader = ({ title, count, primaryAction }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {count !== undefined && (
          <Badge variant="secondary">{count}</Badge>
        )}
      </div>
      {primaryAction && (
        <Button onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
      )}
    </div>
  );
};
