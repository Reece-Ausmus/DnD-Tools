export interface Character {
  id: string;
  name: string;
  gender: string;
  race: string;
  classType: string;
  level: number;
  username: string;
  speed: number;
  size: string;
  marker_color: string;
}

export interface Campaign {
  id: string;
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
  maps: Map[];
}

export interface Invite {
  id: string;
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
  id: string;
  name: string;
  owner_id: string;
  campaign_id: string;
  is_open: boolean;
}

//
// Types for map/canvas
//
export interface Point {
  x: number;
  y: number;
}
export interface Marker {
  id: string;
  pos: Point;
  color: string;
  size: string;
  characterId?: string; // Optional, for character markers
}
export interface Line {
  id: string;
  start: Point;
  end: Point;
  color: string;
}
export interface Circle {
  id: string;
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
}
// Selection Type
interface SelectionBase {
  readonly type: "marker" | "line" | "circle";
}
export interface MarkerSelection extends SelectionBase {
  readonly type: "marker";
  marker: Marker;
}
export interface LineSelection extends SelectionBase {
  readonly type: "line";
  index: number;
}
export interface CircleSelection extends SelectionBase {
  readonly type: "circle";
  index: number;
}
export type Selection = MarkerSelection | LineSelection | CircleSelection;
