import { createContext } from "react";
import { Character } from "@/util/types";

interface CharacterContextType {
  characters: Character[];
  fetchCharacters: () => Promise<void>;
  charactersLoading: boolean;
  races: any[] | null;
  fetchRaces: () => Promise<void>;
  classTypes: any[] | null;
  fetchClasses: () => Promise<void>;
}

const CharacterContext = createContext<CharacterContextType | null>(null);

export default CharacterContext;
