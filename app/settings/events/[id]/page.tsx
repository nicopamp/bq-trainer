import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/events";
import { EventFormClient } from "../EventFormClient";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const event = await getEventById(supabase, Number(id));
  if (!event) notFound();

  return <EventFormClient event={event} />;
}
