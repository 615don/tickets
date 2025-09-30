import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InvoiceReviewPlaceholder = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <FileText size={32} className="text-accent-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Invoice Review</h1>
            <p className="text-xl text-muted-foreground">
              Pre-invoice review and generation coming soon
            </p>
          </div>

          <div className="pt-4">
            <Button asChild size="lg">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="pt-8 max-w-md mx-auto text-left">
            <p className="text-sm text-muted-foreground">
              The invoice review screen will allow you to:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Review unbilled time entries by client</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Generate pre-invoice summaries</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Export data for Xero invoice creation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Lock billing periods after invoicing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReviewPlaceholder;
