import { getAllMediaAssets } from "../../lib/media";
import MediaClient from "./MediaClient";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const assets = await getAllMediaAssets();

  return <MediaClient initialAssets={assets} />;
}
