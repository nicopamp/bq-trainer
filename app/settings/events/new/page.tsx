import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventFormClient } from "../EventFormClient";

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return <EventFormClient />;
}
