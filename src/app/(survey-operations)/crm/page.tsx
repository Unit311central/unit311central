import { redirect } from "next/navigation";

export default function CrmPage() {
  redirect("/internaldashboard?view=crm");
}
