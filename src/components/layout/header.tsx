
import Link from "next/link";
import { Navigation } from "./navigation";
import { AuthButton } from "@/components/auth/auth-button";
import { Music } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-screen-xl mx-auto px-[30px] flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            TreppoVision
          </span>
        </Link>
        <Navigation />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

