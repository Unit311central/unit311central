import type { ReactNode } from "react";

type HomeSectionTitleProps = {
  children: ReactNode;
  centered?: boolean;
  singleLine?: boolean;
};

const titleBase =
  "relative inline-block max-w-full px-5 text-center font-semibold uppercase leading-snug text-[#3b82f6] sm:px-9 lg:px-12";

export default function HomeSectionTitle({
  children,
  centered = true,
  singleLine = false,
}: HomeSectionTitleProps) {
  return (
    <div className={centered ? "text-center" : undefined}>
      <p
        className={
          singleLine
            ? `${titleBase} text-sm tracking-[0.1em] sm:whitespace-nowrap sm:text-base sm:tracking-[0.12em] md:text-lg lg:text-[22px] lg:tracking-[0.18em]`
            : `${titleBase} text-sm tracking-[0.1em] sm:text-lg sm:tracking-[0.16em] lg:text-[22px] lg:tracking-[0.18em]`
        }
      >
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-px w-5 -translate-y-1/2 bg-[#3b82f6] sm:w-8 lg:w-12"
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 h-px w-5 -translate-y-1/2 bg-[#3b82f6] sm:w-8 lg:w-12"
        />
        {children}
      </p>
    </div>
  );
}
