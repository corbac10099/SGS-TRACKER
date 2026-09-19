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
      case 'quests':
        data = await (prisma as any).quest.update({
          where: { id },
          data: {
            title: body.title,
            description: body.description,
            category: body.category,
            targetStat: body.targetStat,
            targetValue: body.targetValue !== undefined ? Number(body.targetValue) : undefined,
            xpReward: body.xpReward !== undefined ? Number(body.xpReward) : undefined,
            minRankTier: body.minRankTier !== undefined ? Number(body.minRankTier) : undefined,
            maxRankTier: body.maxRankTier !== undefined ? Number(body.maxRankTier) : undefined,
            minSpi: body.minSpi !== undefined ? Number(body.minSpi) : undefined,
            maxSpi: body.maxSpi !== undefined ? Number(body.maxSpi) : undefined,
            isActive: body.isActive,
          }
        });
        break;
      case 'rewards': {
        data = await (prisma as any).levelReward.update({
          where: { id },
          data: {
            level: body.level !== undefined ? Number(body.level) : undefined,
            type: body.type,
            title: body.title,
            description: body.description,
            rewardKey: body.rewardKey,
            icon: body.icon,
            badgeColor: body.badgeColor,
            isActive: body.isActive,
          }
        });
        break;
      }
      case 'cosmetics': {
        const descriptionContent = (body.cssRules || body.r2Key)
          ? JSON.stringify({ desc: body.desc || body.name, cssRules: body.cssRules, r2Key: body.r2Key })
          : (body.desc || body.name);
        const existing = await (prisma as any).levelReward.findFirst({
          where: { OR: [{ id }, { rewardKey: id }] }
        });
        if (existing) {
          data = await (prisma as any).levelReward.update({
            where: { id: existing.id },
            data: {
              level: body.minLevel !== undefined ? Number(body.minLevel) : (body.level !== undefined ? Number(body.level) : undefined),
              type: body.type || existing.type,
              title: body.name || body.title || existing.title,
              description: descriptionContent,
              badgeColor: body.color || body.badgeColor || existing.badgeColor,
              isActive: body.isActive !== undefined ? body.isActive : true,
            }
          });
        }
        break;
      }
      case 'badges': {
        const metaPayload = {
          description: body.description || body.label,
          iconType: body.iconType || (body.imageUrl ? "image" : "svg"),
          imageUrl: body.imageUrl || null,
          colorClass: body.colorClass || "text-amber-400",
          bgClass: body.bgClass || "bg-amber-500/10",
          borderClass: body.borderClass || "border-amber-400/30",
          glowClass: body.glowClass || "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
        };
        const existing = await (prisma as any).levelReward.findFirst({
          where: { OR: [{ id }, { rewardKey: id }] }
        });
        if (existing) {
          data = await (prisma as any).levelReward.update({
            where: { id: existing.id },
            data: {
              level: body.minLevel !== undefined ? Number(body.minLevel) : (body.level !== undefined ? Number(body.level) : undefined),
              type: "badge",
              title: body.label || body.title || existing.title,
              description: JSON.stringify(metaPayload),
              badgeColor: body.color || body.badgeColor || existing.badgeColor,
              isActive: body.isActive !== undefined ? body.isActive : true,
            }
          });
        }
        break;
      }
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
      case 'quests': await (prisma as any).quest.delete({ where: { id } }); break;
      case 'rewards':
      case 'cosmetics':
      case 'badges': {
        const found = await (prisma as any).levelReward.findFirst({
          where: { OR: [{ id }, { rewardKey: id }] }
        });
        if (found) {
          await (prisma as any).levelReward.delete({ where: { id: found.id } });
        }
        break;
      }
      default: return setCORSHeaders(NextResponse.json({ error: `Entity not found: ${entity}` }, { status: 404 }));
    }
    return setCORSHeaders(NextResponse.json({ success: true }));
  } catch (error: any) {
    console.error(`DELETE error: ${error.message}`);
    return setCORSHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
