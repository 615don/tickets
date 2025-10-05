/**
 * Generate Invoices button component
 * Controls invoice generation with validation for locked months and missing descriptions
 */

import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GenerateInvoicesButtonProps {
  month: string;
  isLocked: boolean;
  missingDescriptionCount: number;
  onGenerate: () => void;
}

export function GenerateInvoicesButton({
  month,
  isLocked,
  missingDescriptionCount,
  onGenerate,
}: GenerateInvoicesButtonProps) {
  const canGenerate = !isLocked && missingDescriptionCount === 0;

  const getTooltipMessage = () => {
    if (isLocked) {
      return 'Month already invoiced';
    }
    if (missingDescriptionCount > 0) {
      return `${missingDescriptionCount} ticket${missingDescriptionCount > 1 ? 's' : ''} missing descriptions`;
    }
    return '';
  };

  const getButtonIcon = () => {
    if (isLocked) {
      return <Lock className="h-4 w-4 mr-2" />;
    }
    if (missingDescriptionCount > 0) {
      return <AlertCircle className="h-4 w-4 mr-2" />;
    }
    return null;
  };

  // Format month for display (YYYY-MM -> Month Year)
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const button = (
    <Button
      onClick={onGenerate}
      disabled={!canGenerate}
      size="lg"
      className="w-full md:w-auto"
    >
      {getButtonIcon()}
      Generate Invoices for {formatMonth(month)}
    </Button>
  );

  if (!canGenerate) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
