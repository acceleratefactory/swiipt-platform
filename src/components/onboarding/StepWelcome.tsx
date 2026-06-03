"use client";

import { useRouter } from "next/navigation";

export default function StepWelcome({
  goalData,
  user,
}: {
  goalData: { goalName?: string };
  user: { full_name?: string };
}) {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "0.5rem",
        }}
      >
        Your dashboard is ready!
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        Welcome to Swiipt, {user.full_name?.split(" ")[0]}. Your{" "}
        {goalData.goalName} goal is set up.
      </p>

      <div
        style={{
          background:
            "linear-gradient(135deg, var(--midnight), var(--midnight-light))",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "2rem",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🎁</span>
          <div>
            <div
              style={{
                color: "var(--teal)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Welcome reward unlocked
            </div>
            <div
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              Free Qatar Tourist Visa
            </div>
          </div>
        </div>
        <p
          style={{
            color: "var(--gray-300)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            lineHeight: 1.5,
          }}
        >
          30-day Qatar tourist visa processing, fully covered by Swiipt. Redeem
          to apply, or convert it to ₦25,000 locked travel credit.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => router.push("/dashboard?redeem=welcome_visa")}
            style={{
              padding: "0.625rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Redeem visa
          </button>
          <button
            onClick={() => router.push("/dashboard?convert=welcome_visa")}
            style={{
              padding: "0.625rem",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.8125rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
            }}
          >
            Convert to credit
          </button>
        </div>
      </div>

      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <p
          style={{
            fontWeight: 700,
            color: "var(--midnight)",
            marginBottom: "0.75rem",
            fontSize: "0.9375rem",
          }}
        >
          What happens next:
        </p>
        {[
          {
            step: "1",
            text: "Make your first deposit to start building your goal",
          },
          {
            step: "2",
            text: "Upload your documents to earn Mobility Score points",
          },
          {
            step: "3",
            text: "Reach 25% and unlock your first milestone reward",
          },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "0.625rem",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--teal-pale)",
                color: "var(--teal)",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.step}
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        style={{
          width: "100%",
          padding: "0.875rem",
          background: "var(--teal)",
          color: "var(--midnight)",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go to my dashboard →
      </button>
    </div>
  );
}
