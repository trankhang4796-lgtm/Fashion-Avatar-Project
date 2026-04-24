export const BAD_WORDS = [
  "admin",
  "root",
  "moderator",
  "badword", // Placeholder for actual profanity
];

export function containsProfanity(username: string): boolean {
  const normalized = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  return BAD_WORDS.some((word) => normalized.includes(word));
}
