import { redirect } from "next/navigation";

export default function TelemetryPage() {
  redirect("/internaldashboard?view=telemetry");
}
