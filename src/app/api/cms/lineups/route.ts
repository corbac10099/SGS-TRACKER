import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// API pour le CMS Lineups - GET (public avec filtres), POST/PUT/DELETE (admin AppControl)

const setCORSHeaders = (res: NextResponse) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
};

export async function OPTIONS() {
  return setCORSHeaders(new NextResponse(null, { status: 200 }));
}

function getLineupsFilePath(): string {
  const appControlPath = path.resolve(process.cwd(), '../AppControl/data/lineups.json');
  const localPath = path.resolve(process.cwd(), 'public/data/lineups.json');
  return fs.existsSync(appControlPath) ? appControlPath : localPath;
}

function readLineups(): any[] {
  try {
    const filePath = getLineupsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Lineups API] Error reading lineups:', err);
  }
  return [];
}

function writeLineups(data: any[]): boolean {
  try {
    const filePath = getLineupsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Lineups API] Error writing lineups:', err);
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agent = searchParams.get('agent')?.toLowerCase().trim();
  const agentUuid = searchParams.get('agentUuid')?.toLowerCase().trim();
  const map = searchParams.get('map')?.toLowerCase().trim();
  const side = searchParams.get('side')?.toLowerCase().trim();
  const ability = searchParams.get('ability')?.toUpperCase().trim();
  const difficulty = searchParams.get('difficulty')?.toLowerCase().trim();

  let lineups = readLineups();

  if (agent) {
    lineups = lineups.filter((l) => (l.agentName || '').toLowerCase() === agent);
  }
  if (agentUuid) {
    lineups = lineups.filter((l) => (l.agentUuid || '').toLowerCase() === agentUuid);
  }
  if (map && map !== 'all') {
    lineups = lineups.filter((l) => (l.map || '').toLowerCase() === map);
  }
  if (side && side !== 'all') {
    lineups = lineups.filter((l) => (l.side || '').toLowerCase() === side);
  }
  if (ability && ability !== 'ALL') {
    lineups = lineups.filter((l) => (l.ability || '').toUpperCase() === ability);
  }
  if (difficulty && difficulty !== 'all') {
    lineups = lineups.filter((l) => (l.difficulty || '').toLowerCase() === difficulty);
  }

  return setCORSHeaders(NextResponse.json(lineups));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.agentName || !body.map || !body.title) {
      return setCORSHeaders(NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 }));
    }

    const lineups = readLineups();
    const newLineup = {
      id: body.id || `lineup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agentUuid: body.agentUuid || '',
      agentName: body.agentName,
      ability: body.ability || 'E',
      abilityName: body.abilityName || '',
      map: body.map,
      mapUuid: body.mapUuid || '',
      side: body.side || 'attack',
      site: body.site || 'A',
      difficulty: body.difficulty || 'medium',
      title: body.title,
      description: body.description || '',
      videoUrl: body.videoUrl || '',
      thumbnailUrl: body.thumbnailUrl || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    lineups.unshift(newLineup);
    writeLineups(lineups);

    return setCORSHeaders(NextResponse.json(newLineup, { status: 201 }));
  } catch (err) {
    return setCORSHeaders(NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }));
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return setCORSHeaders(NextResponse.json({ error: 'ID manquant' }, { status: 400 }));
    }

    const lineups = readLineups();
    const index = lineups.findIndex((l) => l.id === body.id);
    if (index === -1) {
      return setCORSHeaders(NextResponse.json({ error: 'Lineup introuvable' }, { status: 404 }));
    }

    lineups[index] = {
      ...lineups[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    writeLineups(lineups);
    return setCORSHeaders(NextResponse.json(lineups[index]));
  } catch (err) {
    return setCORSHeaders(NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }));
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return setCORSHeaders(NextResponse.json({ error: 'ID requis' }, { status: 400 }));
    }

    let lineups = readLineups();
    const initialLen = lineups.length;
    lineups = lineups.filter((l) => l.id !== id);

    if (lineups.length === initialLen) {
      return setCORSHeaders(NextResponse.json({ error: 'Lineup introuvable' }, { status: 404 }));
    }

    writeLineups(lineups);
    return setCORSHeaders(NextResponse.json({ success: true }));
  } catch (err) {
    return setCORSHeaders(NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }));
  }
}
