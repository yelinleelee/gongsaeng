import { API_URL, ApiError, tokenStore } from "./api";

export type UploadedImage = {
  url: string;
  public_id: string;
  width: number;
  height: number;
};

async function postMultipart<T>(path: string, form: FormData): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // Don't set Content-Type — the browser fills in the multipart boundary.

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: form,
    headers,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    if (res.status === 401) tokenStore.clear();
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("image", file);
  return postMultipart<UploadedImage>("/upload/image", form);
}

export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  for (const f of files) form.append("images", f);
  const res = await postMultipart<{ images: UploadedImage[] }>("/upload/images", form);
  return res.images;
}
