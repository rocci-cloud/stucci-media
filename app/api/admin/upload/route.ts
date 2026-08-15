import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../lib/require-admin";

// Images stay at 10MB (they're compressed client-side before upload, so
// anything still over that is a genuine outlier). Audio gets its own,
// much larger ceiling — an hour of spoken-word MP3 is comfortably over
// any image limit and there's nothing to compress it down to.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/wav", "audio/ogg", "audio/webm"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_BYTES = 300 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Any staff role may upload — an author who can't add an image to
        // their own draft can't do their job. Deleting media is still
        // admin-only (see admin/media/actions.ts).
        const session = await requireStaffSession();
        if (!session) {
          throw new Error("Unauthorized");
        }

        // The client tells us which kind of upload this is; the content
        // type is still validated against the matching allowlist below,
        // so a lying payload only ever narrows what it can send, never
        // widens it.
        const isAudio = clientPayload === "audio";
        return {
          allowedContentTypes: isAudio ? AUDIO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES,
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
