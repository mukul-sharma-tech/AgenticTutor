// // app/page.tsx
// import { createClient } from "@/utils/supabase/server";
// import LessonForm from "@/app/components/LessonForm";
// import LessonsTable from "@/app/components/LessonsTable";
// import { Database } from "./types_db";
// // Define our Lesson type
// export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

// export default async function Home() {
//   const supabase = await createClient();

//   // Fetch the initial list of lessons, most recent first
//   const { data: lessons, error } = await supabase
//     .from("lessons")
//     .select("*")
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching lessons:", error);
//   }

//   return (
//     <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
//       <h1 className="text-3xl font-bold mb-6">Digital Lessons Generator</h1>

//       <div className="mb-8">
//         <LessonForm />
//       </div>

//       <div>
//         <h2 className="text-2xl font-semibold mb-4">Generated Lessons</h2>
//         {/* We pass the server-fetched lessons as the initial state */}
//         <LessonsTable initialLessons={lessons || []} />
//       </div>
//     </div>
//   );
// }

import { createClient } from "@/utils/supabase/server";
import LessonForm from "@/app/components/LessonForm";
import LessonsTable from "@/app/components/LessonsTable";
import { Database } from "./types_db";

export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

export default async function Home() {
  const supabase = await createClient();

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching lessons:", error);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 text-gray-800">
      <div className="w-full max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-4xl font-extrabold mb-8 text-indigo-700 text-center">
          🌸 Digital Lessons Generator
        </h1>

        <div className="mb-10">
          <LessonForm />
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-indigo-100">
          <LessonsTable initialLessons={lessons || []} />
        </div>
      </div>
    </main>
  );
}
