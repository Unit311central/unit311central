export default function ModuleReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-module-review-shell
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {children}
    </div>
  );
}
