import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UPCOMING_ACTIVITIES } from "@/lib/mock-data";
import { CalendarDays } from "lucide-react";

export default function ActivitiesList() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-white/50" />
          Upcoming Activities
        </CardTitle>
        <CardDescription>Scheduled project events and deliverables</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {UPCOMING_ACTIVITIES.map((item, i) => (
            <div key={item.title}>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-white/85">{item.title}</p>
                  <p className="mt-1 text-xs text-white/40">{item.date}</p>
                </div>
                <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                  {item.time}
                </Badge>
              </div>
              {i < UPCOMING_ACTIVITIES.length - 1 && (
                <Separator className="bg-white/[0.06]" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
