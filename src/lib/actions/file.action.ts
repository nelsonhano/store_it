"use server";

import {
  UploadFileProps,
  RenameFileProps,
  UpdateFileUsersProps,
  DeleteFileProps,
  GetFilesProps,
  FileType,
} from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const SORT_FIELDS = ["$createdAt", "$updatedAt", "name", "size"];
const DEFAULT_SORT = "$createdAt-desc";
const FILE_TYPES: FileType[] = ["document", "image", "video", "audio", "other"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requireUser = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User is not authenticated.");
  return currentUser as Models.Document;
};

// The owner attribute is a relationship, so it can come back as an
// expanded document or as a plain id. Accept both.
const getOwnerId = (file: Models.Document) =>
  typeof file.owner === "string" ? file.owner : file.owner?.$id;

// Server actions can be called directly with any arguments, so every
// mutation must check on the server that the caller owns the file.
const getOwnedFile = async (fileId: string) => {
  const currentUser = await requireUser();
  const { databases } = await createAdminClient();

  const file = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.filesCollectionId,
    fileId,
  );

  if (getOwnerId(file) !== currentUser.$id) {
    throw new Error("You do not have permission to modify this file.");
  }

  return { file, databases };
};

export const uploadFile = async ({ file, path }: UploadFileProps) => {
  try {
    // Never trust owner ids sent by the client.
    const currentUser = await requireUser();
    const { storage, databases } = await createAdminClient();

    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile,
    );

    const { type, extension } = getFileType(bucketFile.name);
    const documentId = ID.unique();

    const storageViewUrl = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.bucketId}/files/${bucketFile.$id}/view?project=${appwriteConfig.projectId}`;

    const fileDocument = {
      type,
      name: bucketFile.name,
      url: storageViewUrl,
      extension,
      size: bucketFile.sizeOriginal,
      owner: currentUser.$id,
      accountId: currentUser.accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        documentId,
        fileDocument,
      )
      .catch(async (err: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        throw err;
      });

    revalidatePath(path);

    return parseStringify({
      ...newFile,
      url: `/api/files/${newFile.$id}/view`,
    });
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

const createQueries = (
  currentUser: Models.Document,
  types: string[],
  sort: string,
  searchText: string,
  limit?: number,
) => {
  const queries = [
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ];

  if (types.length > 0) queries.push(Query.equal("type", types));
  if (searchText) queries.push(Query.contains("name", searchText));
  if (limit) queries.push(Query.limit(limit));

  // An empty or unknown sort value (for example "" from the URL) would
  // produce Query.orderDesc(""), which Appwrite rejects.
  let [sortBy, orderBy] = (sort || DEFAULT_SORT).split("-");
  if (!SORT_FIELDS.includes(sortBy)) {
    [sortBy, orderBy] = DEFAULT_SORT.split("-");
  }

  queries.push(
    orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
  );

  return queries;
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = DEFAULT_SORT,
  limit,
}: GetFilesProps) => {
  try {
    const { databases } = await createAdminClient();
    const currentUser = await requireUser();

    const queries = createQueries(currentUser, types, sort, searchText, limit);

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries,
    );

    const normalizedDocuments = files.documents.map((doc: Models.Document) => ({
      ...doc,
      url: doc.url?.startsWith("/api/files/")
        ? doc.url
        : `/api/files/${doc.$id}/view`,
    }));

    return parseStringify({ ...files, documents: normalizedDocuments });
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  try {
    const { databases } = await getOwnedFile(fileId);

    // The rename input starts with the full name ("photo.png"), so avoid
    // saving "photo.png.png".
    let baseName = name.trim();
    const suffix = extension ? `.${extension}` : "";
    if (suffix && baseName.toLowerCase().endsWith(suffix.toLowerCase())) {
      baseName = baseName.slice(0, -suffix.length);
    }
    if (!baseName) throw new Error("File name cannot be empty.");

    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      { name: `${baseName}${suffix}` },
    );

    revalidatePath(path);

    return parseStringify(updatedFile);
  } catch (e) {
    handleError(e, "Failed to rename file");
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  try {
    const { databases } = await getOwnedFile(fileId);

    const cleanEmails = Array.from(
      new Set(
        emails
          .map((email) => email.trim().toLowerCase())
          .filter((email) => EMAIL_PATTERN.test(email)),
      ),
    );

    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      { users: cleanEmails },
    );

    revalidatePath(path);

    return parseStringify(updatedFile);
  } catch (e) {
    handleError(e, "Failed to update file users");
  }
};

export const deleteFile = async ({ fileId, path }: DeleteFileProps) => {
  try {
    const { file, databases } = await getOwnedFile(fileId);
    const { storage } = await createAdminClient();

    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
    );

    // Use the bucket id stored on the document, not one sent by the client.
    await storage.deleteFile(appwriteConfig.bucketId, file.bucketFileId);

    revalidatePath(path);

    return parseStringify({ status: "success" });
  } catch (e) {
    handleError(e, "Failed to delete file");
  }
};

// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed() {
  try {
    const currentUser = await requireUser();
    const { databases } = await createAdminClient();

    const totalSpace = {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
    };

    // listDocuments returns only 25 rows by default, so page through
    // every file or the totals undercount.
    const pageSize = 100;
    let cursor: string | undefined;

    while (true) {
      const queries = [
        Query.equal("owner", [currentUser.$id]),
        Query.limit(pageSize),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const page = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        queries,
      );

      page.documents.forEach((file) => {
        const fileType: FileType = FILE_TYPES.includes(file.type)
          ? file.type
          : "other";
        const size = Number(file.size) || 0;

        totalSpace[fileType].size += size;
        totalSpace.used += size;

        if (
          !totalSpace[fileType].latestDate ||
          new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
        ) {
          totalSpace[fileType].latestDate = file.$updatedAt;
        }
      });

      if (page.documents.length < pageSize) break;
      cursor = page.documents[page.documents.length - 1].$id;
    }

    return parseStringify(totalSpace);
  } catch (error) {
    handleError(error, "Error calculating total space used");
  }
}
