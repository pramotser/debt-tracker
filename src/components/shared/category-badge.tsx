import { Badge } from "@/components/ui/badge";

export function CategoryBadge({ category }: { category?: { name: string } }) {
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
