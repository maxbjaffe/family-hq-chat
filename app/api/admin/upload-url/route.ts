import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";
const BUCKET_NAME = "family-media";

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, category } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType required" }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Generate safe filename
    const ext = filename.split(".").pop();
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9-_.]/g, "_").split(".")[0];
    const finalFilename = `${safeName}-${timestamp}.${ext}`;
    const filePath = `${FAMILY_USER_ID}/${category || "general"}/${finalFilename}`;

    // Create signed upload URL (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL for after upload
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
