import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export interface Person {
  name: string;
  type: string | null;
  familyMembers: string[];
  organization: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  website: string | null;
  location: string | null;
}

interface RichTextItem {
  plain_text?: string;
}

interface NotionProperty {
  type: string;
  title?: RichTextItem[];
  rich_text?: RichTextItem[];
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  phone_number?: string | null;
  email?: string | null;
  url?: string | null;
  place?: { name?: string } | null;
}

function extractPlainText(richText: RichTextItem[]): string | null {
  if (!Array.isArray(richText) || richText.length === 0) return null;
  return richText.map((block) => block.plain_text || "").join("");
}

function extractProperty(property: NotionProperty | undefined): string | null {
  if (!property) return null;

  switch (property.type) {
    case "title":
      return extractPlainText(property.title || []);
    case "rich_text":
      return extractPlainText(property.rich_text || []);
    case "select":
      return property.select?.name || null;
    case "multi_select":
      return property.multi_select?.map((s) => s.name).join(", ") || null;
    case "phone_number":
      return property.phone_number || null;
    case "email":
      return property.email || null;
    case "url":
      return property.url || null;
    case "place":
      return property.place?.name || null;
    default:
      return null;
  }
}

export async function fetchPeopleAndProviders(): Promise<Person[]> {
  const databaseId = process.env.NOTION_PEOPLE_DB_ID;
  if (!databaseId) {
    throw new Error("NOTION_PEOPLE_DB_ID not configured");
  }

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    page_size: 100,
  });

  const people: Person[] = response.results.map((page) => {
    const props = (page as { properties: Record<string, NotionProperty> }).properties;

    return {
      name: extractProperty(props["Name"]) || "Unknown",
      type: extractProperty(props["Type"]),
      familyMembers: extractProperty(props["Family Member"])?.split(", ").filter(Boolean) || [],
      organization: extractProperty(props["Organization / School / Practice"]),
      phone: extractProperty(props["Phone"]),
      email: extractProperty(props["Email"]),
      notes: extractProperty(props["Notes"]),
      website: extractProperty(props["Website"]),
      location: extractProperty(props["Location"]),
    };
  });

  return people;
}

export function formatPeopleForContext(people: Person[]): string {
  return people
    .map((p) => {
      const lines = [`Name: ${p.name}`];
      if (p.type) lines.push(`Type: ${p.type}`);
      if (p.familyMembers.length > 0)
        lines.push(`Family Members: ${p.familyMembers.join(", ")}`);
      if (p.organization) lines.push(`Organization: ${p.organization}`);
      if (p.phone) lines.push(`Phone: ${p.phone}`);
      if (p.email) lines.push(`Email: ${p.email}`);
      if (p.location) lines.push(`Location: ${p.location}`);
      if (p.notes) lines.push(`Notes: ${p.notes}`);
      if (p.website) lines.push(`Website: ${p.website}`);
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
