import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const setCORSHeaders = (res: NextResponse) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
};

export async function OPTIONS() {
  return setCORSHeaders(new NextResponse(null, { status: 200 }));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ entity: string, id: string }> }
) {
  const { entity, id } = await params;
  
  try {
    const body = await request.json();
    let data;

    switch (entity) {
      case 'news':
        data = await prisma.news.update({
          where: { id },
          data: {
            title: body.title,
            nodes: body.nodes ? JSON.stringify(body.nodes) : undefined,
            currentNodeId: body.currentNodeId,
            isDraft: body.isDraft,
          }
        });
        break;
      case 'agents': {
        const updateAbilities = body.abilities || {};
        const updateMetaAbilities = {
          slots: updateAbilities,
          _meta: {
            determinant: body.determinant || body.name,
            fullPortrait: body.fullPortrait || null,
          }
        };
        data = await prisma.agent.update({
          where: { id },
          data: {
            uuid: body.uuid,
            name: body.name,
            role: body.role,
            iconUrl: body.iconUrl,
            abilities: JSON.stringify(updateMetaAbilities),
            isDraft: body.isDraft,
          }
        });
        break;
      }
      case 'maps':
        data = await prisma.map.update({
          where: { id },
          data: {
            uuid: body.uuid,
            name: body.name,
            splashUrl: body.splashUrl,
            isDraft: body.isDraft,
          }
        });
        break;
      case 'banners':
        data = await prisma.banner.update({
          where: { id },
          data: {
            name: body.name,
            wideArtUrl: body.wideArtUrl,
            isDraft: body.isDraft,
          }
        });
        break;
      default:
        return setCORSHeaders(NextResponse.json({ error: 'Entity not found' }, { status: 404 }));
    }
    
    if (data && (data as any).nodes) (data as any).nodes = JSON.parse((data as any).nodes);
    if (data && (data as any).abilities) (data as any).abilities = JSON.parse((data as any).abilities);
    
    return setCORSHeaders(NextResponse.json(data));
  } catch (error: any) {
    return setCORSHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entity: string, id: string }> }
) {
  const resolvedParams = await params;
  const { entity, id } = resolvedParams;
  
  console.log(`DELETE request received for entity: ${entity}, id: ${id}`);
  
  try {
    switch (entity) {
      case 'news': await prisma.news.delete({ where: { id } }); break;
      case 'agents': await prisma.agent.delete({ where: { id } }); break;
      case 'maps': await prisma.map.delete({ where: { id } }); break;
      case 'banners': await prisma.banner.delete({ where: { id } }); break;
      default: return setCORSHeaders(NextResponse.json({ error: `Entity not found: ${entity}` }, { status: 404 }));
    }
    return setCORSHeaders(NextResponse.json({ success: true }));
  } catch (error: any) {
    console.error(`DELETE error: ${error.message}`);
    return setCORSHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
