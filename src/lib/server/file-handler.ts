import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getMimeType } from "@/lib/utils";
import { Models, Query } from "node-appwrite";

interface HandleFileOptions {
  disposition: "inline" | "attachment";
}

export async function handleFileRequest(
  _request: NextRequest,
  fileId: string,
  options: HandleFileOptions,
) {
  try {
    if (!fileId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 1. Verify caller session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 2. Fetch the file document from Appwrite databases
    const { databases, storage } = await createAdminClient();
    let file: Models.Document | null = null;

    try {
      file = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        fileId,
      );
    } catch {
      // Fallback: look up by bucketFileId for backward compatibility
      try {
        const list = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.filesCollectionId,
          [Query.equal("bucketFileId", fileId), Query.limit(1)],
        );
        if (list.total > 0) {
          file = list.documents[0];
        }
      } catch {
        file = null;
      }
    }

    if (!file) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 3. Authorization check: owner or shared email
    const ownerId =
      typeof file.owner === "string" ? file.owner : file.owner?.$id;
    const isOwner =
      ownerId === currentUser.$id ||
      file.accountId === currentUser.accountId;

    const userEmail = currentUser.email
      ? currentUser.email.trim().toLowerCase()
      : "";

    const isShared =
      Array.isArray(file.users) &&
      Boolean(userEmail) &&
      file.users.some(
        (email: string) =>
          typeof email === "string" && email.trim().toLowerCase() === userEmail,
      );

    if (!isOwner && !isShared) {
      // Return 404 to avoid confirming the existence of the file
      return new NextResponse("Not Found", { status: 404 });
    }

    // 4. Retrieve binary data from Appwrite storage
    let fileBuffer: ArrayBuffer;
    if (options.disposition === "attachment") {
      fileBuffer = await storage.getFileDownload(
        appwriteConfig.bucketId,
        file.bucketFileId,
      );
    } else {
      fileBuffer = await storage.getFileView(
        appwriteConfig.bucketId,
        file.bucketFileId,
      );
    }

    // 5. Construct response headers
    const extension = file.extension || file.name?.split(".").pop() || "";
    const contentType = getMimeType(extension);
    const safeFilename = (file.name || "file").replace(/["\r\n]/g, "");
    const encodedFilename = encodeURIComponent(file.name || "file");

    const contentDisposition =
      options.disposition === "attachment"
        ? `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
        : `inline; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;

    const cacheControl =
      options.disposition === "inline"
        ? "private, max-age=3600"
        : "no-store";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Error in handleFileRequest:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
