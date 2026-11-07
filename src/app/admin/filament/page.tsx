import { redirect } from "next/navigation";

// Fargene har flyttet til sin egen fane. Gamle lenker sendes dit.
export default function OldFilamentPage() {
  redirect("/admin/farger");
}
