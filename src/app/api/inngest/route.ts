// app/api/inngest/route.ts
import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { traceable } from "langsmith/traceable";

import { SYSTEM_PROMPT } from "@/utils/supabase/SYSTEM_PROMPT";
// --- 1. Initialize our clients (Supabase & Google) ---

const getSupabaseClient = () => createClient();

// Verify required environment variables
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}

if (!process.env.GOOGLE_API_KEY2) {
  console.warn("GOOGLE_API_KEY2 is not set. Gemini fallback will not be available.");
}

if (!process.env.LANGCHAIN_API_KEY) {
  console.warn("LANGCHAIN_API_KEY is not set - LangSmith tracing will be disabled");
}

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

function expandPrompt(outline: string): string {
  const templates = [
    (t: string) => `Create an interactive React lesson teaching the concept of "${t}" in a fun and visual way. Include small quizzes or sliders to make it hands-on. Make it fully responsive.`,
    (t: string) => `Design a short, self-contained React lesson that helps users understand "${t}" through interactivity and visual feedback. Must be mobile-first.`,
    (t: string) => `Generate a mini interactive React component that explains "${t}" using examples, quizzes, or dynamic visuals. It must look good on all screen sizes.`,
    (t: string) => `Teach the topic "${t}" as if you were a friendly AI tutor — use React interactivity to make learning fun. Ensure the layout is responsive.`,
  ];

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate(outline);
}

// Wrap the AI generation in a traceable function for LangSmith
const generateWithAI = traceable(
  async (outline: string, systemPrompt: string) => {
    try {
      // Step 1: Try the primary model (Gemini 2.5 Flash)
      console.log("Attempting to generate lesson with gemini-2.5-flash...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(outline);
      return result.response.text();
    } catch (error) {
      console.error("Failed to generate lesson with gemini-2.5-flash:", error);
      console.warn("Falling back to gemini-2.0-flash.");

      try {
        // Step 2: Fallback to the secondary model (Gemini 2.0 Pro)
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: systemPrompt,
        });
        const result = await fallbackModel.generateContent(outline);
        return result.response.text();
      } catch (fallbackError) {
        console.error("Failed to generate lesson with fallback model gemini-2.0-pro:", fallbackError);
        throw fallbackError; // Re-throw if the fallback also fails
      }
    }
  },
  { name: "generate-lesson-code" }
);

// --- 3. Define the Inngest Background Job ---
const generateLessonFn = inngest.createFunction(
  { id: "generate-lesson-fn" },
  { event: "lesson/generate" },
  async ({ event }) => {
    const { lessonId, outline } = event.data;
    const supabase = await getSupabaseClient();

    console.log(`[LangSmith] Generating lesson ${lessonId} for outline: "${outline}"`);

    try {
      // Step 1: Call Gemini via traceable wrapper (automatically traced by LangSmith)
      // const tsxContent = await generateWithAI(outline, SYSTEM_PROMPT);

      const expandedPrompt = expandPrompt(outline);
      const tsxContent = await generateWithAI(expandedPrompt, SYSTEM_PROMPT);

      if (!tsxContent) {
        throw new Error("AI returned empty content");
      }

      console.log(`[LangSmith] Generated ${tsxContent.length} characters of TSX`);

      // Step 2: Validate the TSX
      if (tsxContent.includes("require(")) {
        throw new Error("Generated content uses require() instead of import statements.");
      }

      if (!tsxContent.includes("import React") ||
        !tsxContent.includes("const LessonComponent") ||
        !tsxContent.includes("render(<LessonComponent />)")) {
        throw new Error("Generated content is invalid (missing import, component definition, or render call).");
      }

      // Step 3: Update Supabase with the generated content
      const { error } = await supabase
        .from("lessons")
        .update({
          content: tsxContent,
          status: "generated",
        })
        .eq("id", lessonId);

      if (error) {
        throw new Error(`Supabase update error: ${error.message}`);
      }

      console.log(`[LangSmith] Successfully saved lesson ${lessonId} to database`);
      return { success: true, lessonId };

    } catch (error: unknown) {
      // Step 4: Handle failure and ensure error.message is accessible
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("[LangSmith] Failed to generate lesson:", errorMessage);

      await supabase
        .from("lessons")
        .update({ status: "failed" })
        .eq("id", lessonId);

      throw error;
    }
  }
);

// --- 4. Export the Inngest API handler ---
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateLessonFn],
});