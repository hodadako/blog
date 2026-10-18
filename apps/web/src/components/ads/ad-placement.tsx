import { getAdConfig, type AdPlacementName, type AdSite } from "@/lib/ads";
import { AdSlot } from "./ad-slot";

export function AdPlacement({ site, placement, locale }: { site: AdSite; placement: AdPlacementName; locale: "ko" | "en" }) {
  const config = getAdConfig(site, placement);
  if (!config) return null;
  return <AdSlot config={config} label={locale === "ko" ? "광고" : "Advertisement"} />;
}
