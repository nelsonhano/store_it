/* eslint-disable no-unused-vars */

export declare type FileType =
  | "document"
  | "image"
  | "video"
  | "audio"
  | "other";

export declare interface ActionType {
  label: string;
  icon: string;
  value: string;
}

export interface SegmentParams {
  // Add the relevant properties for SegmentParams
  id: string; // Example property
  name?: string;
}

export declare interface SearchParamProps {
  params?: Promise<SegmentParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface UploadFileProps {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
}
export declare interface GetFilesProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  limit?: number;
}
export declare interface RenameFileProps {
  fileId: string;
  name: string;
  extension: string;
  path: string;
}
export declare interface UpdateFileUsersProps {
  fileId: string;
  emails: string[];
  path: string;
}
export declare interface DeleteFileProps {
  fileId: string;
  bucketFileId: string;
  path: string;
}
