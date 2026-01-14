import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs
const PEOPLE_DB_ID = process.env.NOTION_PEOPLE_DB_ID || "d04e8ed2-544a-4376-a2dc-97a60ef2a185";
const HEALTH_DB_ID = "0a6bcb34-36d5-4eec-a740-a8f345e6885a";
const ASSETS_DB_ID = "a2965033-3736-40e3-8df9-3c0a364d6eb5";
const ACCOUNTS_DB_ID = "939921db-95bc-463e-8de9-1f218fe2b84f";

// Simple in-memory cache for Notion data
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedData: string | null = null;
let cacheTimestamp: number = 0;

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
  date?: { start?: string } | null;
  formula?: { string?: string; number?: number } | null;
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
    case "date":
      return property.date?.start || null;
    case "formula":
      return property.formula?.string || property.formula?.number?.toString() || null;
    default:
      return null;
  }
}

async function queryDatabase(databaseId: string): Promise<Record<string, NotionProperty>[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });
    return response.results.map(
      (page) => (page as { properties: Record<string, NotionProperty> }).properties
    );
  } catch (error) {
    console.error(`Failed to query database ${databaseId}:`, error);
    return [];
  }
}

// Fetch People & Providers
async function fetchPeople(): Promise<string> {
  const records = await queryDatabase(PEOPLE_DB_ID);
  if (records.length === 0) return "";

  const formatted = records.map((props) => {
    const lines = [`Name: ${extractProperty(props["Name"]) || "Unknown"}`];
    const type = extractProperty(props["Type"]);
    const familyMember = extractProperty(props["Family Member"]);
    const org = extractProperty(props["Organization / School / Practice"]);
    const phone = extractProperty(props["Phone"]);
    const email = extractProperty(props["Email"]);
    const location = extractProperty(props["Location"]);
    const notes = extractProperty(props["Notes"]);
    const website = extractProperty(props["Website"]);

    if (type) lines.push(`Type: ${type}`);
    if (familyMember) lines.push(`Family Members: ${familyMember}`);
    if (org) lines.push(`Organization: ${org}`);
    if (phone) lines.push(`Phone: ${phone}`);
    if (email) lines.push(`Email: ${email}`);
    if (location) lines.push(`Location: ${location}`);
    if (notes) lines.push(`Notes: ${notes}`);
    if (website) lines.push(`Website: ${website}`);

    return lines.join("\n");
  });

  return `## PEOPLE & PROVIDERS\n\n${formatted.join("\n\n---\n\n")}`;
}

// Fetch Family Health Info
async function fetchFamilyHealth(): Promise<string> {
  const records = await queryDatabase(HEALTH_DB_ID);
  if (records.length === 0) return "";

  const formatted = records.map((props) => {
    const lines = [`Name: ${extractProperty(props["Name"]) || "Unknown"}`];
    const role = extractProperty(props["Family Role"]);
    const age = extractProperty(props["Age (Y/M/D)"]);
    const birthday = extractProperty(props["Birthday"]);
    const bloodType = extractProperty(props["Blood Type"]);
    const allergies = extractProperty(props["Allergies"]);
    const medications = extractProperty(props["Medications"]);
    const conditions = extractProperty(props["Chronic Conditions"]);
    const doctors = extractProperty(props["Primary Doctors"]);
    const portal = extractProperty(props["Patient Portal Link"]);
    const emergency = extractProperty(props["Emergency Notes"]);

    if (role) lines.push(`Role: ${role}`);
    if (age) lines.push(`Age: ${age}`);
    if (birthday) lines.push(`Birthday: ${birthday}`);
    if (bloodType) lines.push(`Blood Type: ${bloodType}`);
    if (allergies) lines.push(`Allergies: ${allergies}`);
    if (medications) lines.push(`Medications: ${medications}`);
    if (conditions) lines.push(`Chronic Conditions: ${conditions}`);
    if (doctors) lines.push(`Primary Doctors: ${doctors}`);
    if (portal) lines.push(`Patient Portal: ${portal}`);
    if (emergency) lines.push(`Emergency Notes: ${emergency}`);

    return lines.join("\n");
  });

  return `## FAMILY HEALTH INFO\n\n${formatted.join("\n\n---\n\n")}`;
}

// Fetch Assets & Properties
async function fetchAssets(): Promise<string> {
  const records = await queryDatabase(ASSETS_DB_ID);
  if (records.length === 0) return "";

  const formatted = records.map((props) => {
    const lines = [`Name: ${extractProperty(props["Name"]) || "Unknown"}`];
    const type = extractProperty(props["Type"]);
    const identifier = extractProperty(props["Identifier (VIN / Serial / ID)"]);
    const purchaseDate = extractProperty(props["Purchase / Move-in Date"]);
    const relatedAccounts = extractProperty(props["Related Accounts"]);
    const notes = extractProperty(props["Notes"]);

    if (type) lines.push(`Type: ${type}`);
    if (identifier) lines.push(`ID/VIN/Serial: ${identifier}`);
    if (purchaseDate) lines.push(`Purchase/Move-in Date: ${purchaseDate}`);
    if (relatedAccounts) lines.push(`Related Accounts: ${relatedAccounts}`);
    if (notes) lines.push(`Notes: ${notes}`);

    return lines.join("\n");
  });

  return `## ASSETS & PROPERTIES\n\n${formatted.join("\n\n---\n\n")}`;
}

// Fetch Accounts & Policies
async function fetchAccounts(): Promise<string> {
  const records = await queryDatabase(ACCOUNTS_DB_ID);
  if (records.length === 0) return "";

  const formatted = records.map((props) => {
    const lines = [`Name: ${extractProperty(props["Name"]) || "Unknown"}`];
    const category = extractProperty(props["Category"]);
    const company = extractProperty(props["Institution / Company"]);
    const owner = extractProperty(props["Owner"]);
    const status = extractProperty(props["Status"]);
    const portal = extractProperty(props["Primary Portal / Site"]);
    const cost = extractProperty(props["Monthly / Annual Cost"]);
    const renewal = extractProperty(props["Renewal / Due Date"]);
    const relatedAsset = extractProperty(props["Related Asset"]);
    const notes = extractProperty(props["Notes"]);

    if (category) lines.push(`Category: ${category}`);
    if (company) lines.push(`Company: ${company}`);
    if (owner) lines.push(`Owner: ${owner}`);
    if (status) lines.push(`Status: ${status}`);
    if (portal) lines.push(`Portal/Website: ${portal}`);
    if (cost) lines.push(`Cost: ${cost}`);
    if (renewal) lines.push(`Renewal Date: ${renewal}`);
    if (relatedAsset) lines.push(`Related Asset: ${relatedAsset}`);
    if (notes) lines.push(`Notes: ${notes}`);

    return lines.join("\n");
  });

  return `## ACCOUNTS & POLICIES\n\n${formatted.join("\n\n---\n\n")}`;
}

// Fetch all data and combine (with caching)
export async function fetchAllFamilyData(): Promise<string> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  const [people, health, assets, accounts] = await Promise.all([
    fetchPeople(),
    fetchFamilyHealth(),
    fetchAssets(),
    fetchAccounts(),
  ]);

  const data = [people, health, assets, accounts].filter(Boolean).join("\n\n\n");

  // Update cache
  cachedData = data;
  cacheTimestamp = now;

  return data;
}

// Force cache invalidation (useful after updates)
export function invalidateCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
}

// Keep old exports for backward compatibility
export async function fetchPeopleAndProviders() {
  const records = await queryDatabase(PEOPLE_DB_ID);
  return records.map((props) => ({
    name: extractProperty(props["Name"]) || "Unknown",
    type: extractProperty(props["Type"]),
    familyMembers: extractProperty(props["Family Member"])?.split(", ").filter(Boolean) || [],
    organization: extractProperty(props["Organization / School / Practice"]),
    phone: extractProperty(props["Phone"]),
    email: extractProperty(props["Email"]),
    notes: extractProperty(props["Notes"]),
    website: extractProperty(props["Website"]),
    location: extractProperty(props["Location"]),
  }));
}

export function formatPeopleForContext(people: { name: string; type: string | null; familyMembers: string[]; organization: string | null; phone: string | null; email: string | null; notes: string | null; website: string | null; location: string | null }[]): string {
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
