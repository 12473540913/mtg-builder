import { apiUrl } from "./api";
import { validateProfile, type AppProfile } from "../../shared/profile";

async function requestProfile(init?: RequestInit): Promise<AppProfile> {
  const response = await fetch(apiUrl("/api/profile"), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    if (response.status === 404) {
      throw new Error("The profile API is unavailable. Deploy the updated MTG Builder backend, then retry.");
    }
    throw new Error(`Profile API returned an unexpected response (HTTP ${response.status}). Check the backend deployment and API URL.`);
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Profile request failed.");
  }
  if (payload.ok !== true) throw new Error("Invalid profile response.");
  validateProfile(payload.profile);
  return payload.profile;
}

export function loadAppProfile(): Promise<AppProfile> {
  return requestProfile();
}

export function saveAppProfile(profile: AppProfile): Promise<AppProfile> {
  validateProfile(profile);
  return requestProfile({
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
