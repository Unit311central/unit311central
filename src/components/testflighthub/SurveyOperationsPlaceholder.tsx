type SurveyOperationsPlaceholderProps = {
  title: string;
  description: string;
};

export default function SurveyOperationsPlaceholder({
  title,
  description,
}: SurveyOperationsPlaceholderProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
        Phase 1 Preview
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-md text-sm text-white/55">{description}</p>
    </div>
  );
}
