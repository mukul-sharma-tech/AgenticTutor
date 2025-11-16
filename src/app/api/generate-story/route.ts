import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerateStoryRequestBody {
  content: string;
  topic: string;
  language: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: GenerateStoryRequestBody = await req.json();

    if (!body.content || !body.topic || !body.language) {
      return NextResponse.json(
        { error: "Content, topic, and language are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY2 || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Map language to proper names and instructions
    const languageMap: Record<string, string> = {
      english: "English",
      hindi: "Hindi (हिंदी)",
      hinglish: "Hinglish (mix of Hindi and English)"
    };
    
    const languageName = languageMap[body.language.toLowerCase()] || body.language;
    
    const systemInstruction = `You are a friendly teacher who explains topics in story format. Always respond in the language specified by the user. If the user asks for Hindi, respond entirely in Hindi (हिंदी). If they ask for Hinglish, use a mix of Hindi and English. If they ask for English, use English only.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    const prompt = `You are a friendly teacher explaining a topic in a story-like format.

IMPORTANT: You MUST write the ENTIRE response in ${languageName} language. Do not use English unless the language is English or Hinglish.

Topic: "${body.topic}"
Content to explain: "${body.content}"

Instructions:
1. Write the ENTIRE explanation in ${languageName} language only.
2. Use a simple, engaging, and story-like format suitable for beginners.
3. Use friendly storytelling with examples and analogies.
4. Avoid technical jargon - explain in simple terms.
5. Make it feel like a human teacher is explaining naturally.
6. Keep it engaging and easy to understand.
7. Use real-world examples when possible.

Now, write the explanation story in ${languageName}:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedStory = response.text();

    return NextResponse.json({ story: generatedStory }, { status: 200 });
  } catch (error) {
    console.error("Error generating story:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to generate story: ${errorMessage}` },
      { status: 500 }
    );
  }
}

