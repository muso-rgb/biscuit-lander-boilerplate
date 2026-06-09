export type CloseAdvancedSearchQuery = Record<string, unknown>;

export type CloseContact = {
  id?: string;
  lead_id?: string;
  name?: string;
  emails?: Array<{ email: string; type?: string }>;
};

export type CloseLead = {
  id: string;
  name?: string;
  contacts?: CloseContact[];
};

export type CloseOpportunity = {
  id: string;
};

export function buildContactEmailSearchQuery(email: string): CloseAdvancedSearchQuery {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    type: "and",
    queries: [
      { type: "object_type", object_type: "contact" },
      {
        type: "has_related",
        this_object_type: "contact",
        related_object_type: "contact_email",
        related_query: {
          type: "field_condition",
          field: {
            type: "regular_field",
            object_type: "contact_email",
            field_name: "email",
          },
          condition: {
            type: "text",
            mode: "full_words",
            value: normalizedEmail,
          },
        },
      },
    ],
  };
}

export class CloseClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.close.com/api/v1";

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(`Close API ${method} ${path} failed: ${response.status} ${text}`);
    }
    return data as T;
  }

  async getLead(leadId: string): Promise<CloseLead> {
    return this.request<CloseLead>("GET", `/lead/${leadId}/`);
  }

  async searchLeadByEmail(email: string): Promise<CloseLead | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;
    const result = await this.request<{ data?: CloseContact[] }>("POST", "/data/search/", {
      _limit: 1,
      _fields: { contact: ["id", "lead_id", "name", "emails"] },
      query: buildContactEmailSearchQuery(normalizedEmail),
    });
    const contact = result.data?.[0];
    if (!contact?.lead_id) return null;
    const lead = await this.getLead(contact.lead_id);
    const matchedContact = lead.contacts?.find((item) => item.id === contact.id) ?? contact;
    return { ...lead, contacts: [matchedContact] };
  }

  async createLead(input: {
    name: string;
    contacts: Array<{
      name: string;
      emails: Array<{ email: string; type?: string }>;
      phones?: Array<{ phone: string; type?: string }>;
    }>;
  }): Promise<CloseLead> {
    return this.request<CloseLead>("POST", "/lead/", input);
  }

  async updateContact(
    contactId: string,
    input: {
      name: string;
      emails: Array<{ email: string; type?: string }>;
      phones?: Array<{ phone: string; type?: string }>;
    },
  ): Promise<CloseContact> {
    return this.request<CloseContact>("PUT", `/contact/${contactId}/`, input);
  }

  async createOpportunity(input: {
    lead_id: string;
    note?: string;
    value?: number;
  }): Promise<CloseOpportunity> {
    return this.request<CloseOpportunity>("POST", "/opportunity/", input);
  }
}
