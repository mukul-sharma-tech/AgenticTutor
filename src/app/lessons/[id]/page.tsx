// app/lessons/[id]/page.tsx

import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import LessonRenderer from "@/app/components/LessonRenderer";

type LessonPageProps = {
  params: {
    id: string;
  };
};

export default async function LessonPage({ params }: LessonPageProps) {
  
  // --- THIS IS THE FIX (Part 1) ---
  // We force Next.js to read the 'id' *immediately*.
  // This resolves the "params is a Promise" error.
  const { id } = await params;
  // --- END OF FIX (Part 1) ---

  // --- THIS IS THE FIX (Part 2) ---
  // We put 'await' back in, because createClient() IS async.
  // This will fix the "supabase.from is not a function" error.
  const supabase = await createClient();
  // --- END OF FIX (Part 2) ---

  // This code will now work because 'supabase' is the real client.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id) // Use the 'id' variable
    .single();

  if (!lesson) {
    notFound();
  }
function toSentenceCase(text: string) {
  if (!text) return "";
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 block">
        &larr; Back to all lessons
      </Link>

<h1 className="text-3xl font-bold mb-4">{toSentenceCase(lesson.outline)}</h1>

      <div>
        {lesson.status === "generating" && (
          <div className="border rounded-lg p-6 bg-gray-50 text-gray-500">
            Lesson is still generating...
          </div>
        )}

        {lesson.status === "failed" && (
          <div className="border rounded-lg p-6 bg-red-50 text-red-700">
            Lesson failed to generate. Check Inngest logs for details.
          </div>
        )}

        {lesson.status === "generated" && (
          <LessonRenderer code={lesson.content || ""} />
        )}
      </div>
    </div>
  );
}