import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";
const BUCKET_NAME = "family-media";

// Media categories for organization
export type MediaCategory = "avatars" | "celebrations" | "icons" | "backgrounds" | "general";

// GET - List all media files
export async function GET(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as MediaCategory | null;

    const path = category ? `${FAMILY_USER_ID}/${category}` : FAMILY_USER_ID;

    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error listing media:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URLs for each file
    const filesWithUrls = (files || [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((file) => {
        const filePath = `${path}/${file.name}`;
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          ...file,
          path: filePath,
          url: urlData.publicUrl,
          category: category || "general",
        };
      });

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Upload a new media file
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const category = (formData.get("category") as MediaCategory) || "general";
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Generate filename
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const safeName = customName
      ? customName.replace(/[^a-zA-Z0-9-_]/g, "_")
      : file.name.replace(/[^a-zA-Z0-9-_.]/g, "_").split(".")[0];
    const filename = `${safeName}-${timestamp}.${ext}`;
    const filePath = `${FAMILY_USER_ID}/${category}/${filename}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading media:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json(
      {
        file: {
          path: data.path,
          url: urlData.publicUrl,
          category,
          name: filename,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a media file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Ensure the path belongs to this user
    if (!path.startsWith(FAMILY_USER_ID)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("Error deleting media:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
