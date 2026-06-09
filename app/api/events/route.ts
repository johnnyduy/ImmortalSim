import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const eventsDir = path.join(process.cwd(), 'data', 'events');
    if (!fs.existsSync(eventsDir)) {
      return NextResponse.json({ error: 'Events directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(eventsDir).filter(file => file.endsWith('.json'));
    let allEvents: any[] = [];

    for (const file of files) {
      const filePath = path.join(eventsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const events = JSON.parse(content);
      if (Array.isArray(events)) {
        allEvents = [...allEvents, ...events];
      }
    }

    return NextResponse.json({ events: allEvents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
