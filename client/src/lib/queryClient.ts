import {
  QueryClient,
  QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? undefined;

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

export const buildApiUrl = (pathOrUrl: string): string => {
  if (isAbsoluteUrl(pathOrUrl) || !API_BASE_URL) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${API_BASE_URL}${normalizedPath}`;
};

let cachedStackUserId: string | null = null;

export function setStackUserId(userId: string | null | undefined) {
  cachedStackUserId = userId ?? null;
}

export function getStackUserId(): string | null {
  return cachedStackUserId;
}

export function withStackUserHeader(
  headers: Record<string, string> = {},
): Record<string, string> {
  const stackUserId = getStackUserId();
  if (stackUserId) {
    return { ...headers, "x-stack-user-id": stackUserId };
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  pathOrUrl: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(buildApiUrl(pathOrUrl), {
    method,
    headers: withStackUserHeader(
      data ? { "Content-Type": "application/json" } : {},
    ),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const normalizedPath = (queryKey as QueryKey)
      .map((segment) =>
        segment === undefined || segment === null
          ? ""
          : segment.toString().replace(/^\/+/, ""),
      )
      .filter(Boolean)
      .join("/");

    const url = buildApiUrl(`/${normalizedPath}`);
    const res = await fetch(url, {
      credentials: "include",
      headers: withStackUserHeader(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Factory to create per-user query clients
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
