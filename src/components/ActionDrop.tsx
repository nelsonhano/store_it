"use client";

import { Models } from "node-appwrite";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { actionsDropdownItems } from "@/constants";
import { ActionType } from "@/types";
import { constructDownloadUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { renameFile } from "@/lib/actions/file.action";
import { usePathname } from "next/navigation";
import { FileDetails } from "@/components/ActionModalContent";

export default function ActionDrop({ file }: { file: Models.Document }) {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const path = usePathname();

  const closeAllModal = () => {
    setIsModalOpen(false);
    setName(file.name);
    setIsModalOpen(false);
    setIsDropDownOpen(false);
    // setEmail([]);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    let success = false;

    const actions = {
      rename: () =>
        renameFile({ fileId: file.$id, name, extension: file.extension, path }),
      share: () => console.log("share"),
      delete: () => console.log("delete"),
    };
    success = await actions[action.value as keyof typeof actions]();

    if (success) closeAllModal();

    setIsLoading(false);
  };

  const renderDialog = () => {
    if (!action) return null;

    const { label, value } = action;
    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {value}
          </DialogTitle>
          {value === "rename" && (
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          )}

          {value === "details" && <FileDetails file={file} />}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModal} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropDownOpen} onOpenChange={setIsDropDownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((item) => (
            <DropdownMenuItem
              key={item.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(item);

                if (
                  ["rename", "share", "delete", "details"].includes(item.value)
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {item.value === "download" ? (
                <Link
                  download={file.name}
                  className="flex items-center gap-2"
                  href={constructDownloadUrl(file.bucketFileId)}
                >
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={20}
                    height={20}
                  />
                  {item.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={20}
                    height={20}
                  />
                  {item.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
        {renderDialog()}
      </DropdownMenu>
    </Dialog>
  );
}
