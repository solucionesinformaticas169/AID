"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterPillGroupProps = {
  items: string[];
  activeItem: string;
  onChange: (value: string) => void;
};

export function FilterPillGroup({ items, activeItem, onChange }: FilterPillGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button
          key={item}
          variant="ghost"
          size="sm"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-full border border-transparent px-4",
            activeItem === item && "border-border bg-card shadow-sm",
          )}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}
