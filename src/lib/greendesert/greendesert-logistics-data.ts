import type { LogisticsShipment } from "@/lib/logistics-data";
import type { FeaturedRouteSnapshot } from "@/lib/logistics-data";

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

export const FEATURED_RIYADH_JEDDAH_ROUTE: FeaturedRouteSnapshot = {
  shipmentId: "gd-shp-jeddah-001",
  label: "Riyadh → Jeddah",
  currentLeg: "ground",
  progressPct: 62,
  currentLocationLabel: "En route — central corridor, Saudi Arabia",
  origin: { name: "Green Desert — Riyadh", lat: 24.7136, lng: 46.6753 },
  destination: { name: "Jeddah Technologies — Jeddah", lat: 21.4858, lng: 39.1925 },
  route: [
    { lat: 24.7136, lng: 46.6753 },
    { lat: 24.4, lng: 45.8 },
    { lat: 23.5, lng: 42.5 },
    { lat: 22.8, lng: 40.5 },
    { lat: 22.0, lng: 39.8 },
    { lat: 21.4858, lng: 39.1925 },
  ],
  currentPosition: { lat: 22.8, lng: 40.5 },
};
