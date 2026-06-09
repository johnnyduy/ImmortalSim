import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const combatConfigPath = path.join(process.cwd(), 'data/combat-config.json');
const eventsPath = path.join(process.cwd(), 'data/events.json');
const sectsPath = path.join(process.cwd(), 'locales/en/sects.json');

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

export async function GET() {
  try {
    const combatConfig = JSON.parse(fs.readFileSync(combatConfigPath, 'utf8'));
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    const sects = JSON.parse(fs.readFileSync(sectsPath, 'utf8'));

    return NextResponse.json({
      success: true,
      combatConfig,
      events,
      sects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Failed to load admin configs: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing type or data in request body' },
        { status: 400 }
      );
    }

    let targetPath = '';
    if (type === 'combat') {
      targetPath = combatConfigPath;
    } else if (type === 'events') {
      targetPath = eventsPath;
    } else if (type === 'sects') {
      targetPath = sectsPath;
    } else {
      return NextResponse.json(
        { success: false, error: `Invalid configuration type: ${type}` },
        { status: 400 }
      );
    }

    // Write formatted JSON
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    // Run localization sync automatically
    let syncLog = '';
    try {
      syncLog = await runSyncScript();
    } catch (syncError: any) {
      console.error('Localization sync script failed:', syncError);
      return NextResponse.json({
        success: true,
        warning: 'Configuration saved, but localization sync script failed.',
        error: syncError.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved and synced successfully.',
      syncLog,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Failed to save configuration: ${error.message}` },
      { status: 500 }
    );
  }
}
