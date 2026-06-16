export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="grid size-[30px] place-items-center rounded-[9px] bg-foreground">
        <div className="flex flex-col gap-[3px]">
          <span className="block h-[2.4px] w-[14px] rounded-sm bg-[#2E9E6B]" />
          <span className="block h-[2.4px] w-[14px] rounded-sm bg-white" />
          <span className="block h-[2.4px] w-[14px] rounded-sm bg-white" />
        </div>
      </div>
    </div>
  );
}
