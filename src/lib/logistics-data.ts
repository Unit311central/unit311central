export type LogisticsDirection = "inbound" | "outbound";

export type LogisticsStatus =
  | "In transit"
  | "Out for delivery"
  | "Delivered"
  | "Awaiting pickup"
  | "Customs hold"
  | "Scheduled";

export type LogisticsCarrier =
  | "FedEx"
  | "DHL"
  | "UPS"
  | "Unit311 Courier"
  | "Meridian Courier"
  | "Royal Mail";

export type LogisticsShipment = {
  id: string;
  trackingNumber: string;
  direction: LogisticsDirection;
  status: LogisticsStatus;
  carrier: LogisticsCarrier;
  carrierTrackingUrl: string;
  sentAt: string;
  eta: string;
  origin: string;
  destination: string;
  recipient: string;
  sender: string;
  sentBy: string;
  contents: string;
  weightKg: number;
  notes?: string;
  featured?: boolean;
};

export type LogisticsRouteLeg = "air" | "ground";

export type FeaturedRouteSnapshot = {
  shipmentId: string;
  label: string;
  currentLeg: LogisticsRouteLeg;
  progressPct: number;
  currentLocationLabel: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  route: Array<{ lat: number; lng: number }>;
  currentPosition: { lat: number; lng: number };
};

export const LOGISTICS_MOCK_SHIPMENTS: LogisticsShipment[] = [
  {
    id: "shp-bcn-lon-001",
    trackingNumber: "794612345678",
    direction: "outbound",
    status: "In transit",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/?trknbr=794612345678",
    sentAt: "2026-06-16T08:30:00.000Z",
    eta: "2026-06-17T14:00:00.000Z",
    origin: "Barcelona HQ, Spain",
    destination: "Oxford Heritage Survey Ltd, London, UK",
    recipient: "James Whitfield",
    sender: "Unit311 — Logistics",
    sentBy: "Elena Morales",
    contents: "Matrice 4T gimbal calibration kit + spare propellers",
    weightKg: 8.4,
    notes: "Priority client mobilisation — signature required.",
    featured: true,
  },
  {
    id: "shp-in-002",
    trackingNumber: "JD0146000123456789",
    direction: "inbound",
    status: "Awaiting pickup",
    carrier: "DHL",
    carrierTrackingUrl: "https://www.dhl.com/global-en/home/tracking.html?tracking-id=JD0146000123456789",
    sentAt: "2026-06-17T06:15:00.000Z",
    eta: "2026-06-18T11:30:00.000Z",
    origin: "DJI Enterprise — Rotterdam, NL",
    destination: "Barcelona HQ, Spain",
    recipient: "Unit311 — Receiving",
    sender: "DJI Enterprise EU",
    sentBy: "Warehouse dispatch",
    contents: "TB65 intelligent flight battery × 4",
    weightKg: 12.1,
  },
  {
    id: "shp-out-003",
    trackingNumber: "1Z999AA10123456784",
    direction: "outbound",
    status: "Delivered",
    carrier: "UPS",
    carrierTrackingUrl: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    sentAt: "2026-06-14T09:00:00.000Z",
    eta: "2026-06-15T16:45:00.000Z",
    origin: "Porto Operations, Portugal",
    destination: "Douro Maritime Logistics, Matosinhos",
    recipient: "Rui Ferreira",
    sender: "Unit311 — Porto",
    sentBy: "Ana Ribeiro",
    contents: "Processed orthomosaic USB drive + survey report",
    weightKg: 0.6,
  },
  {
    id: "shp-in-004",
    trackingNumber: "BCN-CR-88421",
    direction: "inbound",
    status: "In transit",
    carrier: "Unit311 Courier",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/",
    sentAt: "2026-06-17T11:20:00.000Z",
    eta: "2026-06-17T17:00:00.000Z",
    origin: "Oxford Studio, UK",
    destination: "Barcelona HQ, Spain",
    recipient: "Unit311 — R&D",
    sender: "Oxford Heritage Survey Ltd",
    sentBy: "James Whitfield",
    contents: "Returned RTK base antenna for bench test",
    weightKg: 2.3,
  },
  {
    id: "shp-out-005",
    trackingNumber: "RM123456789GB",
    direction: "outbound",
    status: "Scheduled",
    carrier: "Royal Mail",
    carrierTrackingUrl: "https://www.royalmail.com/track-your-item",
    sentAt: "2026-06-18T07:00:00.000Z",
    eta: "2026-06-19T12:00:00.000Z",
    origin: "Barcelona HQ, Spain",
    destination: "Venturi Aeronautical, Barcelona",
    recipient: "Eduard Gómez",
    sender: "Unit311 — Logistics",
    sentBy: "Paul Fotheringham",
    contents: "Signed NDA originals + compliance binder",
    weightKg: 1.1,
  },
  {
    id: "shp-in-006",
    trackingNumber: "794698765432",
    direction: "inbound",
    status: "Customs hold",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/?trknbr=794698765432",
    sentAt: "2026-06-15T14:45:00.000Z",
    eta: "2026-06-18T09:00:00.000Z",
    origin: "Perth WA, Australia",
    destination: "Barcelona HQ, Spain",
    recipient: "Unit311 — Import desk",
    sender: "Westport Logistics Hub",
    sentBy: "Marcus Chen",
    contents: "Thermal camera module — RMA return",
    weightKg: 3.8,
    notes: "Awaiting EU import documentation review.",
  },
];

export const FEATURED_BARCELONA_LONDON_ROUTE: FeaturedRouteSnapshot = {
  shipmentId: "shp-bcn-lon-001",
  label: "Barcelona → London",
  currentLeg: "air",
  progressPct: 68,
  currentLocationLabel: "Over Bordeaux, France — airborne",
  origin: { name: "Barcelona HQ", lat: 41.3874, lng: 2.1686 },
  destination: { name: "London", lat: 51.5074, lng: -0.1278 },
  route: [
    { lat: 41.3874, lng: 2.1686 },
    { lat: 41.9, lng: 1.2 },
    { lat: 43.2, lng: -0.5 },
    { lat: 44.8378, lng: -0.5792 },
    { lat: 46.2, lng: -0.8 },
    { lat: 48.5, lng: -1.2 },
    { lat: 49.5, lng: -1.0 },
    { lat: 50.2, lng: -0.5 },
    { lat: 51.5074, lng: -0.1278 },
  ],
  currentPosition: { lat: 44.8378, lng: -0.5792 },
};

const DEMO_LOGISTICS_SHIPMENTS: LogisticsShipment[] = [
  {
    id: "shp-mag-lon-nyc-001",
    trackingNumber: "7946MAG001234",
    direction: "outbound",
    status: "In transit",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/?trknbr=7946MAG001234",
    sentAt: "2026-07-20T08:30:00.000Z",
    eta: "2026-07-21T16:00:00.000Z",
    origin: "London HQ, United Kingdom",
    destination: "New York Office, United States",
    recipient: "Riley Jenkins",
    sender: "Meridian Atlas — Logistics",
    sentBy: "Reese Sullivan",
    contents: "Executive briefing packs + signed SOW originals",
    weightKg: 4.2,
    notes: "Priority client kickoff materials — signature required.",
    featured: true,
  },
  {
    id: "shp-mag-in-002",
    trackingNumber: "JD0MAG987654321",
    direction: "inbound",
    status: "Awaiting pickup",
    carrier: "DHL",
    carrierTrackingUrl: "https://www.dhl.com/global-en/home/tracking.html?tracking-id=JD0MAG987654321",
    sentAt: "2026-07-21T06:15:00.000Z",
    eta: "2026-07-22T11:30:00.000Z",
    origin: "Harbor Energy — Houston, US",
    destination: "London HQ, United Kingdom",
    recipient: "Meridian Atlas — Receiving",
    sender: "Harbor Energy Procurement",
    sentBy: "Warehouse dispatch",
    contents: "Client reference architecture USB + hard-copy NDA set",
    weightKg: 1.8,
  },
  {
    id: "shp-mag-out-003",
    trackingNumber: "1ZMAGAA10123456784",
    direction: "outbound",
    status: "Delivered",
    carrier: "UPS",
    carrierTrackingUrl: "https://www.ups.com/track?tracknum=1ZMAGAA10123456784",
    sentAt: "2026-07-18T09:00:00.000Z",
    eta: "2026-07-19T16:45:00.000Z",
    origin: "Berlin Office, Germany",
    destination: "Cascade Health Systems, Frankfurt",
    recipient: "Delivery PMO",
    sender: "Meridian Atlas — Berlin",
    sentBy: "Oliver Hayes",
    contents: "Cutover runbook binder + access tokens",
    weightKg: 2.1,
  },
  {
    id: "shp-mag-in-004",
    trackingNumber: "MAG-CR-88421",
    direction: "inbound",
    status: "In transit",
    carrier: "Meridian Courier",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/",
    sentAt: "2026-07-21T11:20:00.000Z",
    eta: "2026-07-21T17:00:00.000Z",
    origin: "Singapore Office",
    destination: "London HQ, United Kingdom",
    recipient: "Meridian Atlas — Practice Ops",
    sender: "APAC Delivery",
    sentBy: "Benjamin Bailey",
    contents: "Returned laptop kit from Singapore workshop",
    weightKg: 6.4,
  },
  {
    id: "shp-mag-out-005",
    trackingNumber: "RM9MAG56789GB",
    direction: "outbound",
    status: "Scheduled",
    carrier: "Royal Mail",
    carrierTrackingUrl: "https://www.royalmail.com/track-your-item",
    sentAt: "2026-07-22T07:00:00.000Z",
    eta: "2026-07-23T12:00:00.000Z",
    origin: "London HQ, United Kingdom",
    destination: "Ashford Lane LLP, London",
    recipient: "Priya Shah",
    sender: "Meridian Atlas — Legal Ops",
    sentBy: "Finance Desk",
    contents: "Executed board resolutions + share certificates",
    weightKg: 0.9,
  },
  {
    id: "shp-mag-in-006",
    trackingNumber: "7946MAG765432",
    direction: "inbound",
    status: "Customs hold",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/?trknbr=7946MAG765432",
    sentAt: "2026-07-19T14:45:00.000Z",
    eta: "2026-07-22T09:00:00.000Z",
    origin: "Sydney Office, Australia",
    destination: "London HQ, United Kingdom",
    recipient: "Meridian Atlas — Import desk",
    sender: "APAC Facilities",
    sentBy: "Leo Fisher",
    contents: "Conference AV kit — RMA return",
    weightKg: 11.2,
    notes: "Awaiting UK import documentation review.",
  },
];

export const FEATURED_LONDON_NEW_YORK_ROUTE: FeaturedRouteSnapshot = {
  shipmentId: "shp-mag-lon-nyc-001",
  label: "London → New York",
  currentLeg: "air",
  progressPct: 62,
  currentLocationLabel: "Over the North Atlantic — airborne",
  origin: { name: "London HQ", lat: 51.5074, lng: -0.1278 },
  destination: { name: "New York", lat: 40.7128, lng: -74.006 },
  route: [
    { lat: 51.5074, lng: -0.1278 },
    { lat: 52.0, lng: -5.0 },
    { lat: 51.5, lng: -15.0 },
    { lat: 50.0, lng: -30.0 },
    { lat: 47.0, lng: -45.0 },
    { lat: 44.0, lng: -55.0 },
    { lat: 42.0, lng: -65.0 },
    { lat: 40.7128, lng: -74.006 },
  ],
  currentPosition: { lat: 47.0, lng: -45.0 },
};

function isDemoLogisticsSurface() {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}

export function getLogisticsMockShipments(): LogisticsShipment[] {
  return isDemoLogisticsSurface() ? DEMO_LOGISTICS_SHIPMENTS : LOGISTICS_MOCK_SHIPMENTS;
}

export function getFeaturedLogisticsRoute(): FeaturedRouteSnapshot {
  return isDemoLogisticsSurface() ? FEATURED_LONDON_NEW_YORK_ROUTE : FEATURED_BARCELONA_LONDON_ROUTE;
}

export function getLogisticsBrandName() {
  if (isDemoLogisticsSurface()) {
    try {
      const { getDemoEnterpriseFixtures } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      return `${getDemoEnterpriseFixtures().company.tradingName} Logistics`;
    } catch {
      return "Meridian Atlas Logistics";
    }
  }
  return "Unit311 Logistics";
}

export function logisticsStatusClass(status: LogisticsStatus) {
  switch (status) {
    case "In transit":
      return "border-sky-400/40 bg-sky-500/15 text-sky-200";
    case "Out for delivery":
      return "border-violet-400/40 bg-violet-500/15 text-violet-200";
    case "Delivered":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "Awaiting pickup":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "Customs hold":
      return "border-rose-400/40 bg-rose-500/15 text-rose-200";
    case "Scheduled":
      return "border-white/20 bg-white/10 text-white/60";
  }
}

export function formatLogisticsDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function getInboundShipments(shipments = getLogisticsMockShipments()) {
  return shipments.filter((row) => row.direction === "inbound");
}

export function getOutboundShipments(shipments = getLogisticsMockShipments()) {
  return shipments.filter((row) => row.direction === "outbound");
}

export function getFeaturedShipment(shipments = getLogisticsMockShipments()) {
  return shipments.find((row) => row.featured) ?? shipments[0] ?? null;
}
