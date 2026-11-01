const configuredApiUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:4000" : "");
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
const API_URL = normalizedApiUrl && !normalizedApiUrl.endsWith("/api") ? `${normalizedApiUrl}/api` : normalizedApiUrl;

export async function api(path, options = {}) {
  if (!API_URL) {
    throw new Error("Missing VITE_API_URL. Set it to your deployed Render API URL in the Vercel project settings.");
  }

  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new Error("Cannot reach the newsroom API. Check the server, your Render service, and the VITE_API_URL environment variable.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status}).`);
  }

  if (!data) {
    throw new Error("The newsroom API returned an unexpected empty response. Check the backend URL and deployment status.");
  }

  return data;
}

export const jsonBody = (value) => JSON.stringify(value);
