import { NextRequest, NextResponse } from "next/server";
import { fetchRiotLeaderboard, getDynamicRiotApiKey } from "@/lib/valorant/riotApi";
import { LeaderboardPlayerEntry } from "@/lib/valorant/types";

export const dynamic = "force-dynamic";

// UUID officiel de l'acte compétitif en cours de Valorant (Épisode 9 Acte 3 / Acte V)
const CURRENT_ACTIVE_ACT_ID = "8102cd81-43a0-d0d7-bd59-47b8fe9bed1b";

// Mock Fallback Leaderboard
const MOCK_LEADERBOARD: LeaderboardPlayerEntry[] = [
  { leaderboardRank: 1, puuid: "p1", gameName: "TenZ", tagLine: "SEN", rankedRating: 1124, numberOfWins: 148, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 2, puuid: "p2", gameName: "cNed", tagLine: "FUT", rankedRating: 1088, numberOfWins: 135, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 3, puuid: "p3", gameName: "Chronicle", tagLine: "FNC", rankedRating: 1045, numberOfWins: 129, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 4, puuid: "p4", gameName: "Derke", tagLine: "VIT", rankedRating: 994, numberOfWins: 118, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 5, puuid: "p5", gameName: "Aspas", tagLine: "LEV", rankedRating: 980, numberOfWins: 112, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 6, puuid: "p6", gameName: "Boaster", tagLine: "FNC", rankedRating: 942, numberOfWins: 106, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 7, puuid: "p7", gameName: "ScreaM", tagLine: "EDG", rankedRating: 915, numberOfWins: 98, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 8, puuid: "p8", gameName: "Cryocells", tagLine: "100T", rankedRating: 890, numberOfWins: 94, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 9, puuid: "p9", gameName: "Alfajer", tagLine: "FNC", rankedRating: 875, numberOfWins: 91, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
  { leaderboardRank: 10, puuid: "p10", gameName: "yay", tagLine: "BLEED", rankedRating: 860, numberOfWins: 88, tier: 27, tierName: "Radiant", tierIcon: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png" },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = (searchParams.get("region") || "eu").toLowerCase();
    const rawActId = searchParams.get("actId");
    const actId = rawActId && rawActId.includes("-") ? rawActId : CURRENT_ACTIVE_ACT_ID;

    const dynamicKey =
      request.headers.get("x-riot-dev-key") ||
      request.headers.get("x-riot-token") ||
      getDynamicRiotApiKey();

    // 1. Si une clé HenrikDev est active
    if (dynamicKey && dynamicKey.startsWith("HDEV-")) {
      try {
        const hRes = await fetch(
          `https://api.henrikdev.xyz/valorant/v1/leaderboard/${region}?api_key=${encodeURIComponent(dynamicKey)}`,
          {
            headers: { Authorization: dynamicKey, Accept: "application/json" },
            cache: "no-store",
          }
        );
        if (hRes.ok) {
          const hData = await hRes.json();
          const list = Array.isArray(hData) ? hData : hData?.data;
          if (Array.isArray(list) && list.length > 0) {
            const formatted: LeaderboardPlayerEntry[] = list.slice(0, 50).map((p: any, idx: number) => {
              const tier = p.tier || p.competitiveTier || 27;
              return {
                leaderboardRank: p.leaderboardRank || p.leaderboard_rank || idx + 1,
                puuid: p.puuid || `lb-${idx}`,
                gameName: p.gameName || p.name || p.PlayerCardID || "Anonyme",
                tagLine: p.tagLine || p.tag || "EU1",
                rankedRating: p.rankedRating || p.ranked_rating || p.rr || 1000,
                numberOfWins: p.numberOfWins || p.number_of_wins || p.games_won || 50,
                tier,
                tierName: tier >= 27 ? "Radiant" : "Immortal 3",
                tierIcon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
              };
            });
            return NextResponse.json({ region, players: formatted });
          }
        }
      } catch (hErr) {
        console.warn("[Leaderboard HenrikDev Error]:", hErr);
      }
    }

    // 2. Appel officiel Riot Games Leaderboard
    const realData = await fetchRiotLeaderboard(actId, region, 50, 0, dynamicKey);

    if (realData && Array.isArray(realData.players)) {
      const formatted: LeaderboardPlayerEntry[] = realData.players.map((p: any) => {
        const tier = p.competitiveTier || p.tier || 27;
        return {
          leaderboardRank: p.leaderboardRank,
          puuid: p.puuid,
          gameName: p.gameName || "Anonyme",
          tagLine: p.tagLine || "EU1",
          rankedRating: p.rankedRating,
          numberOfWins: p.numberOfWins,
          tier,
          tierName: tier >= 27 ? "Radiant" : "Immortal 3",
          tierIcon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
        };
      });
      return NextResponse.json({ region, players: formatted });
    }

    return NextResponse.json({ region, players: MOCK_LEADERBOARD });
  } catch (error: any) {
    return NextResponse.json({ region: "eu", players: MOCK_LEADERBOARD });
  }
}
