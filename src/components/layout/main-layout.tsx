
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
      <main className="flex-1 w-full max-w-screen-xl mx-auto py-8 px-6 sm:px-10 lg:px-16">
        {children}
      </main>
      <footer className="py-6 md:py-0 border-t border-border/40">
        <div className="w-full max-w-screen-xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Creato per i Fan dell'Eurovision. TreppoVision &copy; {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
