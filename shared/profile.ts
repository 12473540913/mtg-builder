export type AppProfile = {
  username: string | null;
};

export function validateProfile(value: unknown): asserts value is AppProfile {
  if (!value || typeof value !== "object" || !("username" in value)) {
    throw new Error("Invalid profile.");
  }
  const username = value.username;
  if (username !== null && (
    typeof username !== "string" || username !== username.trim() ||
    username.length < 3 || username.length > 100
  )) {
    throw new Error("Username must be between 3 and 100 characters with no surrounding spaces.");
  }
}
