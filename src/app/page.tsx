import { redirect } from "next/navigation";

// The journey always starts at sign-in — nothing else lives at "/".
export default function RootPage() {
  redirect("/login");
}
