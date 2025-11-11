// // app/components/LessonsTable.tsx
// "use client";

// import { createClient } from "@/utils/supabase/client";
// import { Lesson } from "@/app/page"; // Import the type we made
// import { useEffect, useState } from "react";
// import Link from "next/link";

// type LessonsTableProps = {
//   initialLessons: Lesson[];
// };

// export default function LessonsTable({ initialLessons }: LessonsTableProps) {
//   const [lessons, setLessons] = useState(initialLessons);
//   const supabase = createClient(); // The browser client

//   useEffect(() => {
//     // This effect runs once on mount
//     const channel = supabase
//       .channel("lessons-feed")
//       .on(
//         "postgres_changes",
//         {
//           event: "*", // Listen to INSERT, UPDATE, DELETE
//           schema: "public",
//           table: "lessons",
//         },
//         (payload) => {
//           console.log("Realtime payload received:", payload);

//           if (payload.eventType === "INSERT") {
//             // Add the new lesson to the top of the list
//             setLessons((currentLessons) => [
//               payload.new as Lesson,
//               ...currentLessons,
//             ]);
//           }

//           if (payload.eventType === "UPDATE") {
//             // Find and update the lesson in the list
//             setLessons((currentLessons) =>
//               currentLessons.map((lesson) =>
//                 lesson.id === payload.new.id
//                   ? (payload.new as Lesson)
//                   : lesson
//               )
//             );
//           }
//         }
//       )
//       .subscribe();

//     // Cleanup function to remove the channel subscription
//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [supabase]); // Re-run if supabase client changes (it won't)

//   if (lessons.length === 0) {
//     return <p className="text-gray-500">No lessons generated yet.</p>;
//   }

//   return (
//     <div className="overflow-x-auto rounded-lg border">
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//               Lesson Outline
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//               Status
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {lessons.map((lesson) => (
//             <tr key={lesson.id} className="hover:bg-gray-50">
//               <td className="px-6 py-4 whitespace-nowrap">
//                 <Link
//                   href={`/lessons/${lesson.id}`}
//                   className="text-blue-600 hover:underline"
//                 >
//                   {lesson.outline}
//                 </Link>
//               </td>
//               <td className="px-6 py-4 whitespace-nowrap">
//                 <span
//                   className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                     lesson.status === "generated"
//                       ? "bg-green-100 text-green-800"
//                       : "bg-yellow-100 text-yellow-800 animate-pulse"
//                   }`}
//                 >
//                   {lesson.status}
//                 </span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }


"use client";

import { createClient } from "@/utils/supabase/client";
import { Lesson } from "@/app/page";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

type LessonsTableProps = {
  initialLessons: Lesson[];
};

export default function LessonsTable({ initialLessons }: LessonsTableProps) {
  const [lessons, setLessons] = useState(initialLessons);
  const [isOpen, setIsOpen] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("lessons-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lessons" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLessons((curr) => [payload.new as Lesson, ...curr]);
          }
          if (payload.eventType === "UPDATE") {
            setLessons((curr) =>
              curr.map((lesson) =>
                lesson.id === payload.new.id
                  ? (payload.new as Lesson)
                  : lesson
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (lessons.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4 italic">
        No lessons generated yet. ✨
      </p>
    );
  }

  return (
    <div className="rounded-2xl shadow-sm border border-indigo-100 bg-white/70 backdrop-blur-sm p-4">
      {/* Header + Collapse Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h2 className="text-2xl font-semibold text-indigo-700">
          Generated Lessons
        </h2>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-1 text-sm px-3 py-1.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition self-end sm:self-auto"
        >
          {isOpen ? (
            <>
              <ChevronUp size={16} /> Hide
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show
            </>
          )}
        </button>
      </div>

      {/* Collapsible Section */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-indigo-100 mt-2">
          <table className="min-w-full divide-y divide-indigo-100 text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-sky-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-indigo-700 uppercase tracking-wider">
                  Lesson Outline
                </th>
                <th className="px-6 py-3 text-left font-semibold text-indigo-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {lessons.map((lesson, idx) => (
                <tr
                  key={lesson.id}
                  className={`transition ${
                    idx % 2 === 0
                      ? "bg-white hover:bg-indigo-50"
                      : "bg-indigo-50/50 hover:bg-indigo-100"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                      {lesson.outline}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                        lesson.status === "generated"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse"
                      }`}
                    >
                      {lesson.status === "generated"
                        ? "✅ Generated"
                        : "⏳ Generating..."}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 mt-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-4 rounded-xl border border-indigo-100 bg-white/90 shadow-sm hover:shadow-md transition"
            >
              <Link
                href={`/lessons/${lesson.id}`}
                className="block font-medium text-indigo-700 hover:underline mb-2"
              >
                {lesson.outline}
              </Link>
              <span
                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                  lesson.status === "generated"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse"
                }`}
              >
                {lesson.status === "generated"
                  ? "✅ Generated"
                  : "⏳ Generating..."}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
