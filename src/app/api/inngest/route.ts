// // app/api/inngest/route.ts
// import { inngest } from "@/lib/inngest";
// import { serve } from "inngest/next"; // <-- FIX #1: Import the correct handler
// import { createClient } from "@/utils/supabase/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { Database } from "@/types_db";

// // --- 1. Initialize our clients (Supabase & Google) ---

// const getSupabaseClient = () => createClient();

// if (!process.env.GOOGLE_API_KEY) {
//   throw new Error("GOOGLE_API_KEY is not set");
// }
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// // --- 2. Define the System Prompt for Gemini ---

// const SYSTEM_PROMPT = `
// You are an expert TypeScript developer specializing in React.
// Your task is to generate a single, self-contained React functional component (TSX) based on a user's lesson outline.

// **Constraints:**
// 1.  **Imports:** You MUST use ES6 import syntax: \`import React, { useState, useEffect } from 'react';\`
//     - NEVER use require()
//     - NEVER use const React = require('react')
//     - ALWAYS use import statements
//     You MUST NOT import any other library besides React.
// 2.  **No Outside APIs:** Do NOT use \`fetch\`, \`window\`, \`document\`, \`localStorage\`, or any browser/node APIs.
// 3.  **Styling:** Use ONLY Tailwind CSS classes for styling. Do not use \`style\` tags or inline \`style={{}}\` objects.
// 4.  **Self-Contained:** All logic, state, and markup must be inside the single component.
// 5.  **Component Name:** The component MUST be named \`LessonComponent\`.
// 6.  **NO EXPORT:** Do NOT include any \`export\` statements. The component will be rendered directly.
// 7.  **Render Call:** You MUST call \`render(<LessonComponent />)\` at the very end of your code.
// 8.  **Output:** Respond ONLY with the raw TSX code. Do not add \`\`\`tsx\`\`\` markdown fences, explanations, or any other text. Just the code.

// **--- IMPORTANT EXAMPLES ---**

// **User Outline:** "A green button that says 'It Works'"

// **CORRECT Example (ALWAYS DO THIS):**
// import React, { useState } from 'react';

// const LessonComponent = () => {
//   return (
//     <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//       It Works
//     </button>
//   );
// };

// render(<LessonComponent />);

// **WRONG Examples (NEVER DO THIS):**
// const React = require('react'); // ❌ NEVER use require
// <button>It Works</button> // ❌ Must be inside component with render() call
// `;

// // --- 3. Define the Inngest Background Job ---
// type LessonGenerateEvent = {
//   name: "lesson/generate";
//   data: {
//     lessonId: string;
//     outline: string;
//   };
// };

// const generateLessonFn = inngest.createFunction(
//   { id: "generate-lesson-fn" },
//   { event: "lesson/generate" },
//   async ({ event }) => {
//     const { lessonId, outline } = event.data;
//     const supabase = await getSupabaseClient();

//     console.log(`Generating lesson ${lessonId} for outline: "${outline}"`);

//     try {
//       // Step 1: Call the Gemini 2.5 Flash API
//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.5-flash",
//         systemInstruction: SYSTEM_PROMPT,
//       });

//       const result = await model.generateContent(outline);
//       const tsxContent = result.response.text();

//       if (!tsxContent) {
//         throw new Error("AI returned empty content");
//       }

//       // Step 2: Validate the TSX (simple check for now)
//       // Step 2: Validate the TSX
//       if (tsxContent.includes("require(")) {
//         throw new Error("Generated content uses require() instead of import statements.");
//       }

//       if (!tsxContent.includes("import React") ||
//         !tsxContent.includes("const LessonComponent") ||
//         !tsxContent.includes("render(<LessonComponent />)")) {
//         throw new Error("Generated content is invalid (missing import, component definition, or render call).");
//       }      // Step 3: Update Supabase with the generated content
//       const { error } = await supabase
//         .from("lessons")
//         .update({
//           content: tsxContent,
//           status: "generated",
//         })
//         .eq("id", lessonId);

//       if (error) {
//         throw new Error(`Supabase update error: ${error.message}`);
//       }

//       return { success: true, lessonId };

//     } catch (error: any) {
//       // Step 4: Handle failure
//       console.error("Failed to generate lesson:", error.message);
//       await supabase
//         .from("lessons")
//         .update({ status: "failed" })
//         .eq("id", lessonId);

//       throw error;
//     }
//   }
// );

// // --- 4. Export the Inngest API handler ---
// //
// // FIX #2: Use the 'serve' function, not 'inngest.createHTTPHandler'
// //
// export const { GET, POST, PUT } = serve({
//   client: inngest,
//   functions: [generateLessonFn], // Register our function
// });

// app/api/inngest/route.ts
import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { traceable } from "langsmith/traceable";

// --- 1. Initialize our clients (Supabase & Google) ---

const getSupabaseClient = () => createClient();

// Verify required environment variables
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}

if (!process.env.LANGCHAIN_API_KEY) {
  console.warn("LANGCHAIN_API_KEY is not set - LangSmith tracing will be disabled");
}

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// --- 2. Define the System Prompt for Gemini ---

// const SYSTEM_PROMPT = `
// You are an expert TypeScript developer specializing in React.
// Your task is to generate a single, self-contained React functional component (TSX) based on a user's lesson outline.

// **Constraints:**
// 1.  **Imports:** You MUST use ES6 import syntax: \`import React, { useState, useEffect } from 'react';\`
//     - NEVER use require()
//     - NEVER use const React = require('react')
//     - ALWAYS use import statements
//     You MUST NOT import any other library besides React.
// 2.  **No Outside APIs:** Do NOT use \`fetch\`, \`window\`, \`document\`, \`localStorage\`, or any browser/node APIs.
// 3.  **Styling:** Use ONLY Tailwind CSS classes for styling. Do not use \`style\` tags or inline \`style={{}}\` objects.
// 4.  **Self-Contained:** All logic, state, and markup must be inside the single component.
// 5.  **Component Name:** The component MUST be named \`LessonComponent\`.
// 6.  **NO EXPORT:** Do NOT include any \`export\` statements. The component will be rendered directly.
// 7.  **Render Call:** You MUST call \`render(<LessonComponent />)\` at the very end of your code.
// 8.  **Output:** Respond ONLY with the raw TSX code. Do not add \`\`\`tsx\`\`\` markdown fences, explanations, or any other text. Just the code.

// **--- IMPORTANT EXAMPLES ---**

// **User Outline:** "A green button that says 'It Works'"

// **CORRECT Example (ALWAYS DO THIS):**
// import React, { useState } from 'react';

// const LessonComponent = () => {
//   return (
//     <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//       It Works
//     </button>
//   );
// };

// render(<LessonComponent />);

// **WRONG Examples (NEVER DO THIS):**
// const React = require('react'); // ❌ NEVER use require
// <button>It Works</button> // ❌ Must be inside component with render() call
// `;

const SYSTEM_PROMPT = `
You are an expert TypeScript developer specializing in React.
You are an expert **Instructional Designer** and **React Developer**.
Your task is to take a user's topic and turn it into a **small, interactive, self-contained lesson** as a React component.

**CORE GOAL: MAKE IT INTERACTIVE.** Do not just show static text. Use React's \`useState\` hook to create an engaging, hands-on experience.

Your task is to generate a single, self-contained React functional component (TSX) based on a user's lesson outline.

**Constraints:**
1.  **Imports:** You MUST use ES6 import syntax: \`import React, { useState, useEffect } from 'react';\`
    - NEVER use require()
    - NEVER use const React = require('react')
    - ALWAYS use import statements
    You MUST NOT import any other library besides React.
2.  **No Outside APIs:** Do NOT use \`fetch\`, \`window\`, \`document\`, \`localStorage\`, or any browser/node APIs.
3.  **Styling:** Use ONLY Tailwind CSS classes for styling. Do not use \`style\` tags or inline \`style={{}}\` objects.
4.  **Self-Contained:** All logic, state, and markup must be inside the single component.
5.  **Component Name:** The component MUST be named \`LessonComponent\`.
6.  **NO EXPORT:** Do NOT include any \`export\` statements. The component will be rendered directly.
7.  **Render Call:** You MUST call \`render(<LessonComponent />)\` at the very end of your code.
8.  **Output:** Respond ONLY with the raw TSX code. Do not add \`\`\`tsx\`\`\` markdown fences, explanations, or any other text. Just the code.

**--- IMPORTANT EXAMPLES ---**

**User Outline:** "A green button that says 'It Works'"

**CORRECT Example (ALWAYS DO THIS):**
import React, { useState } from 'react';

const LessonComponent = () => {
  return (
    <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
      It Works
    </button>
  );
};

render(<LessonComponent />);

**WRONG Examples (NEVER DO THIS):**
const React = require('react'); // ❌ NEVER use require
<button>It Works</button> // ❌ Must be inside component with render() call
`;


// Wrap the AI generation in a traceable function for LangSmith
const generateWithAI = traceable(
  async (outline: string, systemPrompt: string) => {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(outline);
    return result.response.text();
  },
  { name: "generate-lesson-code" }
);

// --- 3. Define the Inngest Background Job ---
// type LessonGenerateEvent = {
//   name: "lesson/generate";
//   data: {
//     lessonId: string;
//     outline: string;
//   };
// };

const generateLessonFn = inngest.createFunction(
  { id: "generate-lesson-fn" },
  { event: "lesson/generate" },
  async ({ event }) => {
    const { lessonId, outline } = event.data;
    const supabase = await getSupabaseClient();

    console.log(`[LangSmith] Generating lesson ${lessonId} for outline: "${outline}"`);

    try {
      // Step 1: Call Gemini via traceable wrapper (automatically traced by LangSmith)
      const tsxContent = await generateWithAI(outline, SYSTEM_PROMPT);

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
