import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IMAGES, project, SITE_MARKERS } from "@/lib/mock-data";
import { CircleDot, Clock, Layers, Map } from "lucide-react";
import Image from "next/image";

export default function SiteIntelligence() {
  return (
    <Card className="overflow-hidden border-white/[0.07] shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
      <CardHeader className="flex-col gap-3 border-b border-white/[0.06] bg-[#0D1B2A]/50 p-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:p-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/80">
            Primary Intelligence Layer
          </p>
          <CardTitle className="mt-1 text-lg sm:text-xl lg:text-2xl">
            Site Intelligence
          </CardTitle>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Badge variant="outline" className="w-fit gap-1.5 rounded-xl px-3 py-1">
            <Clock className="h-3 w-3" />
            Captured {project.captured}
          </Badge>
          <Badge variant="info" className="w-fit rounded-xl">
            <CircleDot className="mr-1 h-3 w-3" />
            RTK Active
          </Badge>
          <Button variant="secondary" size="sm" className="w-full rounded-xl sm:w-auto">
            <Map className="h-4 w-4" />
            Open Interactive Map
          </Button>
          <Button variant="outline" size="sm" className="w-full rounded-xl sm:w-auto">
            <Layers className="h-4 w-4" />
            View Orthomosaic
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative min-h-[260px] overflow-hidden bg-[#07111F] sm:min-h-[380px] md:min-h-[480px] lg:min-h-[640px] xl:min-h-[720px]">
          <Image
            src={IMAGES.siteIntelligence}
            alt={`Aerial intelligence view of ${project.name}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/95 via-[#07111F]/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,17,31,0.4)_100%)]" />

          {SITE_MARKERS.map((marker) => (
            <div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: marker.x, top: marker.y }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-[#0D1B2A]/95 font-mono text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/50 backdrop-blur-sm sm:h-9 sm:w-9 sm:text-sm">
                  {marker.id}
                </div>
                <div className="hidden rounded-xl border border-white/[0.08] bg-[#0D1B2A]/95 px-2.5 py-1 shadow-xl backdrop-blur-md sm:block sm:px-3 sm:py-1.5">
                  <p className="whitespace-nowrap text-[10px] font-medium text-white/90 sm:text-xs">
                    {marker.label}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-white/[0.08] bg-[#0D1B2A]/90 px-3 py-1.5 font-mono text-[10px] text-white/55 backdrop-blur-md sm:bottom-5 sm:left-5 sm:px-4 sm:py-2 sm:text-[11px]">
            {project.coordinates}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
