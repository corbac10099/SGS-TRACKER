import { NextRequest, NextResponse } from 'next/server';
import { getR2Client, cleanR2Key } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'spycam-videos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get('key') || searchParams.get('src');

  if (!rawKey) {
    return NextResponse.json({ error: 'Clé de média manquante' }, { status: 400 });
  }

  const key = cleanR2Key(rawKey);
  const client = getR2Client();

  if (!client) {
    return NextResponse.json({ error: 'Stockage Cloudflare R2 non configuré' }, { status: 503 });
  }

  try {
    const range = req.headers.get('range');

    // Asynchronously log load metrics if it's the initial video load (no range or range starts at 0)
    if (!range || range.startsWith('bytes=0-')) {
      prisma.mediaLoad.create({
        data: {
          mediaKey: key,
          mediaType: 'video',
        },
      }).catch(() => {});
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Range: range || undefined,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
    }

    const contentType = response.ContentType || 'video/mp4';
    const contentLength = response.ContentLength?.toString() || '';
    const contentRange = response.ContentRange || '';

    // Convert AWS SDK stream to Web ReadableStream
    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('X-Content-Type-Options', 'nosniff');

    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    if (key.endsWith('.exe')) {
      const fileName = key.split('/').pop() || 'SGS-Tracker-Setup.exe';
      headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      headers.set('Content-Type', 'application/vnd.microsoft.portable-executable');
    }

    const status = range && contentRange ? 206 : 200;

    return new NextResponse(webStream as any, {
      status,
      headers,
    });
  } catch (error: any) {
    console.error('Erreur de streaming Cloudflare R2:', error);
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Fichier vidéo introuvable sur R2' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur lors du streaming sécurisé' }, { status: 500 });
  }
}
