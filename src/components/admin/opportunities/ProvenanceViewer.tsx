"use client";

interface ConfidenceEntry {
  score: number;
  reason: string;
  timestamp: string;
}

interface ProvenanceData {
  source_id?: string | null;
  source_evidence_id?: string | null;
  evidence_type?: string;
  ai_model?: string | null;
  ai_confidence?: number;
  ai_raw_response?: any;
  captured_at?: string;
  enriched_at?: string | null;
  created_by?: string | null;
  edited_by?: string[];
  edited_at?: string[];
  approved_by?: string | null;
  approved_at?: string | null;
  confidence_history?: ConfidenceEntry[];
  source_trust_tier?: string;
  source_degraded?: boolean;
  source_degraded_at?: string | null;
}

interface Props {
  provenance: ProvenanceData | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function confidenceColor(score: number): string {
  if (score >= 0.85) return "text-emerald-600 bg-emerald-50";
  if (score >= 0.7) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function trustBadge(tier: string | null | undefined): { label: string; className: string } {
  switch (tier) {
    case "trusted":
      return { label: "Trusted", className: "bg-emerald-100 text-emerald-700" };
    case "standard":
      return { label: "Standard", className: "bg-slate-100 text-slate-700" };
    case "review_all":
      return { label: "Review All", className: "bg-amber-100 text-amber-700" };
    default:
      return { label: "Unknown", className: "bg-gray-100 text-gray-500" };
  }
}

function evidenceTypeLabel(type: string | null | undefined): string {
  const labels: Record<string, string> = {
    rss: "RSS Feed",
    api: "API",
    watcher: "Watcher",
    manual: "Manual",
    url: "URL Paste",
    partner: "Partner",
    web: "Web",
  };
  return labels[type || ""] || type || "Unknown";
}

export default function ProvenanceViewer({ provenance, sourceName, sourceUrl }: Props) {
  if (!provenance) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">No provenance data available.</p>
      </div>
    );
  }

  const p = provenance;
  const trust = trustBadge(p.source_trust_tier);
  const confidence = p.ai_confidence ?? 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Provenance</h4>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${trust.className}`}>
          {trust.label}
        </span>
      </div>

      {/* Source */}
      <div className="px-4 py-3 space-y-2">
        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="text-gray-900 font-medium">{sourceName || "—"}</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>{" "}
            <span className="text-gray-900">{evidenceTypeLabel(p.evidence_type)}</span>
          </div>
          <div>
            <span className="text-gray-500">Captured:</span>{" "}
            <span className="text-gray-900">{formatDate(p.captured_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Enriched:</span>{" "}
            <span className="text-gray-900">{formatDate(p.enriched_at)}</span>
          </div>
          {sourceUrl && (
            <div className="col-span-2">
              <span className="text-gray-500">URL:</span>{" "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all text-xs"
              >
                {sourceUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* AI */}
      <div className="px-4 py-3 space-y-2">
        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Extraction</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Model:</span>{" "}
            <span className="text-gray-900 font-mono text-xs">{p.ai_model || "—"}</span>
          </div>
          <div>
            <span className="text-gray-500">Confidence:</span>{" "}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence History */}
      {p.confidence_history && p.confidence_history.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence History</h5>
          <div className="space-y-1">
            {p.confidence_history.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${confidenceColor(entry.score)}`}>
                    {Math.round(entry.score * 100)}%
                  </span>
                  <span className="text-gray-600">{entry.reason}</span>
                </div>
                <span className="text-gray-400">{formatDate(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Edits */}
      {(p.created_by || (p.edited_by && p.edited_by.length > 0) || p.approved_by) && (
        <div className="px-4 py-3 space-y-2">
          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Human Activity</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {p.created_by && (
              <div>
                <span className="text-gray-500">Created by:</span>{" "}
                <span className="text-gray-900 font-mono text-xs">{p.created_by}</span>
              </div>
            )}
            {p.approved_by && (
              <div>
                <span className="text-gray-500">Approved by:</span>{" "}
                <span className="text-gray-900 font-mono text-xs">{p.approved_by}</span>
              </div>
            )}
            {p.approved_at && (
              <div>
                <span className="text-gray-500">Approved at:</span>{" "}
                <span className="text-gray-900">{formatDate(p.approved_at)}</span>
              </div>
            )}
          </div>
          {p.edited_by && p.edited_by.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500">Edits:</span>{" "}
              <span className="text-gray-900">{p.edited_by.length} edit(s)</span>
              {p.edited_at && p.edited_at.length > 0 && (
                <span className="text-gray-400 ml-1">
                  (last: {formatDate(p.edited_at[p.edited_at.length - 1])})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source Health */}
      {p.source_degraded !== undefined && (
        <div className="px-4 py-3 space-y-2">
          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source Health</h5>
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              p.source_degraded ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {p.source_degraded ? "Degraded" : "Healthy"}
            </span>
            {p.source_degraded_at && (
              <span className="text-gray-400 text-xs">
                since {formatDate(p.source_degraded_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
