import { redirect } from "next/navigation";

export default function InfoEmailPage() {
  redirect("/internaldashboard?view=info-email");
}
