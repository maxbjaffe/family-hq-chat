# Document Scanning & Email Automation Spec

> **Status:** Draft / Future Feature
> **Created:** 2026-01-08
> **Purpose:** Automatically organize, rename, and index documents from scans and forwarded emails

---

## Overview

Build an automation system that:
1. Watches for new scanned documents in a designated folder
2. Receives forwarded emails with document attachments
3. Uses Claude to parse and understand document contents
4. Auto-renames files based on extracted metadata
5. Organizes into a logical folder structure
6. Creates entries in Notion database
7. Makes documents queryable via Family HQ Chat

---

## Input Channels

### 1. Scanned Documents
- **Location:** Designated "inbox" folder (local, Google Drive, or Dropbox)
- **Formats:** PDF, PNG, JPG
- **Trigger:** File system watcher or cloud storage webhook

### 2. Forwarded Emails
- **Method:** Forward emails to dedicated address (e.g., `docs@family.com`)
- **Extracts:** Subject line, body text (as notes), attachments
- **Trigger:** Email webhook or IMAP polling

---

## Processing Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Scan Folder    │────▶│                 │────▶│                 │
└─────────────────┘     │                 │     │                 │
                        │  Claude Parser  │     │  File Organizer │
┌─────────────────┐     │                 │     │                 │
│  Email Inbox    │────▶│                 │────▶│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Family HQ      │◀────│  Notion DB      │
                        │  Chat Query     │     │                 │
                        └─────────────────┘     └─────────────────┘
```

---

## Document Classification

### Categories
| Category | Subcategories | Examples |
|----------|---------------|----------|
| **Financial** | Bills, Receipts, Tax, Bank, Investment | Electric bill, Amazon receipt, W-2 |
| **Medical** | Insurance, Records, Bills, Prescriptions | EOB, lab results, pharmacy receipt |
| **Legal** | Contracts, Titles, Certificates | Lease, car title, birth certificate |
| **Home** | Maintenance, Warranties, Manuals | HVAC service, appliance warranty |
| **Auto** | Registration, Insurance, Maintenance | Oil change receipt, registration |
| **Education** | Transcripts, Certificates, Records | Report card, diploma |
| **Personal** | IDs, Correspondence | Passport copy, important letters |

### Extracted Metadata
- **Date:** Document date (not scan date)
- **Type:** Category + subcategory
- **Source:** Company, institution, or person
- **Description:** Brief summary
- **Amount:** If financial
- **People:** Family members involved
- **Expiration:** If applicable (insurance, registration)

### Naming Convention
```
YYYY-MM-DD_Category_Source_Description.ext

Examples:
2026-01-08_Bill_ComEd_January-Electric.pdf
2026-01-05_Medical_BlueCross_EOB-DrSmith-Visit.pdf
2025-12-15_Tax_Employer_W2-2025.pdf
```

### Folder Structure
```
/Documents
  /Financial
    /Bills
      /Utilities
      /Subscriptions
    /Tax
      /2025
      /2026
    /Receipts
    /Bank-Statements
  /Medical
    /Insurance
    /Records
    /Bills
  /Legal
    /Contracts
    /Titles
    /Certificates
  /Home
    /Maintenance
    /Warranties
  /Auto
    /[Vehicle Name]
  /Education
    /[Person Name]
  /Personal
    /[Person Name]
```

---

## Notion Database Schema

### Documents Table
| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Auto-generated descriptive name |
| Date | Date | Document date |
| Category | Select | Primary category |
| Subcategory | Select | Secondary category |
| Source | Text | Company/institution |
| Description | Text | Brief summary |
| Amount | Number | If financial |
| File Path | URL/Text | Link to organized file |
| Original Email | URL | If from email forward |
| People | Multi-select | Family members involved |
| Expiration | Date | If applicable |
| Tags | Multi-select | Additional searchable tags |
| Raw Text | Text | Extracted text for search |
| Created | Created time | When processed |

---

# Version 1: Traditional Architecture

## Tech Stack
- **Runtime:** Node.js
- **File Watcher:** `chokidar`
- **Email:** Postmark inbound webhook or IMAP with `imap-simple`
- **AI:** Claude API (claude-3-5-sonnet or claude-3-opus)
- **Database:** Notion API
- **Queue:** Bull + Redis (for reliability) or simple in-memory for MVP

## Components

### 1. File Watcher Service
```typescript
// services/file-watcher.ts
import chokidar from 'chokidar';

const INBOX_PATH = process.env.DOCUMENT_INBOX_PATH;

const watcher = chokidar.watch(INBOX_PATH, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

watcher.on('add', async (filePath) => {
  await processDocument({ type: 'file', path: filePath });
});
```

### 2. Email Receiver
```typescript
// api/inbound-email/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const email = await req.json();

  // Extract attachments
  for (const attachment of email.Attachments) {
    const buffer = Buffer.from(attachment.Content, 'base64');
    await processDocument({
      type: 'email',
      buffer,
      filename: attachment.Name,
      subject: email.Subject,
      body: email.TextBody,
      from: email.From
    });
  }

  return Response.json({ success: true });
}
```

### 3. Document Processor
```typescript
// services/document-processor.ts
import Anthropic from '@anthropic-ai/sdk';
import { notion } from './notion';
import { moveFile, renameFile } from './file-utils';

const anthropic = new Anthropic();

export async function processDocument(input: DocumentInput) {
  // 1. Read document content
  const content = await readDocument(input);

  // 2. Parse with Claude
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: content }
        },
        {
          type: 'text',
          text: `Analyze this document and extract:
            - date (document date, not scan date)
            - category (Financial/Medical/Legal/Home/Auto/Education/Personal)
            - subcategory
            - source (company/institution)
            - description (brief, for filename)
            - amount (if financial)
            - people involved (family members)
            - expiration date (if applicable)
            - key details worth noting

            Return as JSON.`
        }
      ]
    }]
  });

  const metadata = JSON.parse(analysis.content[0].text);

  // 3. Generate new filename
  const newName = generateFilename(metadata);

  // 4. Determine destination folder
  const destFolder = determineFolder(metadata);

  // 5. Move and rename file
  const finalPath = await moveFile(input.path, destFolder, newName);

  // 6. Create Notion entry
  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DOCUMENTS_DB },
    properties: {
      Name: { title: [{ text: { content: metadata.description } }] },
      Date: { date: { start: metadata.date } },
      Category: { select: { name: metadata.category } },
      // ... rest of properties
    }
  });

  return { success: true, path: finalPath, metadata };
}
```

### 4. Deployment
- Run as background service (PM2, systemd, or Docker)
- Or deploy to serverless with scheduled polling
- Webhook endpoint for emails

## Pros & Cons

**Pros:**
- Straightforward, well-understood architecture
- Easy to debug and monitor
- Runs autonomously once set up
- Predictable costs

**Cons:**
- Requires server/always-on process for file watching
- Less flexible for edge cases
- Manual intervention needed for ambiguous documents
- Fixed logic, doesn't learn or adapt

---

# Version 2: Agent-Based Architecture

## Overview
Uses Claude agents with MCP (Model Context Protocol) for a more flexible, intelligent approach. Leverages the Claude Chrome extension for manual triggers and review.

## Tech Stack
- **Orchestration:** Claude Agent SDK / Claude Desktop
- **MCP Servers:**
  - File system access
  - Email (Gmail/IMAP)
  - Notion
  - Google Drive (optional)
- **UI:** Claude Chrome Extension for review/manual processing
- **Triggers:** MCP-based file watching or manual extension trigger

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
│                                                              │
│  "Process new documents, delegate to specialists,            │
│   handle edge cases, learn from corrections"                 │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SCANNER    │ │    EMAIL     │ │   PARSER     │ │   NOTION     │
│    AGENT     │ │    AGENT     │ │    AGENT     │ │    AGENT     │
│              │ │              │ │              │ │              │
│ - Watch inbox│ │ - Check mail │ │ - Read docs  │ │ - Create     │
│ - Read files │ │ - Extract    │ │ - Classify   │ │   entries    │
│ - Move/rename│ │   attachments│ │ - Extract    │ │ - Update     │
│              │ │ - Get context│ │   metadata   │ │ - Query      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐             ┌──────────────┐
│   REVIEW     │             │   SEARCH     │
│    AGENT     │             │    AGENT     │
│              │             │              │
│ - Flag       │             │ - Query docs │
│   uncertain  │             │ - Find       │
│ - Ask user   │             │   related    │
│ - Learn from │             │ - Answer     │
│   corrections│             │   questions  │
└──────────────┘             └──────────────┘
```

## MCP Server Configurations

### File System MCP
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/documents",
        "/path/to/scan-inbox"
      ]
    }
  }
}
```

### Gmail MCP
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-gmail"],
      "env": {
        "GMAIL_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

### Notion MCP
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-notion"],
      "env": {
        "NOTION_API_KEY": "secret_xxx"
      }
    }
  }
}
```

## Agent Prompts

### Orchestrator Agent
```markdown
You are the Document Processing Orchestrator. Your job is to:

1. Monitor for new documents (scan folder + email inbox)
2. Delegate parsing to the Parser Agent
3. Coordinate file organization with Scanner Agent
4. Create records via Notion Agent
5. Handle edge cases:
   - If uncertain about classification, flag for review
   - If document is multi-page with different content, split logically
   - If document references previous documents, link them
6. Learn from user corrections to improve future classification

Use these tools:
- filesystem: read/write/move files
- gmail: check for forwarded docs
- notion: create/update document records

Always explain your reasoning when classifying documents.
```

### Parser Agent
```markdown
You are the Document Parser Agent. When given a document:

1. Read and understand the full content
2. Extract structured metadata:
   - Date (from document, not filename)
   - Category + Subcategory
   - Source organization
   - Brief description (suitable for filename)
   - Financial amount if applicable
   - People mentioned/involved
   - Expiration dates if applicable
   - Any action items or deadlines

3. Generate appropriate filename: YYYY-MM-DD_Category_Source_Description.ext

4. Determine folder path based on category taxonomy

5. Flag anything unusual:
   - Multiple documents in one file
   - Poor scan quality
   - Personal/sensitive content needing extra care
   - Expiring items needing calendar reminders

Return structured JSON with all findings.
```

## Chrome Extension Workflows

### Manual Processing Flow
1. User saves/downloads a document
2. Right-click → "Process with Family HQ"
3. Claude extension opens side panel
4. Shows parsed metadata for confirmation
5. User can adjust category, name, folder
6. Confirms → file moved and Notion updated

### Email Forward Flow
1. User forwards email to Claude extension context
2. Extension extracts attachments
3. Processes each with confirmation dialog
4. Batch confirms or individual review

### Review Queue Flow
1. Agent flags uncertain documents
2. User opens extension → sees review queue
3. Quick swipe-style confirm/correct interface
4. Corrections feed back to improve classification

## Advantages of Agent Approach

### Flexibility
- Handles edge cases conversationally
- Can ask clarifying questions
- Adapts to new document types without code changes

### Context Awareness
- Can reference previous documents
- Understands relationships ("this is the renewal for last year's policy")
- Links related items automatically

### Learning
- Improves from corrections
- Remembers user preferences
- Adapts naming conventions per category

### Integration
- Chrome extension enables processing from anywhere
- Works with email, downloads, screenshots
- Can process while browsing

## Hybrid Approach (Recommended)

Combine both versions:

1. **Traditional backend** for reliable, always-on processing
2. **Agent layer** for intelligence and edge cases
3. **Chrome extension** for manual triggers and review

```
[Auto-processing]                    [Manual processing]
       │                                    │
       ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│ File Watcher │                    │   Chrome     │
│ Email Webhook│                    │  Extension   │
└──────┬───────┘                    └──────┬───────┘
       │                                    │
       └────────────┬───────────────────────┘
                    ▼
           ┌──────────────┐
           │    Agent     │
           │ Orchestrator │
           └──────┬───────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
[Parser]     [Organizer]    [Notion]
    │             │             │
    └─────────────┴─────────────┘
                  │
                  ▼
         ┌──────────────┐
         │  Review Queue │ ◄── Uncertain items
         │  (Extension)  │
         └──────────────┘
```

---

## Implementation Phases

### Phase 1: MVP
- [ ] Basic file watcher on local folder
- [ ] Claude API parsing
- [ ] Simple rename + move
- [ ] Notion database creation

### Phase 2: Email Integration
- [ ] Set up email receiving (Postmark or IMAP)
- [ ] Process attachments
- [ ] Include email context in parsing

### Phase 3: Agent Enhancement
- [ ] MCP server setup (filesystem, notion)
- [ ] Agent orchestration layer
- [ ] Uncertainty flagging
- [ ] Basic learning from corrections

### Phase 4: Chrome Extension
- [ ] Extension development or existing integration
- [ ] Manual trigger workflow
- [ ] Review queue interface
- [ ] Batch processing

### Phase 5: Family HQ Integration
- [ ] Document search in chat
- [ ] "Show me all medical receipts from 2025"
- [ ] Expiration/renewal reminders
- [ ] Spending summaries from receipts

---

## Open Questions

1. **Storage location:** Local NAS, Google Drive, Dropbox, or S3?
2. **Email provider:** Personal domain or Gmail forwarding?
3. **Mobile scanning:** What app? (Genius Scan, Adobe Scan, native?)
4. **Backup strategy:** Version history? Duplicate storage?
5. **Access control:** Which family members can see what?
6. **OCR needs:** Are scans searchable PDFs or images?

---

## Related Resources

- [Anthropic MCP Documentation](https://docs.anthropic.com/mcp)
- [Claude Chrome Extension](https://chrome.google.com/webstore/detail/claude)
- [Notion API](https://developers.notion.com/)
- [Postmark Inbound](https://postmarkapp.com/developer/webhooks/inbound-webhook)
