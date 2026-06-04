"use client"

import { MessageCircle, Image, Briefcase, Play } from "lucide-react"

const serviceLinks = [
  "Visa Processing", "Residency Permits", "2nd Citizenship",
  "Company Registration", "Relocation Concierge", "Corporate Mobility", "Flight Booking",
]

const resourceLinks = [
  "Visa Intelligence", "Cost Calculator", "Eligibility Checker",
  "Destination Guides", "Success Stories",
]

const companyLinks = [
  "About Us", "Contact", "Privacy Policy", "Terms of Service", "Careers",
]

const socialIcons: Record<string, React.ReactNode> = {
  Twitter: <MessageCircle size={18} />,
  // eslint-disable-next-line jsx-a11y/alt-text
  Instagram: <Image size={18} />,
  Linkedin: <Briefcase size={18} />,
  Youtube: <Play size={18} />,
}

export default function Footer() {
  return (
    <footer style={{ background: "var(--midnight)", padding: "4rem 0 2rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
        {/* Four-column grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {/* Column 1 — Brand */}
          <div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "white" }}>
              Swiipt
            </span>
            <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "0.75rem", lineHeight: 1.6 }}>
              Your money moves you to the world.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              {["Twitter", "Instagram", "Linkedin", "Youtube"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  style={{ color: "var(--gray-500)", transition: "color 0.15s", display: "inline-flex" }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "white" }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--gray-500)" }}
                >
                  {socialIcons[icon]}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Services */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-300)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
              Services
            </h3>
            {serviceLinks.map((link) => (
              <a
                key={link}
                href={link === "Privacy Policy" || link === "Terms of Service" ? "/signup" : "#"}
                style={{ display: "block", fontSize: "0.875rem", color: "var(--gray-500)", marginBottom: "0.625rem", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "white" }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--gray-500)" }}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Column 3 — Resources */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-300)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
              Resources
            </h3>
            {resourceLinks.map((link) => (
              <a
                key={link}
                href="#"
                style={{ display: "block", fontSize: "0.875rem", color: "var(--gray-500)", marginBottom: "0.625rem", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "white" }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--gray-500)" }}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Column 4 — Company */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-300)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
              Company
            </h3>
            {companyLinks.map((link) => (
              <a
                key={link}
                href={link === "Privacy Policy" || link === "Terms of Service" ? "/signup" : "#"}
                style={{ display: "block", fontSize: "0.875rem", color: "var(--gray-500)", marginBottom: "0.625rem", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "white" }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--gray-500)" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "1.5rem",
            marginTop: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
            &copy; 2026 Swiipt. All rights reserved.
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
            All service fees quoted in Nigerian Naira unless stated otherwise.
          </p>
        </div>
      </div>
    </footer>
  )
}
