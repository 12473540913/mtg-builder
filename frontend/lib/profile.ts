import { apiUrl } from "./api";
import { validateProfile, type AppProfile } from "../../shared/profile";

async function requestProfile(init?: RequestInit): Promise<AppProfile> {
  const response = await fetch(apiUrl("/api/profile"), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
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
