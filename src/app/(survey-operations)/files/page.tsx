import { redirect } from "next/navigation";

export default function FilesPage() {
  redirect("/internaldashboard?view=files");
}
