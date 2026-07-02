import { cn } from "@/lib/utils";

export default function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-white/35">{description}</p>
      )}
    </div>
  );
}
