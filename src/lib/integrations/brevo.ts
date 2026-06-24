const BREVO_API_URL = "https://api.brevo.com/v3";

export async function addContactToBrevo(params: {
  email: string;
  listId?: number;
  attributes?: Record<string, string>;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BREVO_API_URL}/contacts`, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        listIds: params.listId ? [params.listId] : [2],
        attributes: params.attributes || {},
        updateEnabled: true,
      }),
    });

    return res.status === 201 || res.status === 204;
  } catch (err) {
    console.error("Brevo contact add failed:", err);
    return false;
  }
}

export async function sendBrevoTransactional(params: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: params.fromName || "Swiipt",
          email: params.fromEmail || "hello@swiipt.com",
        },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Brevo send failed:", err);
    return false;
  }
}

export async function getBrevoLists(): Promise<any[]> {
  try {
    const res = await fetch(`${BREVO_API_URL}/contacts/lists`, {
      headers: { "api-key": process.env.BREVO_API_KEY! },
    });
    const data = await res.json();
    return data.lists || [];
  } catch {
    return [];
  }
}
