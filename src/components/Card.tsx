import { Models } from "node-appwrite";
import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDrop from "@/components/ActionDrop";

export default function Card({ file }: { file: Models.Document }) {
  return (
    <Link href={file.url} target="_blank" className="file-card">
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          imageClassName="!size-11"
          className="!size-20"
        />

        <div className="flex flex-col items-end justify-between">
          <ActionDrop />
          <p className="body-1">{convertFileSize(file.size)}</p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        <FormattedDateTime
          date={file.$createdAt}
          className="body-2 text-light-100"
        />
        <p className="line-clamp-1 caption-top text-light-200">
          By: {file.owner.fullName}
        </p>
      </div>
    </Link>
  );
}
