/**
 * src/lib/hubspot.ts test surface.
 *
 * upsertContact has three real branches:
 *   1. POST returns 200/201 → contact created, return { id, created: true }
 *   2. POST returns 409 → look up by email (GET), then PATCH → { id, created: false }
 *   3. POST returns other error → throw HubspotError
 *
 * addNoteToContact has two branches:
 *   - 200/201 → returns void
 *   - any error → throws HubspotError
 *
 * We mock global fetch via vi.stubGlobal so we never hit the real API.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { upsertContact, addNoteToContact, HubspotError } from "../../src/lib/hubspot.js";

const TEST_TOKEN = "pat-test-fake-token-not-real";

// Build a Response-shaped object that fetch's stub can return.
function mockResponse(opts: { status: number; body?: unknown; text?: string }): Response {
  const text = opts.text ?? JSON.stringify(opts.body ?? {});
  return new Response(text, {
    status: opts.status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("upsertContact", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a new contact when POST returns 201", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ status: 201, body: { id: "999999999" } }),
    );

    const result = await upsertContact(TEST_TOKEN, {
      email: "new@example.com",
      firstname: "New",
      lastname: "Contact",
    });

    expect(result.contactId).toBe("999999999");
    expect(result.created).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toMatch(/\/crm\/v3\/objects\/contacts$/);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toContain(TEST_TOKEN);
  });

  it("falls back to GET + PATCH when POST returns 409 conflict", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    // 1) POST → 409
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 409, body: { message: "conflict" } }));
    // 2) GET by email → 200 with existing id
    fetchMock.mockResolvedValueOnce(
      mockResponse({ status: 200, body: { id: "888888888" } }),
    );
    // 3) PATCH → 200
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 200, body: { id: "888888888" } }));

    const result = await upsertContact(TEST_TOKEN, {
      email: "existing@example.com",
      lastname: "Existing",
    });

    expect(result.contactId).toBe("888888888");
    expect(result.created).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify call sequence
    const calls = fetchMock.mock.calls;
    expect((calls[1][0] as string)).toContain("idProperty=email");
    expect((calls[2][1].method as string)).toBe("PATCH");
    expect((calls[2][0] as string)).toContain("/888888888");
  });

  it("throws HubspotError on non-409 failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ status: 401, text: "unauthorized" }),
    );

    await expect(
      upsertContact(TEST_TOKEN, { email: "x@example.com", lastname: "X" }),
    ).rejects.toThrow(HubspotError);
  });

  it("strips undefined and empty-string properties before sending", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "1" } }));

    await upsertContact(TEST_TOKEN, {
      email: "x@example.com",
      lastname: "X",
      firstname: undefined,
      company: "",
      agrus_use_case: "Real value",
    });

    const init = fetchMock.mock.calls[0][1];
    const body = JSON.parse(init.body as string);
    expect(body.properties.email).toBe("x@example.com");
    expect(body.properties.agrus_use_case).toBe("Real value");
    expect(body.properties.firstname).toBeUndefined();
    expect(body.properties.company).toBeUndefined();
  });

  it("throws when GET-by-email after 409 returns non-200", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 409 }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 404, text: "not found" }));

    await expect(
      upsertContact(TEST_TOKEN, { email: "x@example.com", lastname: "X" }),
    ).rejects.toThrow(HubspotError);
  });

  it("throws when PATCH after 409+GET returns non-200", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 409 }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 200, body: { id: "111" } }));
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 400, text: "bad request" }));

    await expect(
      upsertContact(TEST_TOKEN, { email: "x@example.com", lastname: "X" }),
    ).rejects.toThrow(HubspotError);
  });
});

describe("addNoteToContact", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a note with the correct association type for contact (associationTypeId 202)", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: "note-id" } }));

    await addNoteToContact(TEST_TOKEN, "contact-id-123", "Hello, this is a note body.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/crm\/v3\/objects\/notes$/);
    const body = JSON.parse(init.body as string);
    expect(body.properties.hs_note_body).toBe("Hello, this is a note body.");
    expect(body.associations[0].to.id).toBe("contact-id-123");
    expect(body.associations[0].types[0].associationTypeId).toBe(202);
  });

  it("throws HubspotError when note creation fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ status: 400, text: "missing required field" }),
    );

    await expect(addNoteToContact(TEST_TOKEN, "contact-id", "note body")).rejects.toThrow(
      HubspotError,
    );
  });
});
