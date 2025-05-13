
import type { Nation } from "@/types";
import { NationListItem } from "./nation-list-item";

interface NationListProps {
  nations: Nation[];
  title: string;
}

export function NationList({ nations, title }: NationListProps) {
  if (nations.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary">{title}</h2>
        <p className="text-muted-foreground">No nations in this category.</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {nations.map((nation) => (
          <NationListItem key={nation.id} nation={nation} />
        ))}
      </div>
    </div>
  );
}
