"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// มือถือ = bottom sheet · จอใหญ่ = dialog
export function FormShell({
  open,
  onOpenChange,
  title,
  description,
  error,
  pending,
  canSubmit,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  error?: string | null;
  pending: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  const body = (
    <div className="flex flex-col gap-4">
      {children}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );

  const actions = (
    <>
      <Button
        onClick={onSubmit}
        disabled={!canSubmit || pending}
        className="h-11 w-full sm:h-9 sm:w-auto"
      >
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
      <Button
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="h-11 w-full sm:h-9 sm:w-auto"
      >
        ยกเลิก
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] rounded-t-2xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-0 pt-0">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="-mx-3 flex-1 overflow-y-auto px-3 pb-2">{body}</div>
          <SheetFooter className="flex-col gap-2 px-0 pb-0">{actions}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {body}
        <DialogFooter className="flex-row-reverse justify-start gap-2 sm:justify-start">
          {actions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
