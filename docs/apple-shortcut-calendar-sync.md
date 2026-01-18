# Apple Shortcut: Calendar Sync to Family HQ

This shortcut syncs your Apple Calendar events to Family HQ.

## Quick Setup

### Your API Details
- **Endpoint**: `https://family-hq-chat.vercel.app/api/shortcuts/calendar`
- **Secret Key**: `e64fe8874e824a902129990184ac2745`

---

## Build the Shortcut (Step by Step)

### 1. Find Calendar Events

1. Open **Shortcuts** app
2. Create new shortcut, name it "Sync Calendar to Family HQ"
3. Add action: **Find Calendar Events**
   - Add filter: **Start Date** → **is in the next** → **7 days**
   - Sort by: **Start Date** (Oldest First)
   - Limit: **50** (optional, prevents huge syncs)

### 2. Create Empty List

1. Add action: **List**
2. Leave it empty (delete any default items)
3. Add action: **Set Variable** → name it `eventsList`

### 3. Loop Through Events

1. Add action: **Repeat with Each**
   - Input: Calendar Events (from step 1)

2. Inside the repeat, add action: **Dictionary**
   - Add these keys (tap + to add each):

   | Key | Value (tap and select from Repeat Item) |
   |-----|----------------------------------------|
   | `title` | Title |
   | `start_time` | Start Date |
   | `end_time` | End Date |
   | `calendar` | Calendar |
   | `location` | Location |
   | `identifier` | Calendar Item Identifier |

3. Add action: **Add to Variable** → `eventsList`

4. End Repeat

### 4. Send to API

1. Add action: **Dictionary**
   - Key: `events`
   - Value: `eventsList` variable

2. Add action: **Get Contents of URL**
   - URL: `https://family-hq-chat.vercel.app/api/shortcuts/calendar`
   - Method: **POST**
   - Headers (tap to add):
     - `X-Shortcut-Key` : `e64fe8874e824a902129990184ac2745`
   - Request Body: **JSON**
   - Body: (use Dictionary from previous step)

### 5. Show Result

1. Add action: **Get Dictionary Value**
   - Key: `synced`
2. Add action: **Show Notification**
   - Title: "Calendar Synced"
   - Body: `[Dictionary Value] events synced`

---

## Automate It

1. Go to **Automations** tab
2. Tap **+** → **Personal Automation**
3. Choose **Time of Day**
   - Time: 6:00 AM (or your preference)
   - Repeat: Daily
4. Add action: **Run Shortcut** → "Sync Calendar to Family HQ"
5. Turn OFF "Ask Before Running"

---

## Testing

### Test with curl first:
```bash
curl -X POST https://family-hq-chat.vercel.app/api/shortcuts/calendar \
  -H "Content-Type: application/json" \
  -H "X-Shortcut-Key: e64fe8874e824a902129990184ac2745" \
  -d '{"events":[{"title":"Test Event","start_time":"2025-01-17T10:00:00","end_time":"2025-01-17T11:00:00","calendar":"Test"}]}'
```

### Check what's synced:
```bash
curl https://family-hq-chat.vercel.app/api/shortcuts/calendar \
  -H "X-Shortcut-Key: e64fe8874e824a902129990184ac2745"
```

---

## Troubleshooting

### "Unauthorized" error
- Check the X-Shortcut-Key header is exactly: `e64fe8874e824a902129990184ac2745`
- No extra spaces

### Events not appearing
- Run the shortcut manually and check the notification
- Use the GET endpoint to see what's in the database
- Check that dates are being sent correctly

### Response shows errors
The API returns detailed error info:
```json
{
  "success": true,
  "synced": 10,
  "errors": 2,
  "errorDetails": ["Event name: error message"]
}
```

---

## How It Works

1. Shortcut runs daily at 6 AM
2. Fetches next 7 days of calendar events
3. Sends to Family HQ API
4. API stores in database (upserts by event ID)
5. Dashboard pulls from database to show today's events
6. Old events (>7 days) auto-cleanup
