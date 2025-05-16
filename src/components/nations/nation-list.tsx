
import type { Nation } from "@/types";
import { NationListItem } from "./nation-list-item";

interface NationListProps {
  nations: Nation[];
  title?: string; // Title is now optional, as it's handled by parent
}

export function NationList({ nations, title }: NationListProps) {
  if (nations.length === 0) {
    return (
      <div>
        {/* Title and conditional paragraph are removed from here */}
        <p className="text-muted-foreground">Nessuna nazione in questa categoria.</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Title and conditional paragraph are removed from here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {nations.map((nation) => (
          <NationListItem key={nation.id} nation={nation} />
        ))}
      </div>
    </div>
  );
}
