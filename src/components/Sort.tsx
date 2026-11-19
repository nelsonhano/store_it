"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";

export default function Sort() {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValue = (value: string) => {
    // Keep other params (like ?query=) when changing the sort.
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleValue}
      defaultValue={searchParams.get("sort") || sortTypes[0].value}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={sortTypes[0].label} />
      </SelectTrigger>
      <SelectContent>
        {sortTypes.map((item) => (
          <SelectItem key={item.label} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
