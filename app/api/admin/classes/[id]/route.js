
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

export async function DELETE(request, { params }) {
  try {
    const supabase = createSupabaseAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Class ID is required.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // GET CLASS FIRST
    // ---------------------------------------------------------

    const { data: classData, error: fetchError } = await supabase
      .from("classes")
      .select("id, photo_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch class before delete error:", fetchError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to find the class.",
        },
        { status: 500 },
      );
    }

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          error: "Class not found.",
        },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------
    // DELETE PHOTO FROM STORAGE
    // ---------------------------------------------------------

    if (classData.photo_path) {
      const { error: storageError } = await supabase.storage
        .from("class-photos")
        .remove([classData.photo_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);

        return NextResponse.json(
          {
            success: false,
            error: "Unable to delete the class photo.",
          },
          { status: 500 },
        );
      }
    }

    // ---------------------------------------------------------
    // DELETE CLASS FROM DATABASE
    // ---------------------------------------------------------

    const { error: deleteError } = await supabase
      .from("classes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Class delete error:", deleteError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to delete the class.",
        },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Class deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete class error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while deleting the class.",
      },
      { status: 500 },
    );
  }
}

