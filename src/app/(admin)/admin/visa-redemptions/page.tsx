import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VisaRedemptionsActions from "@/components/admin/visa-redemptions/VisaRedemptionsActions";

const statusStyles: Record<string, React.CSSProperties> = {
  pending_payment: { background: "#FEF3C7", color: "#92400E" },
  payment_confirmed: { background: "#DBEAFE", color: "#1E40AF" },
  documents_uploaded: { background: "#DBEAFE", color: "#1E40AF" },
  processing: { background: "#F3E8FF", color: "#6B21A8" },
  completed: { background: "#D1FAE5", color: "#065F46" },
  cancelled: { background: "#FEE2E2", color: "#991B1B" },
};

export const dynamic = "force-dynamic";

export default async function AdminVisaRedemptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const { data: redemptions } = await supabaseAny
    .from("visa_redemptions")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });

  const statusLabel: Record<string, string> = {
    pending_payment: "Pending Payment",
    payment_confirmed: "Payment Confirmed",
    documents_uploaded: "Documents Uploaded",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const storageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents`
    : "";

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Visa Redemptions
      </h1>

      <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
        {!redemptions || redemptions.length === 0 ? (
          <p style={{ padding: "2rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
            No visa redemptions yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-100)" }}>
                  {["User", "Amount", "Nights", "Reference", "Status", "Passport Photo", "Data Page", "Created", "Expires", "Abandoned", "Actions"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r: any) => {
                  const isAbandoned = r.status === "cancelled" && r.abandoned_at;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--gray-100)", background: isAbandoned ? "#FFFBEB" : "white" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <p style={{ fontWeight: 600, color: "var(--midnight)" }}>{r.users?.full_name || "—"}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{r.users?.email || "—"}</p>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--midnight)", whiteSpace: "nowrap" }}>
                        NGN {Number(r.booking_fee_ngn || 0).toLocaleString()}
                        <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {" "}(~${Number(r.booking_fee_usd || 0)})
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                        {r.nights || 3}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "var(--teal)", fontWeight: 600, fontSize: "0.75rem" }}>
                        {r.payment_reference || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", ...(statusStyles[r.status] || { background: "var(--gray-100)", color: "var(--text-muted)" }) }}>
                          {isAbandoned ? "Abandoned" : (statusLabel[r.status] || r.status)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {r.passport_photo_url ? (
                          <a
                            href={`${storageBaseUrl}/${r.passport_photo_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.75rem", textDecoration: "none" }}
                          >
                            View photo →
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {r.passport_data_page_url ? (
                          <a
                            href={`${storageBaseUrl}/${r.passport_data_page_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--teal)", fontWeight: 600, fontSize: "0.75rem", textDecoration: "none" }}
                          >
                            View page →
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(r.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {r.expires_at ? new Date(r.expires_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {r.abandoned_at ? new Date(r.abandoned_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <VisaRedemptionsActions redemption={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
