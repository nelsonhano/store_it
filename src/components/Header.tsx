import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";
import { className } from "postcss-selector-parser";

export default function Header({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) {
  return (
    <>
      <header className="header">
        <Search />
        <div className="header-wrapper">
          <FileUploader ownerId={userId} accountId={accountId} />
          <form
            action={async () => {
              "use server";

              await signOutUser();
            }}
          >
            <Button className="sign-out-button" type="submit">
              <Image
                src="/assets/icons/logout.svg"
                alt="logout"
                width={24}
                height={24}
                className="w-6"
              />
            </Button>
          </form>
        </div>
      </header>
    </>
  );
}
