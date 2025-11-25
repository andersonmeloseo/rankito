import { UniversalPixelManager } from "./ecommerce/UniversalPixelManager";
import { InstallationGuide } from "./ecommerce/InstallationGuide";

interface PixelTrackingTabProps {
  siteId: string;
  trackingToken: string;
  siteName: string;
  pixelInstalled: boolean;
}

export const PixelTrackingTab = ({
  siteId,
  trackingToken,
  siteName,
  pixelInstalled
}: PixelTrackingTabProps) => {
  return (
    <div className="space-y-6">
      <UniversalPixelManager
        trackingToken={trackingToken}
        siteName={siteName}
        pixelInstalled={pixelInstalled}
        siteId={siteId}
      />
      
      <InstallationGuide trackingToken={trackingToken} />
    </div>
  );
};