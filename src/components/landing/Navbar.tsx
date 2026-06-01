"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    "Destinations",
    "Services ▾",
    "Flights",
    "Holidays",
    "Resources",
  ];

  const linkColor = scrolled ? "var(--text-secondary)" : "white";

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? "white" : "transparent",
          boxShadow: scrolled ? "var(--shadow-md)" : "none",
          transition: "background 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 2rem",
            height: "4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* LEFT: Logo */}
          <a href="/">
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: "1.5rem",
                color: scrolled ? "var(--midnight)" : "white",
              }}
            >
              Swiipt
            </span>
          </a>

          {/* CENTER: Desktop nav links */}
          <div
            style={{
              display: "none",
              gap: "2rem",
              alignItems: "center",
            }}
            className="md:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: "14px",
                  color: linkColor,
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--teal)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = linkColor)
                }
              >
                {link}
              </a>
            ))}
          </div>

          {/* RIGHT: Sign in + Get Started */}
          <div style={{ display: "none", alignItems: "center", gap: "1rem" }} className="md:flex">
            <a
              href="/login"
              style={{
                fontSize: "14px",
                color: linkColor,
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--teal)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = linkColor)
              }
            >
              Sign in
            </a>
            <a
              href="/signup"
              style={{
                background: "var(--teal)",
                color: "var(--midnight)",
                fontWeight: 600,
                fontSize: "14px",
                padding: "8px 20px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                border: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--teal-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--teal)")
              }
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            style={{
              display: "flex",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: linkColor,
              padding: "0.5rem",
            }}
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--midnight)",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={28} />
          </button>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: "24px",
                  color: "white",
                  textDecoration: "none",
                  textAlign: "center",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link}
              </a>
            ))}
          </div>

          <a
            href="/signup"
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "2rem",
              right: "2rem",
              background: "var(--teal)",
              color: "var(--midnight)",
              fontWeight: 600,
              fontSize: "16px",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
              textDecoration: "none",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </a>
        </div>
      )}
    </>
  );
}
