const PASSWORD_REQUIREMENTS = [
  { text: "At least 8 characters", satisfied: (password: string) => password.length >= 8 },
  { text: "At least one lowercase letter", satisfied: (password: string) => /[a-z]/.test(password) },
  { text: "At least one uppercase letter", satisfied: (password: string) => /[A-Z]/.test(password) },
  { text: "At least one number", satisfied: (password: string) => /[0-9]/.test(password) },
];

export function getUnmetPasswordRequirements(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.satisfied(password))
    .map((requirement) => requirement.text);
}
