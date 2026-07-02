import { redirect } from "next/navigation";

export default function CalendarPage() {
  redirect("/internaldashboard?view=calendar");
}
