"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "0.375rem",
};

export default function SignupForm({
  referralCode: referralCodeProp,
}: {
  referralCode?: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    referralCode: referralCodeProp || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useMagicLink, setUsemagicLink] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    if (useMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?return=/onboarding`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            referral_code: formData.referralCode || null,
          },
        },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setLoading(false);
      setShowCheckEmail(true);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?return=/onboarding`,
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          referral_code: formData.referralCode || null,
        },
      },
    });

    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/onboarding");
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?return=/onboarding`,
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT — Brand panel (hidden on mobile) */}
      <div
        className="hidden md:flex"
        style={{
          background: "var(--midnight)",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "50%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "1rem",
          }}
        >
          Swiipt
        </div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: "1.5rem",
          }}
        >
          Your journey starts here.
        </h2>
        {[
          "🎁 Free Qatar Tourist Visa on signup",
          "🎯 Save toward any destination",
          "✈️ Book flights, visas, and holidays",
        ].map((benefit) => (
          <div
            key={benefit}
            style={{
              color: "var(--gray-300)",
              fontSize: "0.9375rem",
              marginBottom: "0.75rem",
            }}
          >
            {benefit}
          </div>
        ))}
      </div>

      {/* RIGHT — Form */}
      <div
        style={{
          background: "white",
          padding: "3rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
        }}
        className="md:w-1/2"
      >
        {showCheckEmail ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📬</div>
            <h3
              style={{
                fontWeight: 700,
                color: "var(--midnight)",
                marginBottom: "0.5rem",
              }}
            >
              Check your email
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
              }}
            >
              We sent a sign-in link to <strong>{formData.email}</strong>.
              Click it to continue.
            </p>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--midnight)",
                marginBottom: "0.5rem",
              }}
            >
              Create your account
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              Free to join. No credit card required.
            </p>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  color: "var(--danger)",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.708c-.18-.54-.282-1.117-.282-1.708s.102-1.168.282-1.708V4.96H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.04l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                or
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Full name */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={labelStyle}>Phone number</label>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Password (only when NOT using magic link) */}
              {!useMagicLink && (
                <div style={{ marginBottom: "0.875rem" }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    placeholder="Create a password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={8}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Referral code */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={labelStyle}>
                  Referral code{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MOVE-ADE7"
                  value={formData.referralCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referralCode: e.target.value.toUpperCase(),
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Magic link toggle */}
              <button
                type="button"
                onClick={() => setUsemagicLink(!useMagicLink)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--teal)",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: "1rem",
                }}
              >
                {useMagicLink
                  ? "Use password instead"
                  : "Sign up with email link instead (no password)"}
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  background: loading ? "var(--gray-300)" : "var(--teal)",
                  color: "var(--midnight)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating account..." : "Create free account"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                marginTop: "1.5rem",
              }}
            >
              Already have an account?{" "}
              <a
                href="/login"
                style={{ color: "var(--teal)", fontWeight: 600 }}
              >
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
