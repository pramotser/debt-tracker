"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

import { CategoryBadge } from "./category-badge";
import type { Category, Template } from "./types";

export function TemplateView({
  templates,
  categories,
  onAdd,
  onDelete,
}: {
  templates: Template[];
  categories: Category[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus />
          เพิ่ม template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มี template กด &quot;เพิ่ม template&quot;
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((t) => (
            <Card
              key={t.id}
              className="flex flex-row items-center gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div>
                  <CategoryBadge category={categoryById.get(t.categoryId)} />
                </div>
              </div>
              <div className="min-w-[7rem] text-right text-base font-semibold tabular-nums text-muted-foreground">
                {t.amount === undefined ? "กรอกเอง" : formatMoney(t.amount)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(t.id)}
                aria-label="ลบ template"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
