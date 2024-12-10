import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
  type: string;
  extension: string;
  url: string;
  imageClassName: string;
  className?: string;
}

export default function Thumbnail({
  type,
  extension,
  url = "",
  imageClassName,
  className,
}: Props) {
  const isImage = type === "image" && extension !== "svg";

  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={isImage ? url : getFileIcon(extension, type)}
        alt="thumbnail"
        width={100}
        height={100}
        className={cn(
          "size-8 border-4 object-cover",
          imageClassName,
          isImage && "thumbnail-image",
        )}
      />
    </figure>
  );
}
