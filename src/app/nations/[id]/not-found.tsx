
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold text-destructive mb-3">Nazione Non Trovata</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! Non siamo riusciti a trovare la nazione che stavi cercando.
      </p>
      <Link href="/nations">
        <Button variant="outline">Torna all'Elenco Nazioni</Button>
      </Link>
    </div>
  );
}
