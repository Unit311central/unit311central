"use client";

import { use } from "react";

import SupportLoungeApp from "@/components/support-lounge/SupportLoungeApp";

export default function SupportLoungeTicketPage({
  params,
}: {
  params: Promise<{ token: string; ticketToken: string }>;
}) {
  const { token, ticketToken } = use(params);
  return <SupportLoungeApp loungeToken={token} activeTicketPublicToken={ticketToken} />;
}
