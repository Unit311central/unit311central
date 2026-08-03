"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MapPin, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import {
  AFRICA_INITIAL_VIEW,
  AFRICA_MAP_BOUNDS,
  buildPortfolioMapMarkers,
  type PortfolioMapMarker,
} from "@/lib/talanton/portfolio-map";
import { URBAN_MAP_ATTRIBUTION } from "@/lib/map-tiles";

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function markerIcon(active: boolean) {
  const size = active ? 16 : 12;
  const glow = active ? "0 0 16px rgba(52,211,153,0.95)" : "0 0 10px rgba(16,185,129,0.7)";
  const fill = active ? "#6ee7b7" : "#10b981";
  return L.divIcon({
    className: "talanton-portfolio-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2px solid rgba(255,255,255,0.92);box-shadow:${glow};"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MarkerCard({
  marker,
  onClose,
}: {
  marker: PortfolioMapMarker;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-[500] rounded-2xl border border-emerald-400/30 bg-[#07111f]/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:right-3 sm:w-[22rem]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
            Portfolio company
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{marker.company}</h3>
          <p className="text-sm text-white/55">
            {marker.city}, {marker.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close company details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-white/40">Sector</dt>
          <dd className="mt-0.5 text-white/85">{marker.sector}</dd>
        </div>
        <div>
          <dt className="text-white/40">Staff</dt>
          <dd className="mt-0.5 tabular-nums text-white/85">
            {marker.staff.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-white/40">Revenue</dt>
          <dd className="mt-0.5 tabular-nums text-white/85">{marker.revenueLabel}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-white/40">Company purpose</dt>
          <dd className="mt-0.5 leading-relaxed text-white/80">{marker.companyPurpose}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Lock the map to an Africa-first viewport (wide cards otherwise show the world). */
function AfricaViewport() {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map.invalidateSize({ animate: false });
      map.setMaxBounds(AFRICA_MAP_BOUNDS);
      map.setMinZoom(4);
      map.setView(AFRICA_INITIAL_VIEW.center, AFRICA_INITIAL_VIEW.zoom, { animate: false });
    };

    map.whenReady(() => {
      apply();
      // Layout can settle after first paint (flex/aspect ratio).
      window.setTimeout(apply, 80);
      window.setTimeout(apply, 250);
    });

    const onResize = () => {
      map.invalidateSize({ animate: false });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);

  return null;
}

function PortfolioMarkers({
  markers,
  activeId,
  onToggle,
  onHover,
}: {
  markers: PortfolioMapMarker[];
  activeId: string | null;
  onToggle: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    layerRef.current?.remove();
    markerRefs.current.clear();

    const group = L.layerGroup();
    markers.forEach((marker) => {
      const pin = L.marker([marker.lat, marker.lng], {
        icon: markerIcon(false),
        riseOnHover: true,
        title: `${marker.company} · ${marker.city}`,
      });
      pin.on("click", () => onToggle(marker.id));
      pin.on("mouseover", () => onHover(marker.id));
      pin.on("mouseout", () => onHover(null));
      group.addLayer(pin);
      markerRefs.current.set(marker.id, pin);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
      layerRef.current = null;
      markerRefs.current.clear();
    };
  }, [map, markers, onToggle, onHover]);

  useEffect(() => {
    markerRefs.current.forEach((pin, id) => {
      pin.setIcon(markerIcon(id === activeId));
      pin.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId, markers]);

  return null;
}

/** Africa-centred portfolio map for Talanton Executive Home. */
export default function PortfolioCompanyMap() {
  const markers = useMemo(() => buildPortfolioMapMarkers(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleMarker = useCallback((id: string) => {
    setActiveId((cur) => (cur === id ? null : id));
  }, []);

  const active =
    markers.find((m) => m.id === activeId) ??
    markers.find((m) => m.id === hoveredId) ??
    null;

  const countries = useMemo(
    () => [...new Set(markers.map((m) => m.country))].sort().length,
    [markers],
  );

  return (
    <section className="talanton-portfolio-map-shell overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/60">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Portfolio footprint
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-white">Portfolio Company Map</h2>
          <p className="mt-1 text-sm text-white/50">
            {markers.length} holdings across {countries} African countries — click a marker for
            company detail.
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-white/45">
          <MapPin className="h-3.5 w-3.5 text-emerald-300" />
          Africa focus
        </p>
      </header>

      <div className="relative aspect-[16/11] w-full sm:aspect-[2/1]">
        <MapContainer
          center={AFRICA_INITIAL_VIEW.center}
          zoom={AFRICA_INITIAL_VIEW.zoom}
          minZoom={4}
          maxZoom={12}
          maxBounds={AFRICA_MAP_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          worldCopyJump={false}
          attributionControl
          className="absolute inset-0 h-full w-full"
          style={{ background: "#0a1220" }}
        >
          <TileLayer attribution={URBAN_MAP_ATTRIBUTION} url={CARTO_DARK_URL} maxZoom={19} />
          <AfricaViewport />
          <PortfolioMarkers
            markers={markers}
            activeId={activeId}
            onToggle={toggleMarker}
            onHover={setHoveredId}
          />
        </MapContainer>

        {active ? (
          <MarkerCard
            marker={active}
            onClose={() => {
              setActiveId(null);
              setHoveredId(null);
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
