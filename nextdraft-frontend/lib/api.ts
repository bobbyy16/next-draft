import { API_BASE_URL } from "@/lib/utils";
import { getAuthToken, logout } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type ApiInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T = unknown>(
  path: string,
  { body, auth = true, headers, ...init }: ApiInit = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError(
      networkError instanceof Error ? networkError.message : "Network error",
      0,
      null
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && (data as { message?: string }).message) ||
      response.statusText ||
      "Request failed";

    // 401 — token expired or invalid: drop session
    if (response.status === 401 && auth) {
      logout();
    }

    throw new ApiError(String(message), response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, init?: ApiInit) => apiRequest<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: ApiInit) =>
    apiRequest<T>(path, { ...init, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, init?: ApiInit) =>
    apiRequest<T>(path, { ...init, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, init?: ApiInit) =>
    apiRequest<T>(path, { ...init, method: "PUT", body }),
  delete: <T>(path: string, init?: ApiInit) =>
    apiRequest<T>(path, { ...init, method: "DELETE" }),
};
