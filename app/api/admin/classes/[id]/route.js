
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// ======================================================
// UPDATE CLASS
// ======================================================

export async function PUT(request, { params }) {
  try {
    const supabaseAdmin = createAdminClient();

    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Next.js 15:
    // params is a Promise
    // --------------------------------------------------

    const { id: classId } = await params;

    if (!classId) {
      return NextResponse.json(
        {
          error: "Class ID is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Get existing class
    // --------------------------------------------------

    const {
      data: existingClass,
      error: classError,
    } = await supabaseAdmin
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    if (classError || !existingClass) {
      return NextResponse.json(
        {
          error: "Class not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Get form data
    // --------------------------------------------------

    const formData = await request.formData();

    const className = formData.get("className");
    const classDate = formData.get("classDate");
    const classTime = formData.get("classTime");
    const photo = formData.get("photo");

    // --------------------------------------------------
    // Validate
    // --------------------------------------------------

    if (!className || !classDate || !classTime) {
      return NextResponse.json(
        {
          error: "Class name, date and time are required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Check whether a NEW photo was uploaded
    // --------------------------------------------------

    const hasNewPhoto =
      photo &&
      photo instanceof File &&
      photo.size > 0;

    let newPhotoPath = existingClass.photo_path;

    // ==================================================
    // NEW PHOTO
    // ==================================================

    if (hasNewPhoto) {
      const fileExtension =
        photo.name.split(".").pop()?.toLowerCase() || "jpg";

      const newFilePath =
        `${classId}/group-photo-${Date.now()}.${fileExtension}`;

      const arrayBuffer = await photo.arrayBuffer();

      const fileBuffer = new Uint8Array(arrayBuffer);

      // ------------------------------------------------
      // Upload new photo
      // ------------------------------------------------

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("class-photos")
          .upload(
            newFilePath,
            fileBuffer,
            {
              contentType: photo.type || "image/jpeg",
              upsert: false,
            }
          );

      if (uploadError) {
        return NextResponse.json(
          {
            error: "New photo upload failed.",
            details: uploadError.message,
          },
          { status: 500 }
        );
      }

      newPhotoPath = newFilePath;
    }

    // ==================================================
    // UPDATE DATABASE
    // ==================================================

    const {
      data: updatedClass,
      error: updateError,
    } = await supabaseAdmin
      .from("classes")
      .update({
        class_name: className,
        class_date: classDate,
        class_time: classTime,

        // IMPORTANT:
        // access_code is intentionally NOT updated.
        photo_path: newPhotoPath,
      })
      .eq("id", classId)
      .select()
      .single();

    // --------------------------------------------------
    // If DB update fails
    // --------------------------------------------------

    if (updateError) {
      // Remove newly uploaded photo
      // because database update failed.

      if (
        hasNewPhoto &&
        newPhotoPath &&
        newPhotoPath !== existingClass.photo_path
      ) {
        await supabaseAdmin.storage
          .from("class-photos")
          .remove([newPhotoPath]);
      }

      return NextResponse.json(
        {
          error: "Failed to update class.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // ==================================================
    // DELETE OLD PHOTO
    // ==================================================

    // Only delete old photo when a NEW photo
    // was successfully uploaded and database updated.

    if (
      hasNewPhoto &&
      existingClass.photo_path &&
      existingClass.photo_path !== newPhotoPath
    ) {
      const {
        error: deletePhotoError,
      } = await supabaseAdmin.storage
        .from("class-photos")
        .remove([
          existingClass.photo_path,
        ]);

      if (deletePhotoError) {
        console.error(
          "Old photo delete error:",
          deletePhotoError
        );
      }
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        message: "Class updated successfully.",
        class: updatedClass,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update class error:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Something went wrong while updating the class.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE CLASS
// ======================================================

export async function DELETE(request, { params }) {
  try {
    const supabaseAdmin = createAdminClient();

    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Next.js 15:
    // params is a Promise
    // --------------------------------------------------

    const { id: classId } = await params;

    if (!classId) {
      return NextResponse.json(
        {
          error: "Class ID is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Find class
    // --------------------------------------------------

    const {
      data: existingClass,
      error: classError,
    } = await supabaseAdmin
      .from("classes")
      .select("id, photo_path")
      .eq("id", classId)
      .single();

    if (classError || !existingClass) {
      return NextResponse.json(
        {
          error: "Class not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Delete photo from Storage
    // --------------------------------------------------

    if (existingClass.photo_path) {
      const {
        error: deletePhotoError,
      } = await supabaseAdmin.storage
        .from("class-photos")
        .remove([
          existingClass.photo_path,
        ]);

      if (deletePhotoError) {
        console.error(
          "Photo delete error:",
          deletePhotoError
        );
      }
    }

    // --------------------------------------------------
    // Delete class from database
    // --------------------------------------------------

    const {
      error: deleteClassError,
    } = await supabaseAdmin
      .from("classes")
      .delete()
      .eq("id", classId);

    if (deleteClassError) {
      return NextResponse.json(
        {
          error: "Failed to delete class.",
          details: deleteClassError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Class deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete class error:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Something went wrong while deleting the class.",
      },
      { status: 500 }
    );
  }
}

