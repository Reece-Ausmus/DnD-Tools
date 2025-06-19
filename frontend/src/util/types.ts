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

export interface Map {
  id: number;
  name: string;
  campaign_id: number;
}

//
// Types for map/canvas
//
export interface Point {
  x: number;
  y: number;
}
export interface Marker {
  id: number;
  pos: Point;
  color: string;
}
export interface Line {
  id: number;
  start: Point;
  end: Point;
  color: string;
}
// Selection Type
interface SelectionBase {
  readonly type: "marker" | "line";
}
export interface MarkerSelection extends SelectionBase {
  readonly type: "marker";
  marker: Marker;
}
export interface LineSelection extends SelectionBase {
  readonly type: "line";
  index: number;
}
export type Selection = MarkerSelection | LineSelection;
