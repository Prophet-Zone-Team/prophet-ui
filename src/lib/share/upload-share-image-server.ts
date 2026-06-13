import type { ProphetApiResponse, ProphetUploadData } from "@/types/prophet-api";
import { getProphetApiBaseUrl } from "@/service/prophet";

export async function uploadShareImageServer(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
  formData.append("file", blob, filename);

  const response = await fetch(`${getProphetApiBaseUrl()}/v1/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ProphetApiResponse<ProphetUploadData>;

  if (payload.code !== 0 || !payload.data?.url) {
    throw new Error(payload.message || "Upload response missing URL");
  }

  return payload.data.url;
}
