import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateAvatarRequestBody = {
  upperWearUrl: string;
  lowerWearUrl: string;
  customAvatarUrl?: string | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function urlToGenerativePart(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from Supabase URL (status ${response.status}).`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64String,
      mimeType,
    },
  };
}

function extractGeminiText(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY." },
      { status: 500 },
    );
  }

  let body: Partial<GenerateAvatarRequestBody>;
  try {
    body = (await request.json()) as Partial<GenerateAvatarRequestBody>;
  } catch (error) {
    console.error("Invalid JSON body:", error);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { upperWearUrl, lowerWearUrl, customAvatarUrl } = body;
  if (!isNonEmptyString(upperWearUrl) || !isNonEmptyString(lowerWearUrl)) {
    return NextResponse.json(
      { error: "upperWearUrl and lowerWearUrl are required strings." },
      { status: 400 },
    );
  }

  // Step 1 (Vision - Gemini 2.5 Flash): native fetch to Gemini REST.
  let description = "";
  try {
    const geminiParts: any[] = [];

    if (isNonEmptyString(customAvatarUrl)) {
      geminiParts.push({
        text: "Reference Image 1 (The Person): Extract ONLY their physical traits (race, gender, skin tone, hair) and physical pose. COMPLETELY IGNORE the clothing they are currently wearing.",
      });
      const avatarPart = await urlToGenerativePart(customAvatarUrl);
      geminiParts.push(avatarPart);
    }

    const [upperPart, lowerPart] = await Promise.all([
      urlToGenerativePart(upperWearUrl),
      urlToGenerativePart(lowerWearUrl),
    ]);

    geminiParts.push({
      text: "Reference Image 2 (Upper Clothing): Describe this exact top.",
    });
    geminiParts.push(upperPart);

    geminiParts.push({
      text: "Reference Image 3 (Lower Clothing): Describe these exact bottoms.",
    });
    geminiParts.push(lowerPart);

    const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`;

    geminiParts.push({
      text: 'Synthesize the references into a single descriptive sentence. Format exactly like this: "A photorealistic fashion editorial of a [traits and pose from Image 1] wearing [clothing from Image 2] and [clothing from Image 3]." Return ONLY this single sentence.',
    });

    const visionResponse = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: geminiParts,
          },
        ],
      }),
    });

    const visionText = await visionResponse.text();
    if (!visionResponse.ok) {
      console.error("Gemini vision API error:", {
        status: visionResponse.status,
        body: visionText,
      });
      return NextResponse.json(
        { error: "Gemini vision request failed." },
        { status: 500 },
      );
    }

    const visionJson = JSON.parse(visionText) as unknown;
    description = extractGeminiText(visionJson);
    if (!description) {
      console.error("Gemini vision returned empty description:", visionJson);
      return NextResponse.json(
        { error: "Gemini vision returned an empty description." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Step 1 (Gemini vision) failed:", error);
    return NextResponse.json(
      { error: "Failed during Gemini vision step." },
      { status: 500 },
    );
  }

  // Step 2 (Image Generation - Pollinations.ai): native fetch as free fallback.
  try {
    const imagePrompt = `Full body shot, head to toe visible, wide angle, standing full length. ${description}. Clean studio background, showing shoes and full legs.`;
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&nologo=true`;

    const imageResponse = await fetch(pollinationsUrl, { method: "GET" });
    if (!imageResponse.ok) {
      const errText = await imageResponse.text().catch(() => "");
      console.error("Pollinations API error:", {
        status: imageResponse.status,
        body: errText,
      });
      return NextResponse.json(
        { error: "Pollinations image request failed." },
        { status: 500 },
      );
    }

    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    const bytes = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const generatedUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ generatedUrl });
  } catch (error) {
    console.error("Step 2 (Pollinations) failed:", error);
    return NextResponse.json(
      { error: "Failed during Pollinations image generation step." },
      { status: 500 },
    );
  }
}