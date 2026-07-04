"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

const TEMPLATES = [
  "I'm moving to Canada",
  "Find international scholarships",
  "Register your UK company",
  "Study in Germany — fully funded",
  "Get your UAE Golden Visa",
];

export default function AffiliateTools({ status }: { status: any }) {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (status.id || initialized.current) return;
    initialized.current = true;
    fetch("/api/affiliate/init", { method: "POST" }).then(res => { if (res.ok) router.refresh(); }).catch(() => {});
  }, [status.id, router]);

  const referralCode = status.custom_affiliate_code || "";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  // Tool 1: Link Generator
  const [destinationUrl, setDestinationUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  function generateLink() {
    const path = destinationUrl.replace(/^https?:\/\/[^\/]+/, "");
    setGeneratedLink(`${window.location.origin}${path}?ref=${referralCode}`);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Tool 2: WhatsApp Message Generator
  const [serviceType, setServiceType] = useState("visa");
  const serviceMessages: Record<string, string> = {
    visa: `I'm using Swiipt to handle my visa application. They have experts who guide you through the entire process. Sign up here: ${referralLink}`,
    scholarship: `There are fully funded scholarships open right now for Nigerians. Swiipt helps you track applications and save toward your move. Join here: ${referralLink}`,
    flight: `I booked my relocation flight through Swiipt — great rates and they handle the paperwork. Check them out: ${referralLink}`,
    company: `Registering a UK company from Nigeria? Swiipt handles the entire registration process. Sign up: ${referralLink}`,
  };

  // Tool 3: Share Image Generator (Canvas)
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [userName, setUserName] = useState("");
  const [score, setScore] = useState("75");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function generateShareImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 1080;
    canvas.height = 1080;

    ctx.fillStyle = "#06112B";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#00C896";
    ctx.fillRect(0, 0, 1080, 8);
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Swiipt", 80, 100);
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(selectedTemplate, 80, 240);
    ctx.font = "36px Arial";
    ctx.fillStyle = "#B8C0CF";
    ctx.fillText(`${userName || "You"} · Readiness Score: ${score}/100`, 80, 340);
    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#00C896";
    ctx.fillText(`Join me: swiipt.com/signup?ref=${referralCode}`, 80, 900);

    const link = document.createElement("a");
    link.download = "swiipt-share.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tool 1: Link Generator */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          🔗 Link Generator
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Generate a referral link for any page on Swiipt.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            value={destinationUrl}
            onChange={e => setDestinationUrl(e.target.value)}
            placeholder="e.g. https://swiipt.com/move/uae-dubai-residency"
            style={{ flex: 1, padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
          />
          <button onClick={generateLink} style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            Generate
          </button>
        </div>
        {generatedLink && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input readOnly value={generatedLink} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.75rem', background: 'var(--off-white)', fontFamily: 'monospace' }} />
            <button onClick={() => handleCopy(generatedLink)} style={{ padding: '0.5rem 0.75rem', background: copied ? 'var(--teal)' : 'var(--midnight)', color: 'white', fontWeight: 600, fontSize: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
              {copied ? "✓" : "Copy"}
            </button>
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>QR Code:</p>
          <QRCodeCanvas value={generatedLink || referralLink} size={160} bgColor="#ffffff" fgColor="#06112B" />
        </div>
      </div>

      {/* Tool 2: WhatsApp Message Generator */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          💬 WhatsApp Message Generator
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select a service type to generate a pre-written message.
        </p>
        <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          <option value="visa">Visa Services</option>
          <option value="scholarship">Scholarships</option>
          <option value="flight">Flights</option>
          <option value="company">Company Registration</option>
        </select>
        <textarea readOnly value={serviceMessages[serviceType]} rows={4} style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem', resize: 'none', background: 'var(--off-white)', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button onClick={() => handleCopy(serviceMessages[serviceType])} style={{ padding: '0.5rem 1.25rem', background: copied ? 'var(--teal)' : 'var(--midnight)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
            {copied ? "Copied!" : "Copy Message"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(serviceMessages[serviceType])}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '0.5rem 1.25rem', background: '#25D366', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', textAlign: 'center' }}
          >
            Open WhatsApp
          </a>
        </div>
      </div>

      {/* Tool 3: Share Image Generator */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          🖼️ Share Image Generator
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Generate a 1080×1080 PNG to share on Instagram or WhatsApp.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.25rem' }}>Template</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
              {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.25rem' }}>Your Name</label>
            <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem' }} />
          </div>
          <div style={{ width: '80px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--midnight)', display: 'block', marginBottom: '0.25rem' }}>Score</label>
            <input value={score} onChange={e => setScore(e.target.value)} type="number" min="0" max="100" style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8125rem' }} />
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button onClick={generateShareImage} style={{ padding: '0.625rem 1.5rem', background: 'var(--midnight)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
          Download PNG
        </button>
      </div>
    </div>
  );
}
