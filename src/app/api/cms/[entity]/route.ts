import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API pour le CMS - Autorise GET (public) et POST/PUT/DELETE (privé, via AppControl)

const setCORSHeaders = (res: NextResponse) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
};

export async function OPTIONS() {
  return setCORSHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get('drafts') === 'true' || process.env.NODE_ENV === 'development';

  try {
    let data;

    switch (entity) {
      case 'news':
        data = await prisma.news.findMany({ 
          where: includeDrafts ? undefined : { isDraft: false },
          orderBy: { createdAt: 'desc' } 
        });
        // Parse nodes JSON
        data = data.map(d => ({ ...d, nodes: d.nodes ? JSON.parse(d.nodes) : [] }));
        break;
      case 'agents': {
        const agentItems = await prisma.agent.findMany({ where: includeDrafts ? undefined : { isDraft: false } });
        if (agentItems.length === 0) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const localJsonPath = path.resolve(process.cwd(), '../AppControl/data/agents.json');
            if (fs.existsSync(localJsonPath)) {
              const raw = fs.readFileSync(localJsonPath, 'utf-8');
              const localParsed = JSON.parse(raw);
              if (Array.isArray(localParsed) && localParsed.length > 0) {
                const filtered = includeDrafts ? localParsed : localParsed.filter((a: any) => !a.isDraft);
                return setCORSHeaders(NextResponse.json(filtered));
              }
            }
          } catch {}
        }
        data = agentItems.map(d => {
          let parsedAb: any = {};
          try { parsedAb = d.abilities ? JSON.parse(d.abilities) : {}; } catch {}
          const meta = parsedAb._meta || {};
          return {
            ...d,
            determinant: meta.determinant || d.name,
            fullPortrait: meta.fullPortrait || null,
            abilities: parsedAb.slots || parsedAb,
          };
        });
        break;
      }
      case 'maps': {
        const mapItems = await prisma.map.findMany({ where: includeDrafts ? undefined : { isDraft: false } });
        if (mapItems.length === 0) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const appControlPath = path.resolve(process.cwd(), '../AppControl/data/maps.json');
            const localPath = path.resolve(process.cwd(), 'public/data/maps.json');
            const targetPath = fs.existsSync(appControlPath) ? appControlPath : localPath;
            if (fs.existsSync(targetPath)) {
              const raw = fs.readFileSync(targetPath, 'utf-8');
              const localParsed = JSON.parse(raw);
              if (Array.isArray(localParsed) && localParsed.length > 0) {
                const filtered = includeDrafts ? localParsed : localParsed.filter((m: any) => !m.isDraft);
                return setCORSHeaders(NextResponse.json(filtered));
              }
            }
          } catch {}
        }
        data = mapItems;
        break;
      }
      case 'banners':
        data = await prisma.banner.findMany({ where: includeDrafts ? undefined : { isDraft: false } });
        break;
      case 'quests':
        data = await (prisma as any).quest.findMany({
          orderBy: { createdAt: 'desc' },
        });
        break;
      case 'rewards': {
        const rewardsList = await (prisma as any).levelReward.findMany({
          where: {
            OR: [
              { id: { startsWith: 'reward_lvl_' } },
              { rewardKey: { startsWith: 'title_' } },
              { rewardKey: { startsWith: 'badge_initie' } },
              { rewardKey: { startsWith: 'badge_sniper' } },
              { rewardKey: { in: ['matrix', 'hologram_grid', 'gold_border', 'cyber_glow', 'stardust', 'neon_pulse', 'dragon_spirit'] } }
            ]
          },
          orderBy: { level: 'asc' },
        });
        if (rewardsList.length === 0) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const appControlPath = path.resolve(process.cwd(), '../AppControl/data/rewards.json');
            const localPath = path.resolve(process.cwd(), 'public/data/rewards.json');
            const targetPath = fs.existsSync(appControlPath) ? appControlPath : localPath;
            if (fs.existsSync(targetPath)) {
              return setCORSHeaders(NextResponse.json(JSON.parse(fs.readFileSync(targetPath, 'utf-8'))));
            }
          } catch {}
        }
        data = rewardsList;
        break;
      }
      case 'gamemodes': {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const appControlPath = path.resolve(process.cwd(), '../AppControl/data/gamemodes.json');
          const localPath = path.resolve(process.cwd(), 'public/data/gamemodes.json');
          const targetPath = fs.existsSync(appControlPath) ? appControlPath : localPath;
          if (fs.existsSync(targetPath)) {
            const raw = fs.readFileSync(targetPath, 'utf-8');
            data = JSON.parse(raw);
            return setCORSHeaders(NextResponse.json(data));
          }
        } catch (readErr) {
          console.warn('[CMS gamemodes read error]', readErr);
        }
        data = [];
        break;
      }
      case 'badges': {
        const rewards = await (prisma as any).levelReward.findMany({
          where: { type: 'badge' },
          orderBy: { level: 'asc' },
        });
        if (rewards.length === 0) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const appControlPath = path.resolve(process.cwd(), '../AppControl/data/badges.json');
            const localPath = path.resolve(process.cwd(), 'public/data/badges.json');
            const targetPath = fs.existsSync(appControlPath) ? appControlPath : localPath;
            if (fs.existsSync(targetPath)) {
              return setCORSHeaders(NextResponse.json(JSON.parse(fs.readFileSync(targetPath, 'utf-8'))));
            }
          } catch {}
        }
        data = rewards.map((r: any) => {
          let meta: any = {};
          try { meta = JSON.parse(r.description); } catch { meta = { description: r.description }; }
          return {
            id: r.rewardKey || r.id,
            label: r.title,
            description: meta.description || r.description,
            iconType: meta.iconType || 'svg',
            iconName: meta.iconName || 'IconBadgeRecrue',
            imageUrl: meta.imageUrl || null,
            colorClass: meta.colorClass || 'text-amber-400',
            bgClass: meta.bgClass || 'bg-amber-500/10',
            borderClass: meta.borderClass || 'border-amber-400/30',
            glowClass: meta.glowClass || 'shadow-[0_0_12px_rgba(251,191,36,0.25)]',
            minLevel: r.level,
            isExclusive: false,
          };
        });
        break;
      }
      case 'cosmetics': {
        const rewards = await (prisma as any).levelReward.findMany({
          where: { type: { in: ['cosmetic', 'banner_effect', 'card_border'] } },
          orderBy: { level: 'asc' },
        });
        if (rewards.length === 0) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const appControlPath = path.resolve(process.cwd(), '../AppControl/data/cosmetics.json');
            const localPath = path.resolve(process.cwd(), 'public/data/cosmetics.json');
            const targetPath = fs.existsSync(appControlPath) ? appControlPath : localPath;
            if (fs.existsSync(targetPath)) {
              return setCORSHeaders(NextResponse.json(JSON.parse(fs.readFileSync(targetPath, 'utf-8'))));
            }
          } catch {}
        }
        data = rewards.map((r: any) => {
          let meta: any = {};
          try { meta = JSON.parse(r.description); } catch { meta = { desc: r.description }; }
          return {
            id: r.rewardKey || r.id,
            name: r.title,
            type: r.type,
            minLevel: r.level,
            desc: meta.desc || r.description,
            color: r.badgeColor || '#ff4655',
            cssRules: meta.cssRules || '',
            r2Key: meta.r2Key || null,
          };
        });
        break;
      }
      default:
        return setCORSHeaders(NextResponse.json({ error: 'Entity not found' }, { status: 404 }));
    }
    return setCORSHeaders(NextResponse.json(data));
  } catch (error: any) {
    return setCORSHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  
  try {
    const body = await request.json();
    let data;

    switch (entity) {
      case 'news':
        data = await prisma.news.create({
          data: {
            title: body.title,
            nodes: JSON.stringify(body.nodes || []),
            currentNodeId: body.currentNodeId || null,
            isDraft: body.isDraft ?? true,
          }
        });
        break;
      case 'agents': {
        const agentAbilities = body.abilities || {};
        const metaAbilities = {
          slots: agentAbilities,
          _meta: {
            determinant: body.determinant || body.name,
            fullPortrait: body.fullPortrait || null,
          }
        };
        data = await prisma.agent.create({
          data: {
            uuid: body.uuid || `custom-${Date.now()}`,
            name: body.name,
            role: body.role || "Flex",
            iconUrl: body.iconUrl || null,
            abilities: JSON.stringify(metaAbilities),
            isDraft: body.isDraft ?? true,
          }
        });
        break;
      }
      case 'maps':
        data = await prisma.map.create({
          data: {
            uuid: body.uuid,
            name: body.name,
            splashUrl: body.splashUrl || null,
            listViewIcon: body.listViewIcon || null,
            displayIcon: body.displayIcon || null,
            tacticalType: body.tacticalType || null,
            accent: body.accent || null,
            bgGradient: body.bgGradient || null,
            isDraft: body.isDraft ?? true,
          }
        });
        break;
      case 'banners':
        data = await prisma.banner.create({
          data: {
            name: body.name,
            wideArtUrl: body.wideArtUrl,
            isDraft: body.isDraft ?? true,
          }
        });
        break;
      case 'quests': {
        const slug = (body.slug || body.title || `quest_${Date.now()}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 40);
        data = await (prisma as any).quest.create({
          data: {
            slug,
            title: body.title,
            description: body.description,
            category: body.category || 'combat',
            targetStat: body.targetStat || 'kills',
            targetValue: Number(body.targetValue) || 1,
            xpReward: Number(body.xpReward) || 100,
            minRankTier: Number(body.minRankTier) || 0,
            maxRankTier: Number(body.maxRankTier) || 99,
            minSpi: Number(body.minSpi) || 0,
            maxSpi: Number(body.maxSpi) || 1000,
            isActive: body.isActive ?? true,
          }
        });
        break;
      }
      case 'rewards': {
        data = await (prisma as any).levelReward.create({
          data: {
            level: Number(body.level) || 1,
            type: body.type || 'badge',
            title: body.title,
            description: body.description || '',
            rewardKey: body.rewardKey || '',
            icon: body.icon || '🏆',
            badgeColor: body.badgeColor || '#ff4655',
            isActive: body.isActive ?? true,
          }
        });
        break;
      }
      case 'badges': {
        const metaPayload = {
          description: body.description || body.label || body.name,
          iconType: body.iconType || (body.imageUrl ? "image" : "svg"),
          iconName: body.iconName || 'IconBadgeRecrue',
          imageUrl: body.imageUrl || null,
          colorClass: body.colorClass || "text-amber-400",
          bgClass: body.bgClass || "bg-amber-500/10",
          borderClass: body.borderClass || "border-amber-400/30",
          glowClass: body.glowClass || "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
        };
        const rewardKey = body.id || body.rewardKey || `badge_${Date.now()}`;
        const existing = await (prisma as any).levelReward.findFirst({
          where: { OR: [{ rewardKey }, { title: body.label || body.title }] }
        });
        if (existing) {
          data = await (prisma as any).levelReward.update({
            where: { id: existing.id },
            data: {
              level: Number(body.minLevel) || Number(body.level) || existing.level,
              type: 'badge',
              title: body.label || body.title || body.name || existing.title,
              description: JSON.stringify(metaPayload),
              badgeColor: body.color || body.badgeColor || existing.badgeColor,
              isActive: body.isActive ?? true,
            }
          });
        } else {
          data = await (prisma as any).levelReward.create({
            data: {
              level: Number(body.minLevel) || Number(body.level) || 1,
              type: 'badge',
              title: body.label || body.title || body.name || 'Badge',
              description: JSON.stringify(metaPayload),
              rewardKey,
              icon: body.icon || '🛡️',
              badgeColor: body.color || body.badgeColor || '#f59e0b',
              isActive: body.isActive ?? true,
            }
          });
        }
        break;
      }
      case 'cosmetics': {
        const descriptionContent = (body.cssRules || body.r2Key)
          ? JSON.stringify({ desc: body.desc || body.name, cssRules: body.cssRules, r2Key: body.r2Key })
          : (body.desc || body.name);
        const rewardKey = body.id || body.rewardKey || `cosmetic_${Date.now()}`;
        const existing = await (prisma as any).levelReward.findFirst({
          where: { OR: [{ rewardKey }, { title: body.name || body.title }] }
        });
        if (existing) {
          data = await (prisma as any).levelReward.update({
            where: { id: existing.id },
            data: {
              level: Number(body.minLevel) || Number(body.level) || existing.level,
              type: body.type || existing.type,
              title: body.name || body.title || existing.title,
              description: descriptionContent,
              badgeColor: body.color || body.badgeColor || existing.badgeColor,
              isActive: body.isActive ?? true,
            }
          });
        } else {
          data = await (prisma as any).levelReward.create({
            data: {
              level: Number(body.minLevel) || Number(body.level) || 1,
              type: body.type || 'banner_effect',
              title: body.name || body.title || 'Cosmétique',
              description: descriptionContent,
              rewardKey,
              icon: body.icon || '✨',
              badgeColor: body.color || body.badgeColor || '#38bdf8',
              isActive: body.isActive ?? true,
            }
          });
        }
        break;
      }
      default:
        return setCORSHeaders(NextResponse.json({ error: 'Entity not found' }, { status: 404 }));
    }
    
    // Parse back for response
    if (data && (data as any).nodes) (data as any).nodes = JSON.parse((data as any).nodes);
    if (data && (data as any).abilities) (data as any).abilities = JSON.parse((data as any).abilities);
    
    return setCORSHeaders(NextResponse.json(data));
  } catch (error: any) {
    return setCORSHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
