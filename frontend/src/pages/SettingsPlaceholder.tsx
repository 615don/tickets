import { Link } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SettingsPlaceholder = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <Settings size={32} className="text-accent-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Settings</h1>
            <p className="text-xl text-muted-foreground">
              Xero connection and settings coming soon
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
              The settings screen will allow you to:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Connect your Xero account</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Configure default billing rates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Manage user preferences</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Set up invoice templates</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPlaceholder;
