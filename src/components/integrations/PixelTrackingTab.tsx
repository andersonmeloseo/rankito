import { UniversalPixelManager } from "./ecommerce/UniversalPixelManager";
import { InstallationGuide } from "./ecommerce/InstallationGuide";
import { EcommerceAnalytics } from "./ecommerce/EcommerceAnalytics";

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
      />
      
      <InstallationGuide trackingToken={trackingToken} />
      
      <EcommerceAnalytics siteId={siteId} />
    </div>
  );
};