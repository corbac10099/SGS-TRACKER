// Script de seed pour insérer les défis de base dans la table Quest
// Usage : npx tsx prisma/seed-quests.ts

import prisma from "../src/lib/prisma";

const QUESTS = [
  // -- Combat --
  { slug: "kills_5", title: "Éliminateur", description: "Réalise 5 éliminations en une partie", category: "combat", targetStat: "kills", targetValue: 5, xpReward: 75, minRankTier: 0, maxRankTier: 99 },
  { slug: "kills_15", title: "Machine à Frags", description: "Réalise 15 éliminations en une partie", category: "combat", targetStat: "kills", targetValue: 15, xpReward: 150, minRankTier: 6, maxRankTier: 99 },
  { slug: "kills_25", title: "Rampage", description: "Réalise 25 éliminations en une partie", category: "combat", targetStat: "kills", targetValue: 25, xpReward: 250, minRankTier: 12, maxRankTier: 99 },
  { slug: "firstblood_1", title: "Premier Sang", description: "Réalise le premier kill d'un round", category: "combat", targetStat: "firstBloods", targetValue: 1, xpReward: 50, minRankTier: 0, maxRankTier: 99 },
  { slug: "firstblood_3", title: "Chasseur de Têtes", description: "Réalise 3 premiers sangs dans une partie", category: "combat", targetStat: "firstBloods", targetValue: 3, xpReward: 125, minRankTier: 6, maxRankTier: 99 },
  { slug: "ace_1", title: "Ace !", description: "Réalise un Ace (5 kills dans un round)", category: "combat", targetStat: "aces", targetValue: 1, xpReward: 300, minRankTier: 9, maxRankTier: 99 },
  { slug: "clutch_1", title: "Clutch Master", description: "Gagne un 1vX clutch", category: "combat", targetStat: "clutches", targetValue: 1, xpReward: 200, minRankTier: 9, maxRankTier: 99 },

  // -- Précision --
  { slug: "hs_30", title: "Viseur Précis", description: "Atteins 30% de tirs à la tête dans une partie", category: "precision", targetStat: "headshotPercent", targetValue: 30, xpReward: 100, minRankTier: 0, maxRankTier: 99 },
  { slug: "hs_50", title: "Tireur d'Élite", description: "Atteins 50% de tirs à la tête dans une partie", category: "precision", targetStat: "headshotPercent", targetValue: 50, xpReward: 200, minRankTier: 12, maxRankTier: 99 },
  { slug: "adr_150", title: "Dégâts Lourds", description: "Atteins 150 ADR dans une partie", category: "precision", targetStat: "adr", targetValue: 150, xpReward: 125, minRankTier: 6, maxRankTier: 99 },
  { slug: "adr_200", title: "Destructeur", description: "Atteins 200 ADR dans une partie", category: "precision", targetStat: "adr", targetValue: 200, xpReward: 250, minRankTier: 15, maxRankTier: 99 },

  // -- Tactique --
  { slug: "win_1", title: "Victorieux", description: "Gagne une partie compétitive", category: "tactical", targetStat: "wins", targetValue: 1, xpReward: 100, minRankTier: 0, maxRankTier: 99 },
  { slug: "win_3", title: "Série Gagnante", description: "Gagne 3 parties dans la journée", category: "tactical", targetStat: "dailyWins", targetValue: 3, xpReward: 300, minRankTier: 6, maxRankTier: 99 },
  { slug: "flawless_1", title: "Round Parfait", description: "Gagne un round sans aucune mort dans l'équipe", category: "tactical", targetStat: "flawlessRounds", targetValue: 1, xpReward: 75, minRankTier: 0, maxRankTier: 99 },
  { slug: "flawless_3", title: "Perfection Tactique", description: "Gagne 3 rounds parfaits dans une partie", category: "tactical", targetStat: "flawlessRounds", targetValue: 3, xpReward: 175, minRankTier: 9, maxRankTier: 99 },
  { slug: "mvp_1", title: "MVP", description: "Obtiens le titre de MVP d'une partie", category: "tactical", targetStat: "mvp", targetValue: 1, xpReward: 200, minRankTier: 6, maxRankTier: 99 },

  // -- Social --
  { slug: "play_match_1", title: "Joueur Actif", description: "Joue au moins une partie aujourd'hui", category: "social", targetStat: "matchesPlayed", targetValue: 1, xpReward: 50, minRankTier: 0, maxRankTier: 99 },
  { slug: "play_match_3", title: "Grinder", description: "Joue 3 parties dans la journée", category: "social", targetStat: "matchesPlayed", targetValue: 3, xpReward: 150, minRankTier: 0, maxRankTier: 99 },
  { slug: "play_match_5", title: "Marathon", description: "Joue 5 parties dans la journée", category: "social", targetStat: "matchesPlayed", targetValue: 5, xpReward: 250, minRankTier: 3, maxRankTier: 99 },

  // -- Agent --
  { slug: "agent_main", title: "One Trick", description: "Joue une partie avec ton agent principal", category: "agent", targetStat: "mainAgentMatch", targetValue: 1, xpReward: 75, minRankTier: 0, maxRankTier: 99 },
  { slug: "kd_positive", title: "K/D Positif", description: "Termine une partie avec un K/D supérieur à 1.0", category: "combat", targetStat: "kdPositive", targetValue: 1, xpReward: 100, minRankTier: 0, maxRankTier: 99 },
  { slug: "kd_2", title: "Domination", description: "Termine une partie avec un K/D supérieur à 2.0", category: "combat", targetStat: "kdOver2", targetValue: 1, xpReward: 200, minRankTier: 12, maxRankTier: 99 },
  { slug: "assists_10", title: "Équipier Modèle", description: "Réalise 10 assists dans une partie", category: "social", targetStat: "assists", targetValue: 10, xpReward: 100, minRankTier: 0, maxRankTier: 99 },
  { slug: "deaths_low_5", title: "Survivant", description: "Termine une partie avec moins de 5 morts", category: "tactical", targetStat: "lowDeaths", targetValue: 5, xpReward: 175, minRankTier: 9, maxRankTier: 99 },
  { slug: "spi_700", title: "Performance Élevée", description: "Atteins un SPI de 700+ dans une partie", category: "precision", targetStat: "spiScore", targetValue: 700, xpReward: 200, minRankTier: 15, maxRankTier: 99, minSpi: 500 },
  { slug: "spi_900", title: "SSS Grade", description: "Atteins un SPI de 900+ dans une partie", category: "precision", targetStat: "spiScore", targetValue: 900, xpReward: 400, minRankTier: 21, maxRankTier: 99, minSpi: 700 },
];

async function seed() {
  console.log("🎯 Insertion des défis quotidiens...");
  
  for (const quest of QUESTS) {
    await (prisma as any).quest.upsert({
      where: { slug: quest.slug },
      update: quest,
      create: { ...quest, isActive: true },
    });
  }

  console.log(`✅ ${QUESTS.length} défis insérés/mis à jour.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Erreur seed:", e);
  process.exit(1);
});
