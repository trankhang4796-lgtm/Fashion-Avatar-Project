export type BetaAvatarGenerationSettings = {
  betaFeaturesEnabled: boolean;
  betaFastAiGeneration: boolean;
  betaHighAccuracyVto: boolean;
};

export class BetaAvatarGenerationError extends Error {
  readonly code:
    | "BETA_DISABLED"
    | "NO_BETA_MODEL_SELECTED"
    | "INVALID_BETA_SETTINGS";

  constructor(
    code:
      | "BETA_DISABLED"
      | "NO_BETA_MODEL_SELECTED"
      | "INVALID_BETA_SETTINGS",
    message: string,
  ) {
    super(message);
    this.name = "BetaAvatarGenerationError";
    this.code = code;
  }
}

type ImagePayload = unknown;

export type GenerateAvatarImagePayload = {
  upperWearUrl: string | null;
  lowerWearUrl: string | null;
  customAvatarUrl?: string | null;
};

type ImagePayload = GenerateAvatarImagePayload;

export async function generateAvatarFastAPI(imagePayload: ImagePayload) {
  const response = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(imagePayload),
  });

  if (!response.ok) {
    let message = "Failed to generate avatar.";
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error || data.message || message;
    } catch {
      // ignore JSON parsing errors
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { generatedUrl?: string };
  if (!data.generatedUrl) {
    throw new Error("Generation succeeded but no image URL was returned.");
  }

  return data.generatedUrl;
}

export async function generateAvatarLocalVTO(imagePayload: ImagePayload) {
  // TODO: Fetch request to your Cloudflare Tunnel URL goes here.
  // Example (placeholder):
  // return fetch("https://<your-tunnel>.trycloudflare.com/generate", { method: "POST", body: ... });
  void imagePayload;
  throw new Error("generateAvatarLocalVTO not implemented yet.");
}

/**
 * Beta-only avatar generation router.
 *
 * This module is intentionally decoupled from production generation code.
 * Callers should catch errors and fall back to standard generation.
 */
export async function generateAvatar(
  imagePayload: ImagePayload,
  userSettings: BetaAvatarGenerationSettings,
) {
  if (!userSettings || typeof userSettings !== "object") {
    throw new BetaAvatarGenerationError(
      "INVALID_BETA_SETTINGS",
      "Missing or invalid beta settings.",
    );
  }

  const {
    betaFeaturesEnabled,
    betaFastAiGeneration,
    betaHighAccuracyVto,
  } = userSettings;

  if (!betaFeaturesEnabled) {
    throw new BetaAvatarGenerationError(
      "BETA_DISABLED",
      "Beta features are disabled. Fall back to standard generation.",
    );
  }

  if (betaFastAiGeneration && betaHighAccuracyVto) {
    // Should be impossible if UI enforces mutual exclusion, but keep it safe.
    throw new BetaAvatarGenerationError(
      "INVALID_BETA_SETTINGS",
      "Beta settings are invalid: both models are enabled.",
    );
  }

  if (betaFastAiGeneration) {
    return generateAvatarFastAPI(imagePayload);
  }

  if (betaHighAccuracyVto) {
    return generateAvatarLocalVTO(imagePayload);
  }

  throw new BetaAvatarGenerationError(
    "NO_BETA_MODEL_SELECTED",
    "No beta model is enabled. Fall back to standard generation.",
  );
}

