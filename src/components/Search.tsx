"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.action";
import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import { useDebounce } from "use-debounce";
import FormattedDateTime from "@/components/FormattedDateTime";

export default function Search() {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Models.Document[]>([]);
  const router = useRouter();
  const path = usePathname();
  const [debounceQuery] = useDebounce(query, 300);

  useEffect(() => {
    const fetchFiles = async () => {
      if (debounceQuery.length === 0) {
        setResults([]);
        setOpen(false);
        // Only clear the ?query= filter. Pushing on every empty query
        // also ran on first load and wiped other params like ?sort=.
        if (searchQuery) router.push(path);
        return;
      }

      try {
        const files = await getFiles({ searchText: debounceQuery, types: [] });
        setResults(files?.documents ?? []);
      } catch {
        setResults([]);
      }
      setOpen(true);
    };

    fetchFiles();
  }, [debounceQuery]);

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  const handleClickItem = (file: Models.Document) => {
    setOpen(false);
    setResults([]);

    router.push(
      `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${encodeURIComponent(query)}`,
    );
  };
  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="Search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />

        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((item) => (
                <li
                  className="flex items-center justify-between"
                  key={item.$id}
                  onClick={() => handleClickItem(item)}
                >
                  <div className="flex cursor-pointer items-center gap-4">
                    {/* <Link href={item.type}> */}
                    <Thumbnail
                      type={item.type}
                      extension={item.extension}
                      url={item.url}
                      imageClassName=""
                      className="size-9 min-w-9"
                    />
                    <p className="subtitle-2 line-clamp-1 text-light-100">
                      {item.name}
                    </p>
                    {/* </Link> */}
                  </div>
                  <FormattedDateTime
                    date={item.$createdAt}
                    className="caption line-clamp-1 text-light-200"
                  />
                </li>
              ))
            ) : (
              <p className="empty-result">No files found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
