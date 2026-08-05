"use client";

type Props = {
  children: React.ReactNode;
};

/** Minimal chrome for the private overview invite — no dashboard shell. */
export function OnwardAirOverviewShell({ children }: Props) {
  return <>{children}</>;
}
