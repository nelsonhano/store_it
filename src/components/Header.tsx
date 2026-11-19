import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";

export default function Header() {
  const handleSignOut = async () => {
    "use server"; // Indicates this is a server action
    await signOutUser();
  };
  return (
    <>
      <header className="header">
        <Search />
        <div className="header-wrapper">
          <FileUploader className="" />
          <form action={handleSignOut}>
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
