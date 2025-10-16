/**
 * ExternalToolLinks Component
 * Renders action buttons for external asset management tools (ScreenConnect, PDQ Connect)
 * Buttons are disabled if the corresponding IDs are not set
 */

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExternalToolLinksProps {
  screenconnectSessionId: string | null;
  pdqDeviceId: string | null;
  hostname: string;
}

export function ExternalToolLinks({
  screenconnectSessionId,
  pdqDeviceId,
  hostname,
}: ExternalToolLinksProps) {
  const screenConnectUrl = screenconnectSessionId
    ? `https://zollc.screenconnect.com/Host#Access///${screenconnectSessionId}/Join`
    : null;

  const pdqConnectUrl = pdqDeviceId
    ? `https://app.pdq.com/zero-one-llc/devices/${pdqDeviceId}/info`
    : null;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* ScreenConnect Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="default"
                size="default"
                disabled={!screenConnectUrl}
                onClick={() => {
                  if (screenConnectUrl) {
                    window.open(screenConnectUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect via ScreenConnect
              </Button>
            </div>
          </TooltipTrigger>
          {!screenConnectUrl && (
            <TooltipContent>
              <p>ScreenConnect Session ID not set</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* PDQ Connect Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="secondary"
                size="default"
                disabled={!pdqConnectUrl}
                onClick={() => {
                  if (pdqConnectUrl) {
                    window.open(pdqConnectUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in PDQ Connect
              </Button>
            </div>
          </TooltipTrigger>
          {!pdqConnectUrl && (
            <TooltipContent>
              <p>PDQ Device ID not set</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
