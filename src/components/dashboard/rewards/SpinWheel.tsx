"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface WheelSlot {
  label: string;
  value_ngn: number;
  probability: number;
  color?: string;
}

interface SpinWheelProps {
  promotion: {
    id: string;
    title: string;
    spin_config: { slots: WheelSlot[] };
  };
  userId: string;
  onSpinComplete: (prize: WheelSlot) => void;
}

const DEFAULT_COLORS = [
  "#06112B", "#00C896", "#1A3560", "#00A67E",
  "#0D2444", "#00DBA8", "#0A1E38", "#33D9B2",
];

export default function SpinWheel({ promotion, userId, onSpinComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [winner, setWinner] = useState<WheelSlot | null>(null);
  const animationRef = useRef<number>();

  const slots = promotion.spin_config.slots;
  const numSlots = slots.length;
  const sliceAngle = (2 * Math.PI) / numSlots;

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    slots.forEach((slot, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slot.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "bold 13px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      const maxLen = 14;
      const label = slot.label.length > maxLen ? slot.label.slice(0, maxLen) + "…" : slot.label;
      ctx.fillText(label, radius - 16, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#06112B";
    ctx.fill();
    ctx.strokeStyle = "var(--teal)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 11px 'Plus Jakarta Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", cx, cy);
  }, [slots]);

  useEffect(() => {
    drawWheel(currentAngle);
  }, [currentAngle, drawWheel]);

  function selectWinner(): number {
    const total = slots.reduce((sum, s) => sum + s.probability, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < slots.length; i++) {
      rand -= slots[i].probability;
      if (rand <= 0) return i;
    }
    return slots.length - 1;
  }

  function spin() {
    if (spinning || hasSpun) return;
    const winnerIndex = selectWinner();
    const targetSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const pointerAngle = -Math.PI / 2;
    const finalAngle = pointerAngle - targetSliceCenter + (10 * 2 * Math.PI);
    const totalRotation = finalAngle - currentAngle;

    setSpinning(true);
    const duration = 4500;
    const startTime = performance.now();
    const startAngle = currentAngle;

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const angle = startAngle + totalRotation * eased;
      setCurrentAngle(angle);
      drawWheel(angle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setHasSpun(true);
        const wonSlot = slots[winnerIndex];
        setWinner(wonSlot);
        onSpinComplete(wonSlot);
        saveSpinResult(wonSlot);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }

  async function saveSpinResult(won: WheelSlot) {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("milestone_rewards").insert({
      goal_id: null,
      user_id: userId,
      milestone_type: "spin_win",
      reward_type: "free_service",
      reward_label: `Spin & Win: ${won.label}`,
      reward_value_description: `You won ${won.label} from the ${promotion.title} spin. Convert to locked travel credit.`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("promotion_awards").insert({
      promotion_id: promotion.id,
      user_id: userId,
      award_type: "spin_win",
      award_value_ngn: won.value_ngn,
      award_description: won.label,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("notifications").insert({
      user_id: userId,
      type: "spin_win",
      title: `You won: ${won.label}!`,
      body: `Your spin prize has been added to your rewards. Redeem or convert to credit.`,
      action_url: "/dashboard/rewards",
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      <div style={{ position: "relative", width: 300, height: 300 }}>
        <div style={{
          position: "absolute", top: -12, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "20px solid var(--teal)",
          zIndex: 10,
          filter: "drop-shadow(0 2px 4px rgba(0,200,150,0.5))",
        }} />
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{
            borderRadius: "50%",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 4px rgba(0,200,150,0.3)",
            cursor: spinning || hasSpun ? "not-allowed" : "pointer",
          }}
          onClick={spin}
        />
      </div>

      {!hasSpun && (
        <button
          onClick={spin}
          disabled={spinning}
          style={{
            padding: "0.875rem 2.5rem",
            background: spinning ? "var(--gray-300)" : "var(--teal)",
            color: spinning ? "var(--text-muted)" : "var(--midnight)",
            fontWeight: 800,
            fontSize: "1rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: spinning ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transition: "all 0.15s",
          }}
        >
          {spinning ? "Spinning..." : "Spin to Win"}
        </button>
      )}

      {winner && (
        <div style={{
          background: "linear-gradient(135deg, #06112B, #1A3560)",
          borderRadius: "var(--radius-xl)",
          padding: "1.5rem 2rem",
          textAlign: "center",
          border: "1px solid var(--teal)",
          animation: "fadeInUp 0.5s ease",
          minWidth: 280,
        }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#x1F389;</p>
          <p style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
            You won
          </p>
          <p style={{ color: "white", fontSize: "1.25rem", fontWeight: 800 }}>
            {winner.label}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.375rem" }}>
            Added to your rewards. Redeem or convert to credit.
          </p>
          <a href="/dashboard/rewards" style={{ display: "inline-block", marginTop: "1rem", padding: "0.625rem 1.25rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, fontSize: "0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
            View my rewards &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
