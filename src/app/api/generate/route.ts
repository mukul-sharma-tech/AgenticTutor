// // app/api/generate/route.ts
// import { createClient } from "@/utils/supabase/server";
// import { NextResponse } from "next/server";
// import { inngest } from "@/app/api/inngest/route"; // <-- IMPORT INNGEST

// export async function POST(req: Request) {
//   try {
//     const { outline } = await req.json();

//     if (!outline) {
//       return NextResponse.json({ error: "Outline is required" }, { status: 400 });
//     }

//     const supabase = await createClient();

//     // 1. Create the lesson record in Supabase
//     const { data, error } = await supabase
//       .from("lessons")
//       .insert({
//         outline: outline,
//         status: "generating",
//       })
//       .select("id")
//       .single();

//     if (error) {
//       console.error("Supabase insert error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     // 2. Send an event to Inngest to do the background work
//     await inngest.send({
//       name: "lesson/generate",
//       data: {
//         lessonId: data.id,
//         outline: outline,
//       },
//     });

//     // 3. Return an immediate response
//     return NextResponse.json({ lessonId: data.id }, { status: 202 });

//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }

// app/api/generate/route.ts
// import { createClient } from "@/utils/supabase/server";
// import { NextResponse } from "next/server";
// import { inngest } from "@/lib/inngest"; // <-- THE FIX: Import from the new shared file

// export async function POST(req: Request) {
//   try {
//     const { outline } = await req.json();

//     if (!outline) {
//       return NextResponse.json({ error: "Outline is required" }, { status: 400 });
//     }

//     const supabase = await createClient();

//     // 1. Create the lesson record in Supabase
//     const { data, error } = await supabase
//       .from("lessons")
//       .insert({
//         outline: outline,
//         status: "generating",
//       })
//       .select("id")
//       .single();

//     if (error) {
//       console.error("Supabase insert error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     // 2. Send an event to Inngest to do the background work
//     await inngest.send({
//       name: "lesson/generate",
//       data: {
//         lessonId: data.id,
//         outline: outline,
//       },
//     });

//     // 3. Return an immediate response
//     return NextResponse.json({ lessonId: data.id }, { status: 202 });

//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { inngest } from "@/lib/inngest"; // correct import

// Define request body type
interface LessonRequestBody {
  outline: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: LessonRequestBody = await req.json();

    if (!body.outline || typeof body.outline !== "string") {
      return NextResponse.json({ error: "Outline is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Insert a lesson record into Supabase
    const { data, error } = await supabase
      .from("lessons")
      .insert([
        {
          outline: body.outline,
          status: "generating",
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to insert lesson" },
        { status: 500 }
      );
    }

    // 2. Send event to Inngest for background task
    await inngest.send({
      name: "lesson/generate",
      data: {
        lessonId: data.id,
        outline: body.outline,
      },
    });

    // 3. Return response immediately
    return NextResponse.json({ lessonId: data.id }, { status: 202 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
