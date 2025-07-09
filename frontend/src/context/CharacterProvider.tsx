import { useState } from "react";
import CharacterContext from "./CharacterContext";
import { Character } from "@/util/types";

const CharacterProvider = ({ children }: { children: React.ReactNode }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [races, setRaces] = useState<any[] | null>(null);
  const [classTypes, setClassTypes] = useState<any[] | null>(null);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/character/get_characters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      setCharacters(data.characters);

      if (!response.ok)
        throw new Error(data.message || "Failed to get characters");
    } catch (err: any) {
      console.error(err);
    } finally {
      setCharactersLoading(false);
    }
  };

  const fetchRaces = async () => {
    try {
      const response = await fetch("/api/character/get_races", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get races.");
      }

      setRaces(data.races);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/character/get_classes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get classes.");
      }

      setClassTypes(data.classes);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <CharacterContext.Provider
      value={{
        characters,
        fetchCharacters,
        charactersLoading,
        races,
        fetchRaces,
        classTypes,
        fetchClasses,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

export default CharacterProvider;
