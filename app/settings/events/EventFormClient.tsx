"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions";
import type { Event } from "@/lib/supabase/types";

const MAX_CHAPTER = 9;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  border: "1px solid var(--hairline)",
  borderRadius: 8,
  background: "var(--bg-deep)",
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

interface EventFormProps {
  event?: Event;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export function EventFormClient({ event }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!event;

  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [endChapter, setEndChapter] = useState(event?.end_chapter ?? MAX_CHAPTER);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && date.length > 0 && endChapter >= 1 && endChapter <= MAX_CHAPTER;

  let saveButtonLabel = "Create Event";
  if (saving) saveButtonLabel = "Saving…";
  else if (isEditing) saveButtonLabel = "Save Changes";

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateEvent({ id: event.id, name: name.trim(), date, endChapter });
      } else {
        await createEvent({ name: name.trim(), date, endChapter });
      }
      router.push("/settings/events");
      router.refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to save event");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent({ id: event.id });
      router.push("/settings/events");
      router.refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to delete event");
      setDeleting(false);
    }
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />

      <div style={{ padding: "14px 22px 10px", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => router.push("/settings/events")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}
        >
          <Icon name="chevron-left" size={16} color="var(--ink-muted)" />
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Events</span>
        </button>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1 }}>
          {isEditing ? "Edit Event" : "New Event"}
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
        <div className="card" style={{ padding: 18 }}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span className="eyebrow" style={{ marginBottom: 6, display: "block" }}>Event name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. League Meet"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span className="eyebrow" style={{ marginBottom: 6, display: "block" }}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 0 }}>
            <span className="eyebrow" style={{ marginBottom: 6, display: "block" }}>Scope (chapters 1–N)</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: MAX_CHAPTER }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setEndChapter(ch)}
                  className={endChapter === ch ? "chip chip-mono" : "chip"}
                  style={{
                    background: endChapter === ch ? "var(--saffron-500)" : "var(--bg-deep)",
                    color: endChapter === ch ? "#fff" : "var(--ink-muted)",
                    border: "none",
                    cursor: "pointer",
                    minWidth: 40,
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </label>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "var(--rust-100, #f8e8e4)", color: "var(--rust-500)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: canSave && !saving ? "var(--saffron-500)" : "var(--bg-deep)",
            color: canSave && !saving ? "#fff" : "var(--ink-muted)",
            border: "none",
            borderRadius: 12,
            cursor: canSave && !saving ? "pointer" : "default",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {saveButtonLabel}
        </button>

        {isEditing && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "none",
              color: "var(--rust-500)",
              border: "1px solid var(--rust-500)",
              borderRadius: 12,
              cursor: deleting ? "default" : "pointer",
              fontSize: 15,
              fontWeight: 500,
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Icon name="trash" size={16} color="var(--rust-500)" />
            {deleting ? "Deleting…" : "Delete Event"}
          </button>
        )}
      </div>
    </div>
  );
}
