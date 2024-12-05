"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { uploadFile } from "@/lib/actions/file.action";
import { usePathname } from "next/navigation";

interface Props {
  ownerId: string;
  accountId: string;
  className: string;
}

export default function FileUploader({ ownerId, accountId, className }: Props) {
  const [file, setFile] = useState<File[]>([]);
  const { toast } = useToast();
  const path = usePathname();
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFile(acceptedFiles);

      const uploadPromises = acceptedFiles.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          setFile((prevFiles) => prevFiles.filter((f) => f.name !== file.name));

          return toast({
            description: (
              <p className="body-2 text-white">
                <span className="font-semibold">{file.name}</span> is too large.
                Max file size is 50MB...
              </p>
            ),
            className: "error-toast",
          });
        }

        // Upload each file individually
        return uploadFile({ file, ownerId, accountId, path }).then(
          (uploadedFile) => {
            if (uploadedFile) {
              setFile((prevFiles) =>
                prevFiles.filter((f) => f.name !== file.name),
              );
            }
          },
        );
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
    },
    [ownerId, accountId, path],
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    fileName: string,
  ) => {
    e.stopPropagation();
    setFile((prevFile) => prevFile.filter((file) => file.name !== fileName));
  };

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input {...getInputProps()} />
      <Button type="button" className={cn("uploader-button", className)}>
        <Image
          src="assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />
        <p>upload</p>

        {file.length > 0 && (
          <ul className="uploader-preview-list">
            <h4 className="h4 text-light-100">Uploading</h4>

            {file.map((file, index) => {
              const { type, extension } = getFileType(file.name);

              return (
                <li
                  key={`${file.name}-${index}`}
                  className="uploader-preview-item"
                >
                  <div className="flex items-center gap-3">
                    <Thumbnail
                      type={type}
                      extension={extension}
                      url={convertFileToUrl(file)}
                      imageClassName=""
                    />

                    <div className="preview-item-name">
                      <p className="mb-4 text-brand">{file.name}</p>

                      <Image
                        src="/assets/icons/file-loader.gif"
                        alt="loading"
                        width={80}
                        height={26}
                      />
                    </div>
                  </div>

                  <Image
                    src="/assets/icons/remove.svg"
                    alt="remove"
                    width={24}
                    height={24}
                    onClick={(e) => handleRemoveFile(e, file.name)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Button>
    </div>
  );
}
