import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { hasDarkLockup } from "@/lib/brand";

/**
 * Server wrapper. The header needs client state for the mobile drawer and the
 * services dropdown, but deciding whether the brand lockup exists needs the
 * filesystem — so the check happens here and crosses the boundary as a prop.
 */
export function SiteHeader() {
  return <SiteHeaderClient hasLockup={hasDarkLockup()} />;
}
