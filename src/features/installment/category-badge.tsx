import { Badge } from "@/components/ui/badge";

import type { Category } from "./types";

export function CategoryBadge({ category }: { category?: Category }) {
  if (!category) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        —
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {category.name}
    </Badge>
  );
}
