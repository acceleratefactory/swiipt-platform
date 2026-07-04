"use client";
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface AchievementCard {
  id: string;
  card_type: string;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
  is_shared_whatsapp: boolean;
  is_shared_instagram: boolean;
  created_at: string;
}

interface AchievementCardSectionProps {
  userId: string;
}

const emojiMap: Record<string, string> = {
  goal_created: "🎯",
  milestone_25: "💪",
  milestone_50: "🔥",
  milestone_75: "🚀",
  goal_funded: "🎉",
  service_ordered: "📋",
  service_completed: "✅",
  visa_approved: "🛂",
  certificate_issued: "📜",
  joined_swiipt: "👋",
  readiness_score: "📊",
};

export default function AchievementCardSection({ userId }: AchievementCardSectionProps) {
  const [cards, setCards] = useState<AchievementCard[]>([]);
  const [profile, setProfile] = useState<{ referral_code: string } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const promises = [
        fetch(`/api/achievements/list?userId=${userId}`).then((r) => r.ok ? r.json() : { cards: [] }),
        (supabase as any).from("users").select("referral_code").eq("id", userId).single().then((r: any) => r.data),
      ] as const;
      const [cardsJson, profileRes] = await Promise.all(promises);
      setCards(cardsJson.cards || []);
      setProfile(profileRes);
    })();
  }, [userId]);

  const handleShareWhatsApp = useCallback(async (card: AchievementCard) => {
    const refCode = profile?.referral_code || "";
    const text = `${card.title}\n\nI'm using @Swiipt to plan my move abroad. Planning your move too?\nSign up with my link and get a free Qatar visa credit:\nswiipt.com/signup?ref=${refCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    fetch("/api/achievements/mark-shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, platform: "whatsapp" }),
    }).catch(() => {});
  }, [profile]);

  const handleShareInstagram = useCallback(async (card: AchievementCard) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, "#06112B");
    gradient.addColorStop(1, "#0A1E4A");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#00C896";
    ctx.beginPath();
    ctx.arc(540, 200, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px 'Cabinet Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Swiipt", 540, 330);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "36px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(card.title, 540, 420);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "28px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(card.subtitle, 540, 480);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "22px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("swiipt.com", 540, 980);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "swiipt-achievement.png";
    a.click();
    URL.revokeObjectURL(url);
    fetch("/api/achievements/mark-shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, platform: "instagram" }),
    }).catch(() => {});
  }, []);

  const handleDismiss = useCallback(async (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    await fetch("/api/achievements/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
  }, []);

  if (cards.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Your achievements</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {cards.slice(0, 3).map((card) => {
          const emoji = emojiMap[card.card_type] || "🏆";
          return (
            <div
              key={card.id}
              style={{
                background: "linear-gradient(135deg, var(--midnight-light), var(--midnight))",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                border: "1px solid rgba(0,200,150,0.2)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                position: "relative",
              }}
            >
              <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", marginBottom: "0.125rem" }}>{card.title}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>{card.subtitle}</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleShareWhatsApp(card)}
                    style={{ fontSize: "0.7rem", padding: "0.375rem 0.75rem", background: "#25D366", color: "white", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={() => handleShareInstagram(card)}
                    style={{ fontSize: "0.7rem", padding: "0.375rem 0.75rem", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Share on Instagram
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(card.id)}
                style={{ position: "absolute", top: "0.625rem", right: "0.625rem", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "0.25rem" }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
