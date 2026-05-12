"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { Event } from "@/lib/supabase/types";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function EventsListClient({ events }: { events: Event[] }) {
  const router = useRouter();

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />

      <div style={{ padding: "14px 22px 10px", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => router.push("/settings")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}
        >
          <Icon name="chevron-left" size={16} color="var(--ink-muted)" />
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Settings</span>
        </button>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1 }}>Competition Season</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
        {events.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <Icon name="calendar" size={32} color="var(--ink-muted)" />
            <p style={{ margin: "12px 0 4px", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
              No events yet
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>
              Add your competition dates, league meets, and practice milestones.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {events.map((event, i) => (
              <button
                key={event.id}
                onClick={() => router.push(`/settings/events/${event.id}`)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "none",
                  border: "none",
                  borderBottom: i < events.length - 1 ? "1px solid var(--hairline)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{event.name}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>
                    {formatDate(event.date)} · Ch. 1–{event.end_chapter}
                  </div>
                </div>
                <Icon name="chevron-right" size={16} color="var(--ink-muted)" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/settings/events/new")}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--saffron-500)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <Icon name="plus" size={16} color="#fff" />
          Add event
        </button>
      </div>
    </div>
  );
}
