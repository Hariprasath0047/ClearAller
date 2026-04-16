import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db.js";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1)
});

const chatRequestSchema = z.object({
  userId: z.string(),
  scope: z.enum(["selected", "all"]),
  profileIds: z.array(z.string()).optional(),
  messages: z.array(chatMessageSchema).min(1)
});

function readPreference(medicalConditions: unknown, tag: string) {
  if (!Array.isArray(medicalConditions)) {
    return "";
  }

  const found = medicalConditions.find(
    (item): item is { name?: string; note?: string } =>
      typeof item === "object" && item !== null && "note" in item && (item as { note?: string }).note === tag
  );

  return typeof found?.name === "string" ? found.name : "";
}

export async function registerChatRoutes(app: FastifyInstance) {
  app.post("/api/chat", async (request, reply) => {
    const payload = chatRequestSchema.parse(request.body);

    // ✅ Changed: use SARVAM_API_KEY instead of OPENAI_API_KEY
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return reply.status(StatusCodes.SERVICE_UNAVAILABLE).send({
        message: "AI chat is not configured yet. Add SARVAM_API_KEY in backend/.env to enable chat replies."
      });
    }

    const profiles = await prisma.allergyProfile.findMany({
      where: {
        userId: payload.userId,
        ...(payload.scope === "selected" && payload.profileIds?.length ? { id: { in: payload.profileIds } } : {})
      },
      include: {
        allergySettings: true
      }
    });

    const profileSummary = profiles.length
      ? profiles
          .map((profile) => {
            const allergies = profile.allergySettings.map((setting) => `${setting.category}:${setting.severity}`).join(", ");
            const gender = readPreference(profile.medicalConditions, "gender") || "unspecified";
            const skinType = readPreference(profile.medicalConditions, "skinType") || "unspecified";
            const hairType = readPreference(profile.medicalConditions, "hairType") || "unspecified";
            return `${profile.name} (age ${profile.age}, gender ${gender}, skin ${skinType}, hair ${hairType}, allergies: ${allergies || "none"})`;
          })
          .join("\n")
      : "No profile details available.";

    const systemPrompt = [
      "You are ClearAller Vision's AI safety assistant.",
      "Reply naturally and differently based on the user's actual question instead of repeating a canned answer.",
      "Stay focused on packaged-food allergen guidance, cosmetic ingredient safety, product suitability, skin type, hair type, and profile-aware suggestions.",
      "Use the profile context when helpful, but do not claim certainty when product data is missing.",
      "Be concise, clear, and conversational.",
      "Always include a brief medical caution only when the user mentions symptoms, severe reactions, treatment, or asks for medical advice.",
      "Do not say you are replacing a doctor. Say severe allergy reactions or treatment decisions should be reviewed with a doctor.",
      `Scope: ${payload.scope}.`,
      `Profiles:\n${profileSummary}`
    ].join("\n");

    // ✅ Changed: Sarvam AI endpoint
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ✅ Changed: Sarvam uses the same Bearer auth pattern
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // ✅ Changed: default model is now sarvam-30b; override with SARVAM_CHAT_MODEL
        model: process.env.SARVAM_CHAT_MODEL ?? "sarvam-30b",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...payload.messages.slice(-10).map((message) => ({
            role: message.role,
            content: message.text
          }))
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      request.log.error({ errorText }, "Sarvam AI chat request failed");
      return reply.status(StatusCodes.BAD_GATEWAY).send({
        message: "The AI chat service could not answer right now. Please try again in a moment."
      });
    }

    // ✅ Response shape is identical to OpenAI — no changes needed here
    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return reply.status(StatusCodes.BAD_GATEWAY).send({
        message: "The AI chat service returned an empty reply. Please try again."
      });
    }

    return reply.status(StatusCodes.OK).send({ reply: text });
  });
}