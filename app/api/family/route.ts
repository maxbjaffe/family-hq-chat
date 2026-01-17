import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const HEALTH_DB_ID = "0a6bcb34-36d5-4eec-a740-a8f345e6885a";

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
    case "date":
      return property.date?.start || null;
    case "formula":
      return property.formula?.string || property.formula?.number?.toString() || null;
    default:
      return null;
  }
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string | null;
  age: string | null;
  birthday: string | null;
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  doctors: string | null;
  patientPortal: string | null;
  emergencyNotes: string | null;
  school: string | null;
  teachers: string | null;
  activities: string | null;
}

// Simple cache
let cachedMembers: FamilyMember[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Return cached if valid
    if (cachedMembers && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ members: cachedMembers });
    }

    const response = await notion.dataSources.query({
      data_source_id: HEALTH_DB_ID,
      page_size: 100,
    });

    const members: FamilyMember[] = response.results.map((page) => {
      const props = (page as { id: string; properties: Record<string, NotionProperty> }).properties;

      return {
        id: (page as { id: string }).id,
        name: extractProperty(props["Name"]) || "Unknown",
        role: extractProperty(props["Family Role"]),
        age: extractProperty(props["Age (Y/M/D)"]),
        birthday: extractProperty(props["Birthday"]),
        bloodType: extractProperty(props["Blood Type"]),
        allergies: extractProperty(props["Allergies"]),
        medications: extractProperty(props["Medications"]),
        conditions: extractProperty(props["Chronic Conditions"]),
        doctors: extractProperty(props["Primary Doctors"]),
        patientPortal: extractProperty(props["Patient Portal Link"]),
        emergencyNotes: extractProperty(props["Emergency Notes"]),
        school: extractProperty(props["School / Grade"]),
        teachers: extractProperty(props["Teachers"]),
        activities: extractProperty(props["Activities & Interests"]),
      };
    });

    // Update cache
    cachedMembers = members;
    cacheTime = now;

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching family data:', error);
    return NextResponse.json({ error: 'Failed to fetch family data' }, { status: 500 });
  }
}
