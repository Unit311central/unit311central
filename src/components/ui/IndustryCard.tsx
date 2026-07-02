type IndustryCardProps = {
  title: string;
  description: string;
};

export default function IndustryCard({ title, description }: IndustryCardProps) {
  return (
    <div className="gradient-border rounded-xl bg-surface p-6 transition-colors hover:bg-surface-elevated">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
