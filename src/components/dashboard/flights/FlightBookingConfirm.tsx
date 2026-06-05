"use client";

import { useState, useEffect } from "react";

interface FlightBookingConfirmProps {
  offerId: string;
  profile: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function FlightBookingConfirm({ offerId, profile }: FlightBookingConfirmProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_offer, _setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  const [passengers, setPassengers] = useState<Array<{
    id: string; title: string; given_name: string; family_name: string;
    born_on: string; email: string; phone_number: string;
    gender: "m" | "f"; type: "adult" | "child" | "infant_without_seat";
  }>>([
    {
      id: "pax_1",
      title: "Mr",
      given_name: profile.full_name.split(" ")[0] || "",
      family_name: profile.full_name.split(" ").slice(1).join(" ") || "",
      born_on: "",
      email: profile.email,
      phone_number: profile.phone,
      gender: "m",
      type: "adult",
    },
  ]);

  useEffect(() => {
    async function loadOffer() {
      try {
        const res = await fetch(`/api/flights/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId }),
        });
        if (!res.ok) throw new Error("Failed to load offer");
        setLoading(false);
      } catch {
        setError("Could not load flight details. Please go back and try again.");
        setLoading(false);
      }
    }
    loadOffer();
  }, [offerId]);

  async function handleBook() {
    setBooking(true);
    setError("");

    try {
      const res = await fetch("/api/flights/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, passengers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBookingRef(data.bookingReference);
      setBooked(true);
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading flight details...
      </div>
    );
  }

  if (booked) {
    return (
      <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          Booking Confirmed
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Reference: <strong style={{ color: "var(--midnight)" }}>{bookingRef}</strong>
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Check your email for the e-ticket and itinerary.
        </p>
        <a
          href="/dashboard/flights"
          style={{ padding: "0.75rem 1.5rem", background: "var(--teal)", color: "var(--midnight)", fontWeight: 700, borderRadius: "var(--radius-md)", textDecoration: "none", display: "inline-block" }}
        >
          Back to flights
        </a>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "1rem" }}>
          Passenger Details
        </h2>
        {passengers.map((pax, idx) => (
          <div key={pax.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem", padding: "1rem", background: "var(--off-white)", borderRadius: "var(--radius-md)" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Given name</label>
              <input value={pax.given_name} onChange={(e) => {
                const updated = [...passengers];
                updated[idx].given_name = e.target.value;
                setPassengers(updated);
              }} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Family name</label>
              <input value={pax.family_name} onChange={(e) => {
                const updated = [...passengers];
                updated[idx].family_name = e.target.value;
                setPassengers(updated);
              }} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Date of birth</label>
              <input type="date" value={pax.born_on} onChange={(e) => {
                const updated = [...passengers];
                updated[idx].born_on = e.target.value;
                setPassengers(updated);
              }} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Gender</label>
              <select value={pax.gender} onChange={(e) => {
                const updated = [...passengers];
                updated[idx].gender = e.target.value as "m" | "f";
                setPassengers(updated);
              }} style={{ width: "100%", padding: "0.625rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.875rem", background: "white" }}>
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
      )}

      <button
        onClick={handleBook}
        disabled={booking}
        style={{
          width: "100%",
          padding: "0.875rem",
          background: "var(--midnight)",
          color: "white",
          fontWeight: 700,
          fontSize: "0.9375rem",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: booking ? "not-allowed" : "pointer",
          opacity: booking ? 0.6 : 1,
        }}
      >
        {booking ? "Booking..." : "Confirm & Book"}
      </button>
    </div>
  );
}
