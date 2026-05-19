// Thin HubSpot Contacts API client.
// We use upsert semantics (POST then PATCH-on-409) so re-submissions update
// the existing contact instead of failing. Mirrors the pattern used in the
// agrus-ai-site /api/book route.

export interface HubspotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  agrus_lead_source?: string;
  agrus_vertical?: string;
  agrus_use_case?: string;
  agrus_compliance_bar?: string;
  agrus_urgency?: string;
  // Free-form additional Agrus fields are allowed:
  [key: string]: string | undefined;
}

export class HubspotError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`HubSpot API error ${status}`);
    this.name = "HubspotError";
    this.status = status;
    this.body = body;
  }
}

export interface UpsertResult {
  contactId: string;
  created: boolean;
}

const BASE = "https://api.hubapi.com";

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Upserts a HubSpot contact by email.
 * - Tries POST first (creates new contact).
 * - On 409 conflict, looks up the existing contact by email and PATCHes it.
 *
 * Returns the contact id + whether it was newly created.
 */
export async function upsertContact(
  token: string,
  properties: HubspotContactProperties,
): Promise<UpsertResult> {
  // Strip undefined values — HubSpot rejects nulls on string properties
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (typeof v === "string" && v.length > 0) cleaned[k] = v;
  }

  const createResp = await fetch(`${BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ properties: cleaned }),
  });

  if (createResp.ok) {
    const body = (await createResp.json()) as { id?: string };
    if (!body.id) throw new HubspotError(createResp.status, "create response missing id");
    return { contactId: body.id, created: true };
  }

  if (createResp.status !== 409) {
    const text = await createResp.text();
    throw new HubspotError(createResp.status, text);
  }

  // 409 → existing contact. Look up by email, then PATCH.
  const lookup = await fetch(
    `${BASE}/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`,
    { method: "GET", headers: authHeaders(token) },
  );
  if (!lookup.ok) {
    const text = await lookup.text();
    throw new HubspotError(lookup.status, `lookup after 409 failed: ${text}`);
  }
  const lookupBody = (await lookup.json()) as { id?: string };
  if (!lookupBody.id) throw new HubspotError(404, "lookup returned no id");

  const update = await fetch(`${BASE}/crm/v3/objects/contacts/${lookupBody.id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ properties: cleaned }),
  });
  if (!update.ok) {
    const text = await update.text();
    throw new HubspotError(update.status, `patch failed: ${text}`);
  }

  return { contactId: lookupBody.id, created: false };
}

/**
 * Creates a HubSpot Note engagement attached to a contact.
 * Optional — we use it to record the original use-case payload alongside the
 * structured properties, so the CEO sees the full verbatim text on the
 * contact timeline.
 */
export async function addNoteToContact(
  token: string,
  contactId: string,
  body: string,
): Promise<void> {
  const tsMillis = Date.now();
  const resp = await fetch(`${BASE}/crm/v3/objects/notes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      properties: {
        hs_note_body: body,
        hs_timestamp: String(tsMillis),
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }, // note-to-contact
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new HubspotError(resp.status, `note create failed: ${text}`);
  }
}
