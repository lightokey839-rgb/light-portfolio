import { API_URL, ApiError } from "./client";

export interface UploadImageResult {
  url: string;
}

/**
 * Deliberately doesn't go through apiRequest — that helper always sets
 * Content-Type: application/json, which would override the multipart
 * boundary the browser sets automatically for FormData and break the
 * upload entirely.
 */
export async function uploadImage(file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/uploads/image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Couldn't reach the server. Check your connection.");
  }

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = data?.error?.message ?? "Failed to upload image.";
    const code = data?.error?.code ?? "UNKNOWN_ERROR";
    throw new ApiError(response.status, code, message, data?.error?.details);
  }

  return data as UploadImageResult;
}
