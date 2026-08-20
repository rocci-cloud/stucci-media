import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../lib/require-admin";

// Images stay at 10MB (they're compressed client-side before upload, so
// anything still over that is a genuine outlier). Audio gets its own,
// much larger ceiling — an hour of spoken-word MP3 is comfortably over
// any image limit and there's nothing to compress it down to.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Any staff role may upload — an author who can't add an image to
        // their own draft can't do their job. Deleting media is still
        // admin-only (see admin/media/actions.ts).
        const session = await requireStaffSession();
        if (!session) {
          throw new Error("Unauthorized");
        }

        // Images only. Audio uploads existed for the hand-entry episode
        // editor, which is gone — a feed's episodes are hosted by whoever
        // publishes the show, so nothing here uploads audio any more.
        return {
          allowedContentTypes: IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed — the client reads the
        // resulting blob URL directly from the upload() response, and
        // indexes it in the media library from there (this webhook never
        // fires against a local dev server, so it can't be the indexing
        // path — see admin/media/actions.ts).
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
