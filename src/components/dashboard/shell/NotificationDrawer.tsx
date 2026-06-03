"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function NotificationDrawer({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setNotifications(data || []));

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, userId, supabase]);

  async function markAllRead() {
    await supabase
      .from("notifications")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_read: true } as any)
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          maxWidth: "100vw",
          background: "white",
          zIndex: 51,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>Notifications</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={markAllRead}
              style={{ fontSize: "0.8125rem", color: "var(--teal)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Mark all read
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <Bell size={32} style={{ color: "var(--gray-300)", marginBottom: "0.75rem" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--gray-100)",
                  background: n.is_read ? "white" : "var(--teal-pale)",
                  cursor: n.action_url ? "pointer" : "default",
                }}
                onClick={() => {
                  if (n.action_url) {
                    window.location.href = n.action_url;
                    onClose();
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", flexShrink: 0, marginTop: "0.375rem" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: n.is_read ? 400 : 600, color: "var(--midnight)", marginBottom: "0.25rem" }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{n.body}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                      {new Date(n.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
