import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Props {
  file: Models.Document;
  onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
  onRemove: (email: string) => void;
}

const ImageThumbnail = ({ file }: { file: Models.Document }) => {
  return (
    <div className="file-details-thumbnail">
      <Thumbnail
        type={file.type}
        extension={file.extension}
        url={file.url}
        imageClassName=""
      />
      <div className="flex flex-col">
        <p className="subtitle-2 mb-1">{file.name}</p>
        <FormattedDateTime date={file.$createdAt} className="caption" />
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex">
      <p className="file-details-label text-left">{label}</p>
      <p className="file-details-value text-left">{value}</p>
    </div>
  );
};

// const fileDetails = () => {};

export function FileDetails({ file }: { file: Models.Document }) {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-12">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={convertFileSize(file.size)} />
        <DetailRow label="Owner:" value={file.owner.fullName} />
        <DetailRow
          label="Last Edited:"
          value={formatDateTime(file.$createdAt)}
        />
      </div>
    </>
  );
}

export function ShareInput({ file, onInputChange, onRemove }: Props) {
  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-2 text-light-100">
          Share files with other users
        </p>
        <input
          type="email"
          placeholder="Enter email address"
          className="share-input-field"
          onChange={(e) => onInputChange(e.target.value.trim().split(","))}
        />

        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Share with</p>
            <p className="subtitle-2 text-light-200">
              {file.users.length} user{file.users.length > 1 && "s"}
            </p>
          </div>
        </div>

        <ul className="pt-2">
          {file.users.map((email: string) => (
            <li key={email} className="flex items-center justify-between gap-2">
              <p className="subtitle-2">{email}</p>
              <Button
                className="share-remove-user"
                onClick={() => onRemove(email)}
              >
                <Image
                  src="/assets/icons/remove.svg"
                  alt="remove"
                  width={24}
                  height={24}
                  className="remove-icon"
                />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
