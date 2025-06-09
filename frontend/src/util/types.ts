export interface Character {
  id: number;
  name: string;
  gender: string;
  race: string;
  classType: string;
  level: number;
  username: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date?: string;
  meeting_time: string;
  meeting_day: string;
  meeting_frequency: string;
  char_count: number;
  dm: string;
  characters: Character[];
}

export interface Invite {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date?: string;
  meeting_time: string;
  meeting_day: string;
  meeting_frequency: string;
  dm: string;
}
