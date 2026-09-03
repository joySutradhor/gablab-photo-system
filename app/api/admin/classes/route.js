import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(request) {
  try {
    const supabaseAdmin = createAdminClient();

    // Get Authorization header
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    // Verify logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized. Invalid session.",
        },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();

    const className = formData.get("className");
    const classDate = formData.get("classDate");
    const classTime = formData.get("classTime");
    const photo = formData.get("photo");

    // Validate
    if (!className || !classDate || !classTime || !photo) {
      return NextResponse.json(
        {
          error: "Class name, date, time and photo are required.",
        },
        { status: 400 }
      );
    }

    if (!(photo instanceof File)) {
      return NextResponse.json(
        {
          error: "Invalid photo file.",
        },
        { status: 400 }
      );
    }

    // Generate unique access code
    let accessCode;
    let isUnique = false;

    while (!isUnique) {
      accessCode = generateAccessCode();

      const { data: existingClass, error: checkError } =
        await supabaseAdmin
          .from("classes")
          .select("id")
          .eq("access_code", accessCode)
          .maybeSingle();

      if (checkError) {
        console.error("Code check error:", checkError);

        return NextResponse.json(
          {
            error: "Failed to generate access code.",
          },
          { status: 500 }
        );
      }

      if (!existingClass) {
        isUnique = true;
      }
    }

    // Create class
    const { data: newClass, error: insertError } =
      await supabaseAdmin
        .from("classes")
        .insert({
          class_name: className,
          class_date: classDate,
          class_time: classTime,
          access_code: accessCode,
        })
        .select()
        .single();

    if (insertError) {
      console.error("Insert error:", insertError);

      return NextResponse.json(
        {
          error: "Failed to create class.",
        },
        { status: 500 }
      );
    }

    // File extension
    const fileExtension =
      photo.name.split(".").pop()?.toLowerCase() || "jpg";

    // Unique storage path
    const filePath = `${newClass.id}/group-photo.${fileExtension}`;

    // Convert photo
    const arrayBuffer = await photo.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload photo
    const { error: uploadError } = await supabaseAdmin.storage
      .from("class-photos")
      .upload(filePath, fileBuffer, {
        contentType: photo.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      // Remove class if photo upload fails
      await supabaseAdmin
        .from("classes")
        .delete()
        .eq("id", newClass.id);

      return NextResponse.json(
        {
          error: "Photo upload failed.",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Save photo path
    const { data: updatedClass, error: updateError } =
      await supabaseAdmin
        .from("classes")
        .update({
          photo_path: filePath,
        })
        .eq("id", newClass.id)
        .select()
        .single();

    if (updateError) {
      console.error("Update error:", updateError);

      // Cleanup photo
      await supabaseAdmin.storage
        .from("class-photos")
        .remove([filePath]);

      await supabaseAdmin
        .from("classes")
        .delete()
        .eq("id", newClass.id);

      return NextResponse.json(
        {
          error: "Failed to save photo path.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Class and photo created successfully.",
        class: updatedClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}