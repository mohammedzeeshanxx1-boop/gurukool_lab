import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export interface TutorExplainInput {
  question: string;
  subject: string;
  classLevel: string;
  board: string;
  language: string;
}

export interface TutorExplainResult {
  explanation: string;
  model: string;
}

const DEFAULT_MODEL = "gemini-4-hydrogen";

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && key !== "MY_GEMINI_API_KEY");
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isGeminiConfigured() || !apiKey) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function generateConceptExplanation(
  input: TutorExplainInput,
): Promise<TutorExplainResult> {
  const ai = getGeminiClient();

  const systemInstruction = [
    "You are an academic STEM tutor for school students in Classes 6 to 10.",
    `Target curriculum alignment: ${input.board}, ${input.classLevel}, Subject: ${input.subject}.`,
    `Respond clearly in ${input.language}.`,
    "Keep explanations accurate, age-appropriate, structured with clear conceptual steps, and free of unverified curriculum page numbers.",
  ].join(" ");

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: input.question,
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("EMPTY_MODEL_RESPONSE");
  }

  return {
    explanation: text,
    model: DEFAULT_MODEL,
  };
}
