import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ZONE_PROGRESS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Table2 } from "lucide-react";

export default function ZoneTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-white/50" />
          Progress by Zone
        </CardTitle>
        <CardDescription>
          Completion percentage and variance vs planned progress
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-medium uppercase tracking-wider text-white/35">
                <th className="pb-4 pr-6 font-medium">Zone</th>
                <th className="pb-4 pr-6 font-medium">Progress</th>
                <th className="pb-4 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody>
              {ZONE_PROGRESS.map((row) => (
                <tr
                  key={row.zone}
                  className="border-b border-white/[0.06] last:border-0"
                >
                  <td className="py-5 pr-6 text-sm font-medium text-white/80">
                    {row.zone}
                  </td>
                  <td className="py-5 pr-6">
                    <div className="flex items-center gap-4">
                      <Progress value={row.progress} className="w-32 sm:w-48" />
                      <span className="font-mono text-sm text-white/75">
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-5">
                    <Badge
                      variant={row.variance >= 0 ? "success" : "warning"}
                      className={cn(
                        "font-mono",
                        row.variance < 0 && "text-amber-400"
                      )}
                    >
                      {row.variance >= 0 ? "+" : ""}
                      {row.variance}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
