"use client";

import { format, parse } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
};

function fromIsoDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(d: Date | undefined): string | null {
  return d ? format(d, "yyyy-MM-dd") : null;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "เลือกวันที่",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = fromIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal tabular-nums",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />
            {selected ? format(selected, "d MMM yyyy", { locale: th }) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={th}
          selected={selected}
          onSelect={(d) => {
            onChange(toIsoDate(d));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
