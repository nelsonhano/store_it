import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import React from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/sign-in");
  return (
    <>
      <main className="flex h-screen">
        <Sidebar {...currentUser} />
        <section className="flex h-full flex-1 flex-col">
          <Header userId={currentUser.$id} accountId={currentUser.accountId} />
          <MobileNavigation {...currentUser} />
          <div className="main-content">{children}</div>
        </section>
      </main>
      <Toaster />
    </>
  );
}
