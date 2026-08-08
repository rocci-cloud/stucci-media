import { getAllBannersAdmin } from "../../lib/banners";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await getAllBannersAdmin();

  return <BannersClient initialBanners={banners} />;
}
