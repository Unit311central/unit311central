"use client";

import { use } from "react";

import SupportLoungeApp from "@/components/support-lounge/SupportLoungeApp";

export default function SupportLoungePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <SupportLoungeApp loungeToken={token} />;
}
