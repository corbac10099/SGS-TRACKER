import { prisma } from "@/lib/prisma";

export interface SgsLegalData {
  companyName: string;
  contactEmail: string;
  contactAddress: string;
  hostName: string;
  hostAddress: string;
  dbHost: string;
  storageHost: string;
  cguText: string;
  mentionsLegales: string;
  privacyPolicy: string;
  riotDisclaimer: string;
  updatedAt?: string;
}

export const DEFAULT_SGS_LEGAL: SgsLegalData = {
  companyName: "SGS (Smart Gaming Suite)",
  contactEmail: "contact@sgs.gg",
  contactAddress: "Paris, France",
  hostName: "Vercel Inc.",
  hostAddress: "440 N Barranca Ave #4133, Covina, CA 91723, USA",
  dbHost: "Neon Tech Inc., San Francisco, CA, USA",
  storageHost: "Cloudflare Inc., San Francisco, CA, USA",
  riotDisclaimer: `« Spycam et tout l’écosystème SGS » est un projet indépendant qui n’est pas approuvé par Riot Games et ne reflète pas les opinions ou les avis de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion des propriétés de Riot Games. Riot Games et toutes les propriétés associées sont des marques ou des marques déposées de Riot Games, Inc.`,
  mentionsLegales: `## 1. Éditeur de la Plateforme
Le site web et les services de l'écosystème SGS (Smart Gaming Suite), incluant l'application **Spycam** (Valorant Performance Tracker), sont édités par l'équipe **SGS**.
- **Contact électronique** : contact@sgs.gg
- **Responsable de la publication** : Équipe de développement SGS

## 2. Hébergement & Infrastructures Cloud
Les services SGS et Spycam sont hébergés et propulsés par des infrastructures internationales hautement sécurisées :
- **Hébergeur d'application Web & Edge** : Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA)
- **Base de Données Serverless** : Neon Tech Inc. (San Francisco, CA, USA)
- **Réseau CDN & Stockage Média** : Cloudflare Inc. (101 Townsend St, San Francisco, CA 94107, USA)
- **Passerelle Temps Réel & WebSockets** : Pusher Ltd (Londres, Royaume-Uni)

## 3. Propriété Intellectuelle
L'ensemble des éléments originaux constituant la plateforme SGS et l'application Spycam (code source, architecture logicielle, algorithmes de performance, interface graphique, design et fonctionnalités exclusives) sont la propriété exclusive de SGS.
Les ressources relatives au jeu VALORANT (logos, icônes d'agents, maps, sons officiels) sont la propriété intellectuelle de Riot Games, Inc.`,
  cguText: `## 1. Objet et Acceptation des Conditions
Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'accès et l'utilisation de l'écosystème **SGS (Smart Gaming Suite)** et de l'ensemble de ses applications et services connectés, incluant **Spycam** (Valorant Performance Tracker).
En accédant au service, en créant un compte SGS ou en utilisant le mode invité, l'utilisateur accepte sans réserve l'intégralité des présentes CGU.

## 2. Services Proposés
SGS met à disposition des joueurs d'e-sport et de jeux compétitifs des outils d'analyse statistique, de suivi de performance, de recherche de coéquipiers (LFG - Looking For Group) et de salons vocaux et écrits en temps réel.
L'accès aux fonctionnalités principales de Spycam et de SGS est gratuit.

## 3. Comptes Utilisateurs et Centralisation
- L'utilisateur peut créer un compte centralisé SGS par email/mot de passe, connexion Google OAuth ou liaison de son Riot ID.
- Le compte SGS est unique et donne accès à l'ensemble des services actuels et futurs de la plateforme.
- L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte.

## 4. Règles de Conduite & Tolérance Zéro Anti-Toxicité
La communauté SGS et Spycam repose sur le respect, le fair-play et la convivialité.
Sont strictement prohibés dans l'ensemble des espaces publics, salons de recherche, messages de chat et canaux vocaux :
- Les propos haineux, discriminatoires, racistes, sexistes, homophobes, xénophobes ou injurieux ;
- Le harcèlement, l'intimidation, les menaces ou le chantage sous toutes leurs formes ;
- La promotion ou l'utilisation de logiciels de triche (cheats, hacks, exploits de bugs non autorisés) ;
- L'usurpation d'identité ou la diffusion de données personnelles de tiers (doxxing).

## 5. Salons Vocaux, Chat en Direct & Modération Automatisée
- Les échanges textuels et vocaux dans les salons LFG font l'objet d'une analyse automatisée en temps réel destinée à détecter et bloquer les comportements toxiques et illicites.
- Les logs textuels et transcriptions vocales anonymisées peuvent être conservés temporairement dans les bases de données sécurisées SGS aux seules fins d'audit de sécurité et de modération.
- SGS se réserve le droit d'exclure, de suspendre ou de bannir définitivement tout utilisateur enfreignant les règles communautaires, sans préavis ni indemnité.

## 6. Disponibilité & Limitation de Responsabilité
SGS s'efforce de maintenir un accès continu à ses services 24h/24. Toutefois, le service est fourni "en l'état" (*as-is*) et SGS ne saurait être tenu responsable des indisponibilités temporaires résultant d'opérations de maintenance, de pannes réseau tierces ou de modifications des API de Riot Games.

## 7. Modifications des CGU & Droit Applicable
SGS se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions des services et de la réglementation. Les présentes conditions sont soumises au droit français et européen.`,
  privacyPolicy: `## 1. Collecte et Nature des Données
Dans le cadre de l'utilisation de SGS et Spycam, nous collectons un minimum de données strictement nécessaires au bon fonctionnement des services :
- **Données de Compte** : Adresse email, nom d'affichage, mot de passe chiffré (pour les comptes locaux), identifiant unique de compte.
- **Données de Jeu Publiques** : Riot ID (Pseudo#Tag), PUUID Riot, statistiques publiques de matchs et rangs obtenus via les API officielles.
- **Préférences Techniques** : Préférences de thème (sombre/clair), réglages audio (micro, sortie, suppression de bruit Krisp/RNNoise), stockées en base et/ou localement.
- **Données d'Audit Temporaires** : Messages de salon et transcriptions vocales aux fins de modération anti-toxicité.

## 2. Utilisation & Finalités des Données
Les données collectées sont utilisées exclusivement pour :
- Fournir les statistiques de jeu et calculer les indicateurs de performance personnalisés ;
- Assurer le fonctionnement des salons LFG, de l'audio WebRTC et de la communication entre joueurs ;
- Préserver la sécurité de la communauté par la modération automatisée ;
- Personnaliser l'expérience utilisateur (bannières, widgets, disposition du dashboard).

## 3. Partage & Tiers
SGS ne vend, ne loue et ne commercialise **AUCUNE** donnée personnelle à des tiers ou régies publicitaires.
Les données techniques transitent uniquement via nos partenaires d'infrastructure certifiés (Vercel, Neon DB, Cloudflare, Pusher).

## 4. Vos Droits (Conformité RGPD)
Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment des droits suivants :
- **Droit d'accès et d'exportation** de vos données ;
- **Droit de rectification** de votre email, mot de passe ou Riot ID lié ;
- **Droit à l'effacement définitif** : Vous pouvez supprimer votre compte et l'intégralité des données associées en un clic depuis l'espace Paramètres / Compte ou en contactant contact@sgs.gg.`,
};

export async function getSgsLegalSettings(): Promise<SgsLegalData> {
  try {
    const record = await (prisma as any).sgsLegalSettings.findUnique({
      where: { id: "sgs_default_legal" },
    });

    if (record) {
      return {
        companyName: record.companyName || DEFAULT_SGS_LEGAL.companyName,
        contactEmail: record.contactEmail || DEFAULT_SGS_LEGAL.contactEmail,
        contactAddress: record.contactAddress || DEFAULT_SGS_LEGAL.contactAddress,
        hostName: record.hostName || DEFAULT_SGS_LEGAL.hostName,
        hostAddress: record.hostAddress || DEFAULT_SGS_LEGAL.hostAddress,
        dbHost: record.dbHost || DEFAULT_SGS_LEGAL.dbHost,
        storageHost: record.storageHost || DEFAULT_SGS_LEGAL.storageHost,
        cguText: record.cguText || DEFAULT_SGS_LEGAL.cguText,
        mentionsLegales: record.mentionsLegales || DEFAULT_SGS_LEGAL.mentionsLegales,
        privacyPolicy: record.privacyPolicy || DEFAULT_SGS_LEGAL.privacyPolicy,
        riotDisclaimer: record.riotDisclaimer || DEFAULT_SGS_LEGAL.riotDisclaimer,
        updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
      };
    }

    const created = await (prisma as any).sgsLegalSettings.create({
      data: {
        id: "sgs_default_legal",
        companyName: DEFAULT_SGS_LEGAL.companyName,
        contactEmail: DEFAULT_SGS_LEGAL.contactEmail,
        contactAddress: DEFAULT_SGS_LEGAL.contactAddress,
        hostName: DEFAULT_SGS_LEGAL.hostName,
        hostAddress: DEFAULT_SGS_LEGAL.hostAddress,
        dbHost: DEFAULT_SGS_LEGAL.dbHost,
        storageHost: DEFAULT_SGS_LEGAL.storageHost,
        cguText: DEFAULT_SGS_LEGAL.cguText,
        mentionsLegales: DEFAULT_SGS_LEGAL.mentionsLegales,
        privacyPolicy: DEFAULT_SGS_LEGAL.privacyPolicy,
        riotDisclaimer: DEFAULT_SGS_LEGAL.riotDisclaimer,
      },
    });

    return {
      companyName: created.companyName,
      contactEmail: created.contactEmail,
      contactAddress: created.contactAddress,
      hostName: created.hostName,
      hostAddress: created.hostAddress,
      dbHost: created.dbHost,
      storageHost: created.storageHost,
      cguText: created.cguText,
      mentionsLegales: created.mentionsLegales,
      privacyPolicy: created.privacyPolicy,
      riotDisclaimer: created.riotDisclaimer,
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("[SGS Legal] Using fallback default legal settings:", err);
    return DEFAULT_SGS_LEGAL;
  }
}

export async function updateSgsLegalSettings(data: Partial<SgsLegalData>): Promise<SgsLegalData> {
  const updated = await (prisma as any).sgsLegalSettings.upsert({
    where: { id: "sgs_default_legal" },
    create: {
      id: "sgs_default_legal",
      companyName: data.companyName || DEFAULT_SGS_LEGAL.companyName,
      contactEmail: data.contactEmail || DEFAULT_SGS_LEGAL.contactEmail,
      contactAddress: data.contactAddress || DEFAULT_SGS_LEGAL.contactAddress,
      hostName: data.hostName || DEFAULT_SGS_LEGAL.hostName,
      hostAddress: data.hostAddress || DEFAULT_SGS_LEGAL.hostAddress,
      dbHost: data.dbHost || DEFAULT_SGS_LEGAL.dbHost,
      storageHost: data.storageHost || DEFAULT_SGS_LEGAL.storageHost,
      cguText: data.cguText || DEFAULT_SGS_LEGAL.cguText,
      mentionsLegales: data.mentionsLegales || DEFAULT_SGS_LEGAL.mentionsLegales,
      privacyPolicy: data.privacyPolicy || DEFAULT_SGS_LEGAL.privacyPolicy,
      riotDisclaimer: data.riotDisclaimer || DEFAULT_SGS_LEGAL.riotDisclaimer,
    },
    update: {
      companyName: data.companyName,
      contactEmail: data.contactEmail,
      contactAddress: data.contactAddress,
      hostName: data.hostName,
      hostAddress: data.hostAddress,
      dbHost: data.dbHost,
      storageHost: data.storageHost,
      cguText: data.cguText,
      mentionsLegales: data.mentionsLegales,
      privacyPolicy: data.privacyPolicy,
      riotDisclaimer: data.riotDisclaimer,
    },
  });

  return {
    companyName: updated.companyName,
    contactEmail: updated.contactEmail,
    contactAddress: updated.contactAddress,
    hostName: updated.hostName,
    hostAddress: updated.hostAddress,
    dbHost: updated.dbHost,
    storageHost: updated.storageHost,
    cguText: updated.cguText,
    mentionsLegales: updated.mentionsLegales,
    privacyPolicy: updated.privacyPolicy,
    riotDisclaimer: updated.riotDisclaimer,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
