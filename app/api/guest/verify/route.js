import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function POST(request) {
  try {
    const supabase = createSupabaseAdmin();

    const body = await request.json();

    const accessCode = body.accessCode?.trim();

    // Validate access code
    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Access code is required.",
        },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(accessCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid 6-digit access code.",
        },
        { status: 400 },
      );
    }

    const { data: classData, error } = await supabase
      .from("classes")
      .select("id, class_name, class_date, class_time, photo_path")
      .eq("access_code", accessCode)
      .maybeSingle();

    if (error) {
      console.error("Verify code error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify access code.",
        },
        { status: 500 },
      );
    }

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid access code.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        class: classData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Guest verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
