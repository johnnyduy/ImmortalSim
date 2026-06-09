import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { EventDefinition } from '../../../../types';

const categories = ['general.json', 'city.json', 'mountain.json', 'sect.json', 'demonic.json'];

function runSyncScript(): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts/sync-locales.js');
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

function getTargetFilename(event: any): string {
  const location = event.location || '';
  const tags = event.tags || [];

  if (location === 'city') return 'city.json';
  if (location === 'mountain') return 'mountain.json';
  if (location === 'sect') return 'sect.json';
  if (
    tags.includes('demonic') ||
    tags.includes('ma_dao') ||
    (event.conditions && event.conditions.demonicEnergy)
  ) {
    return 'demonic.json';
  }
  return 'general.json';
}

function validateEvent(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!event.id || typeof event.id !== 'string' || event.id.trim() === '') {
    errors.push('Event ID is missing or invalid.');
  }
  if (!event.title) {
    errors.push('Event title is missing.');
  } else if (typeof event.title === 'object') {
    if (!event.title.vi && !event.title.en) {
      errors.push('Event title must have at least one translation (vi/en).');
    }
  } else if (typeof event.title !== 'string') {
    errors.push('Event title must be a string or a bilingual object {vi, en}.');
  }

  if (!event.description) {
    errors.push('Event description is missing.');
  } else if (typeof event.description === 'object') {
    if (!event.description.vi && !event.description.en) {
      errors.push('Event description must have at least one translation (vi/en).');
    }
  } else if (typeof event.description !== 'string') {
    errors.push('Event description must be a string or a bilingual object {vi, en}.');
  }

  if (!Array.isArray(event.choices) || event.choices.length === 0) {
    errors.push('Event must have at least one choice.');
  } else {
    event.choices.forEach((choice: any, index: number) => {
      if (!choice.id || typeof choice.id !== 'string') {
        errors.push(`Choice #${index + 1} is missing an ID.`);
      }
      if (!choice.text) {
        errors.push(`Choice #${index + 1} text is missing.`);
      } else if (typeof choice.text === 'object') {
        if (!choice.text.vi && !choice.text.en) {
          errors.push(`Choice #${index + 1} text must have at least one translation (vi/en).`);
        }
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function readAllEvents(): Record<string, any[]> {
  const fileData: Record<string, any[]> = {};
  for (const file of categories) {
    const filePath = path.join(process.cwd(), 'data/events', file);
    if (fs.existsSync(filePath)) {
      try {
        fileData[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        fileData[file] = [];
      }
    } else {
      fileData[file] = [];
    }
  }
  return fileData;
}

function saveAllEvents(fileData: Record<string, any[]>) {
  const eventsDir = path.join(process.cwd(), 'data/events');
  if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
  }
  for (const file of categories) {
    const filePath = path.join(eventsDir, file);
    fs.writeFileSync(filePath, JSON.stringify(fileData[file], null, 2) + '\n', 'utf8');
  }
}

export async function GET() {
  try {
    const fileData = readAllEvents();
    const allEvents: any[] = [];
    const duplicates: string[] = [];
    const idSet = new Set<string>();

    for (const file of categories) {
      for (const ev of fileData[file]) {
        if (idSet.has(ev.id)) {
          duplicates.push(ev.id);
        }
        idSet.add(ev.id);
        allEvents.push({ ...ev, _sourceFile: file });
      }
    }

    return NextResponse.json({
      success: true,
      events: allEvents,
      validation: {
        duplicates,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Failed to load events: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, event, originalId, jsonText } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter.' }, { status: 400 });
    }

    const fileData = readAllEvents();

    if (action === 'save') {
      if (!event) {
        return NextResponse.json({ success: false, error: 'Missing event data.' }, { status: 400 });
      }

      // Validate event format
      const validation = validateEvent(event);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed for event.',
          details: validation.errors,
        }, { status: 400 });
      }

      // Check for duplicate ID clashes (excluding the one we are editing)
      const existingIds = new Set<string>();
      for (const file of categories) {
        for (const ev of fileData[file]) {
          if (ev.id !== originalId) {
            existingIds.add(ev.id);
          }
        }
      }

      if (existingIds.has(event.id)) {
        return NextResponse.json({
          success: false,
          error: `Duplicate check failed: Event ID '${event.id}' already exists in another event.`,
        }, { status: 400 });
      }

      // Remove the original event if updating/renaming
      if (originalId) {
        for (const file of categories) {
          fileData[file] = fileData[file].filter(e => e.id !== originalId);
        }
      }

      // Append to the correct category file
      const targetFile = getTargetFilename(event);
      fileData[targetFile].push(event);

      saveAllEvents(fileData);

      // Run sync-locales to rebuild global events list and locales
      let syncLog = '';
      try {
        syncLog = await runSyncScript();
      } catch (syncError: any) {
        return NextResponse.json({
          success: true,
          warning: 'Event saved, but localization sync failed.',
          error: syncError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Event saved and synced successfully.',
        syncLog,
      });

    } else if (action === 'import') {
      if (!jsonText) {
        return NextResponse.json({ success: false, error: 'Missing jsonText parameter.' }, { status: 400 });
      }

      let importedData: any;
      try {
        importedData = JSON.parse(jsonText);
      } catch (jsonErr: any) {
        return NextResponse.json({
          success: false,
          error: `JSON syntax error: ${jsonErr.message}`,
        }, { status: 400 });
      }

      const eventsToImport = Array.isArray(importedData) ? importedData : [importedData];
      if (eventsToImport.length === 0) {
        return NextResponse.json({ success: false, error: 'No events found in JSON.' }, { status: 400 });
      }

      // Validate all imported events first
      const importErrors: string[] = [];
      const importIds = new Set<string>();

      eventsToImport.forEach((ev: any, index: number) => {
        const itemLabel = ev.id ? `Event '${ev.id}'` : `Item #${index + 1}`;
        const validation = validateEvent(ev);
        if (!validation.valid) {
          importErrors.push(`${itemLabel}: ${validation.errors.join(', ')}`);
        }
        if (ev.id) {
          if (importIds.has(ev.id)) {
            importErrors.push(`Duplicate ID found inside JSON: '${ev.id}'`);
          }
          importIds.add(ev.id);
        }
      });

      if (importErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Validation errors in imported JSON.',
          details: importErrors,
        }, { status: 400 });
      }

      // Perform insertion/overwrite logic
      let updatedCount = 0;
      let createdCount = 0;

      for (const ev of eventsToImport) {
        let isUpdate = false;

        // Check if event ID already exists in any file and remove it
        for (const file of categories) {
          const matchIndex = fileData[file].findIndex(e => e.id === ev.id);
          if (matchIndex !== -1) {
            fileData[file].splice(matchIndex, 1);
            isUpdate = true;
          }
        }

        if (isUpdate) {
          updatedCount++;
        } else {
          createdCount++;
        }

        // Put in correct category file
        const targetFile = getTargetFilename(ev);
        fileData[targetFile].push(ev);
      }

      saveAllEvents(fileData);

      const importedTitles = eventsToImport.map((ev: any) => {
        if (ev.title && typeof ev.title === 'object') {
          return ev.title.vi || ev.title.en || ev.id;
        }
        return ev.title || ev.id;
      });

      // Run sync-locales to rebuild
      let syncLog = '';
      try {
        syncLog = await runSyncScript();
      } catch (syncError: any) {
        return NextResponse.json({
          success: true,
          warning: 'Events imported, but localization sync failed.',
          importedTitles,
          error: syncError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Import completed: ${createdCount} events created, ${updatedCount} events updated.`,
        importedTitles,
        syncLog,
      });

    } else if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing event id to delete.' }, { status: 400 });
      }

      let deleted = false;
      for (const file of categories) {
        const originalLength = fileData[file].length;
        fileData[file] = fileData[file].filter(e => e.id !== id);
        if (fileData[file].length < originalLength) {
          deleted = true;
        }
      }

      if (!deleted) {
        return NextResponse.json({ success: false, error: `Event ID '${id}' not found.` }, { status: 404 });
      }

      saveAllEvents(fileData);

      // Run sync-locales
      let syncLog = '';
      try {
        syncLog = await runSyncScript();
      } catch (syncError: any) {
        return NextResponse.json({
          success: true,
          warning: 'Event deleted, but localization sync failed.',
          error: syncError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Event '${id}' deleted successfully.`,
        syncLog,
      });

    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
