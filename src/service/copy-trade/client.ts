import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type Method,
} from "axios";

export class CopyTradeApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CopyTradeApiError";
    this.status = status;
  }
}

export function getCopyTradeApiBaseUrl(): string {
  const proxyPath =
    process.env.NEXT_PUBLIC_COPY_TRADE_API_PROXY_PATH?.trim() ||
    "/api/copy-trade";

  return proxyPath.replace(/\/$/, "");
}

function createCopyTradeClient(): AxiosInstance {
  return axios.create({
    baseURL: getCopyTradeApiBaseUrl(),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout: 30_000,
    withCredentials: true,
  });
}

const copyTradeClient = createCopyTradeClient();

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    return String((payload as { error: unknown }).error);
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return `HTTP ${status}`;
}

export async function copyTradeRequest<T>(
  method: Method,
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await copyTradeClient.request<T>({
      ...config,
      method,
      url,
      data: body,
    });

    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status ?? 0;
    const payload = error.response?.data;

    throw new CopyTradeApiError(status, extractErrorMessage(payload, status));
  }
}
