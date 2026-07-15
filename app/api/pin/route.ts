import { NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage, type Address } from "viem";
import { analyzeVerse, createCanonicalManifest, manifestKeccak256, renderCanonicalSvg, type MappingMode } from "../../../lib/protocol";
import { canonicalUploadMessage } from "../../../lib/upload-auth";

export const runtime = "edge";

const MAX_SOURCE_LENGTH = 10_000;
const SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

async function pinFile(jwt: string, filename: string, contentType: string, content: string) {
  const form = new FormData();
  form.append("network", "public");
  form.append("name", filename);
  form.append("file", new File([content], filename, { type: contentType }));
  const response = await fetch("https://uploads.pinata.cloud/v3/files", { method: "POST", headers: { Authorization: `Bearer ${jwt}` }, body: form });
  const result = await response.json() as { data?: { cid?: string }; error?: string };
  const cid = result.data?.cid;
  if (!response.ok || !cid) throw new Error(result.error ?? "IPFS upload failed.");
  return { cid, uri: `ipfs://${cid}` };
}

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) return NextResponse.json({ error: "Artifact service is temporarily unavailable." }, { status: 503 });
  try {
    const body = await request.json() as { address?: string; sourceText?: string; mode?: MappingMode; timestamp?: number; signature?: `0x${string}` };
    const sourceText = body.sourceText ?? "";
    const mode = body.mode;
    const timestamp = body.timestamp ?? 0;
    if (!isAddress(body.address ?? "") || !body.signature) return NextResponse.json({ error: "A valid wallet signature is required." }, { status: 401 });
    if (mode !== "ancient" && mode !== "root60") return NextResponse.json({ error: "This mapping mode is not approved for canonical minting." }, { status: 400 });
    if (!sourceText || sourceText.length > MAX_SOURCE_LENGTH) return NextResponse.json({ error: "Source text is empty or too large." }, { status: 400 });
    if (Math.abs(Date.now() - timestamp) > SIGNATURE_WINDOW_MS) return NextResponse.json({ error: "Upload authorization expired." }, { status: 401 });

    const address = getAddress(body.address as Address);
    const message = canonicalUploadMessage(address, sourceText, mode, timestamp);
    const authorized = await verifyMessage({ address, message, signature: body.signature });
    if (!authorized) return NextResponse.json({ error: "Invalid upload authorization." }, { status: 401 });

    const analysis = analyzeVerse(sourceText, mode, {});
    if (!analysis.total) return NextResponse.json({ error: "Source text contains no mapped characters." }, { status: 400 });
    const slug = `${analysis.mappingMode}-${analysis.total}`;
    const image = await pinFile(jwt, `${slug}.svg`, "image/svg+xml", renderCanonicalSvg(analysis));
    const manifest = await createCanonicalManifest(sourceText, image.uri, analysis);
    const contentHash = manifestKeccak256(manifest);
    const metadata = await pinFile(jwt, `${slug}.json`, "application/json", JSON.stringify(manifest));
    return NextResponse.json({ contentHash, metadataURI: metadata.uri, imageURI: image.uri, manifest });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Canonical upload failed." }, { status: 502 });
  }
}
