import type { LogisticsShipment } from "@/lib/logistics-data";

export const GREENDESERT_LOGISTICS_SHIPMENTS: LogisticsShipment[] = [
  {
    id: "gd-shp-jeddah-001",
    trackingNumber: "GD7829345612",
    direction: "outbound",
    status: "In transit",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/?trknbr=GD7829345612",
    sentAt: "2026-09-02T06:00:00.000Z",
    eta: "2026-09-04T18:00:00.000Z",
    origin: "Green Desert — Riyadh, Saudi Arabia",
    destination: "Jeddah Technologies — Jeddah, Saudi Arabia",
    recipient: "Jeddah Technologies Receiving",
    sender: "Green Desert Logistics",
    sentBy: "Operations Team",
    contents: "Reactor module components — pallet 1 of 1",
    weightKg: 420,
    notes: "Client delivery — signature required.",
    featured: true,
  },
];
