"use client";

import { useState, useRef } from "react";
import type { LobbyItem } from "@/app/api/lobbies/route";
import { VoiceManager } from "@/lib/voiceManager";

export interface VoiceState {
  activeVoiceLobby: LobbyItem | null;
  setActiveVoiceLobby: React.Dispatch<React.SetStateAction<LobbyItem | null>>;
  isInVoiceGlobal: boolean;
  setIsInVoiceGlobal: React.Dispatch<React.SetStateAction<boolean>>;
  isMicMutedGlobal: boolean;
  setIsMicMutedGlobal: React.Dispatch<React.SetStateAction<boolean>>;
  isMyVoiceSpeakingGlobal: boolean;
  setIsMyVoiceSpeakingGlobal: React.Dispatch<React.SetStateAction<boolean>>;
  voiceVolumeLevelGlobal: number;
  setVoiceVolumeLevelGlobal: React.Dispatch<React.SetStateAction<number>>;
  globalVoiceManagerRef: React.MutableRefObject<VoiceManager | null>;
}

/**
 * State vocal global qui persiste entre les vues (lobbies, profil, news, etc.)
 */
export function useVoiceState(): VoiceState {
  const [activeVoiceLobby, setActiveVoiceLobby] =
    useState<LobbyItem | null>(null);
  const [isInVoiceGlobal, setIsInVoiceGlobal] = useState<boolean>(false);
  const [isMicMutedGlobal, setIsMicMutedGlobal] = useState<boolean>(false);
  const [isMyVoiceSpeakingGlobal, setIsMyVoiceSpeakingGlobal] =
    useState<boolean>(false);
  const [voiceVolumeLevelGlobal, setVoiceVolumeLevelGlobal] =
    useState<number>(0);
  const globalVoiceManagerRef = useRef<VoiceManager | null>(null);

  return {
    activeVoiceLobby,
    setActiveVoiceLobby,
    isInVoiceGlobal,
    setIsInVoiceGlobal,
    isMicMutedGlobal,
    setIsMicMutedGlobal,
    isMyVoiceSpeakingGlobal,
    setIsMyVoiceSpeakingGlobal,
    voiceVolumeLevelGlobal,
    setVoiceVolumeLevelGlobal,
    globalVoiceManagerRef,
  };
}
