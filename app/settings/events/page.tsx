import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserEvents } from "@/lib/events";
import { EventsListClient } from "./EventsListClient";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const events = await getUserEvents(supabase, user.id);

  return <EventsListClient events={events} />;
}
