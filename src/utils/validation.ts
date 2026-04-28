export const RESTRICTED_WORDS = [
  "admin",
  "root",
  "moderator",
  "support",
  "fava", // Prevent impersonation of the app
  "system",
  "badword", // Placeholder for actual profanity
];

export function validateUsername(username: string): { isValid: boolean; error: string } {
  const trimmed = username.trim();

  // 1. Length Check
  if (trimmed.length < 3) return { isValid: false, error: "Username must be at least 3 characters long." };
  if (trimmed.length > 20) return { isValid: false, error: "Username cannot exceed 20 characters." };

  // 2. Character Restriction (Letters, numbers, underscores, periods only)
  const validFormatRegex = /^[a-zA-Z0-9_.]+$/;
  if (!validFormatRegex.test(trimmed)) {
    return { isValid: false, error: "Only letters, numbers, underscores, and periods are allowed. No spaces." };
  }

  // 3. Punctuation Placement (Cannot start or end with . or _)
  if (trimmed.startsWith(".") || trimmed.startsWith("_") || trimmed.endsWith(".") || trimmed.endsWith("_")) {
    return { isValid: false, error: "Username cannot start or end with a period or underscore." };
  }

  // 4. Consecutive Punctuation (No "user..name" or "user__name")
  if (trimmed.includes("..") || trimmed.includes("__") || trimmed.includes("._") || trimmed.includes("_."))
    return { isValid: false, error: "Username cannot contain consecutive periods or underscores." };

  // 5. Profanity & Impersonation Check
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const containsRestricted = RESTRICTED_WORDS.some((word) => normalized.includes(word));
  if (containsRestricted) {
    return { isValid: false, error: "This username contains restricted words and is not allowed." };
  }

  return { isValid: true, error: "" };
}

