import { getAllRedirects } from "../../lib/redirects";
import RedirectsClient from "./RedirectsClient";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  const redirects = await getAllRedirects();

  return <RedirectsClient initialRedirects={redirects} />;
}
