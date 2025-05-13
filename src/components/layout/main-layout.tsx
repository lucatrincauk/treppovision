
import type { ReactNode } from 'react';
import { Header } from './header';
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-screen-2xl py-8">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for Eurovision Fans. TreppoVision &copy; {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
