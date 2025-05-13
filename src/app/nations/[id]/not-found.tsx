
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold text-destructive mb-3">Nation Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! We couldn't find the nation you were looking for.
      </p>
      <Link href="/nations">
        <Button variant="outline">Back to Nations List</Button>
      </Link>
    </div>
  );
}
