type FeatureGridProps = {
  items: readonly { title: string; description: string }[];
  columns?: 2 | 3;
};

export default function FeatureGrid({ items, columns = 3 }: FeatureGridProps) {
  const gridClass =
    columns === 2
      ? "grid gap-6 sm:grid-cols-2"
      : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-border bg-surface/50 p-6 transition-colors hover:border-border-strong hover:bg-surface"
        >
          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
