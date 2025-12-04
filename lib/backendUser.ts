import { API_BASE_URL } from "./config";

export async function createBackendUser(idToken: string, name: string) {
  // POST to the API path expected by the backend
  const url = `${API_BASE_URL.replace(/\/$/, '')}/api/v1/user`;

  let response;
  try {
    response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name }),
    });
  } catch (err: any) {
    // Likely a network/URL error — provide helpful message
    throw new Error(`Failed to call backend at ${url}: ${err.message}`);
  }

  if (!response.ok) {
    let errorData: any = {};
    try { errorData = await response.json(); } catch (_) {}
    throw new Error(errorData.error || `Failed to create backend user (status ${response.status})`);
  }

  return response.json();
}
