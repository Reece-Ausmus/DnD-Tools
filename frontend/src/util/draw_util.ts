import { Point, Marker, Line, Selection, Character } from "@/util/types";
import { colord } from "colord";

// ======================
// Line drawing functions
// ======================

//
// Draw dotted preview line when user is creating a line.
//
export const preview_line = (
  ctx: CanvasRenderingContext2D,
  lineDrawingStart: Point,
  highlightedVertex: Point,
  scale: number,
  wallColor: string
) => {
  ctx.save();
  ctx.strokeStyle = wallColor;
  ctx.setLineDash([8 / scale, 4 / scale]);
  ctx.lineWidth = 3 / scale;
  ctx.beginPath();
  ctx.moveTo(lineDrawingStart.x, lineDrawingStart.y);
  ctx.lineTo(highlightedVertex.x, highlightedVertex.y);
  ctx.stroke();
  ctx.restore();
};

//
// Draw dotted preview line when user is creating a box.
//
export const preview_line_box = (
  ctx: CanvasRenderingContext2D,
  boxDrawingStart: Point,
  highlightedVertex: Point,
  scale: number,
  wallColor: string
) => {
  ctx.save();
  // horizontal line: (hv.x, hv.y) to (s.x, hv.y)
  const hLinePoint1: Point = {
    x: boxDrawingStart.x,
    y: highlightedVertex.y,
  };
  preview_line(ctx, hLinePoint1, highlightedVertex, scale, wallColor);
  // horizontal line 2: (s.x, s.y) to (hv.x, s.y)
  const hLinePoint2: Point = {
    x: highlightedVertex.x,
    y: boxDrawingStart.y,
  };
  preview_line(ctx, hLinePoint2, boxDrawingStart, scale, wallColor);
  // side line 1: (s.x, s.y) to (s.x, hv.y)
  const sideLinePoint1: Point = {
    x: boxDrawingStart.x,
    y: highlightedVertex.y,
  };
  preview_line(ctx, sideLinePoint1, boxDrawingStart, scale, wallColor);
  // side line 2: (hv.x, s.y) to (hv.x, hv.y)
  const sideLinePoint2: Point = {
    x: highlightedVertex.x,
    y: boxDrawingStart.y,
  };
  preview_line(ctx, sideLinePoint2, highlightedVertex, scale, wallColor);
  ctx.restore();
};

export const draw_circle_highlight_full = (
  ctx: CanvasRenderingContext2D,
  lineDrawingStart: Point,
  highlightedVertex: Point,
  scale: number,
  wallColor: string
) => {
  ctx.save();
  ctx.strokeStyle = wallColor;
  ctx.setLineDash([8 / scale, 4 / scale]);
  ctx.lineWidth = 3 / scale;

  // calculate radius
  const dx = highlightedVertex.x - lineDrawingStart.x;
  const dy = highlightedVertex.y - lineDrawingStart.y;
  const radius = Math.sqrt(dx * dx + dy * dy);

  // draw circle
  ctx.beginPath();
  ctx.arc(lineDrawingStart.x, lineDrawingStart.y, radius, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();
};

//
// if line is selected, draw with blue highlight
//
export const draw_selected_line_highlight = (
  ctx: CanvasRenderingContext2D,
  line: Line,
  index: number,
  selectedObject: Selection | null,
  scale: number
) => {
  if (
    selectedObject &&
    selectedObject.type === "line" &&
    selectedObject.index === index
  ) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 5 / scale;
  } else {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 3 / scale;
  }
  ctx.beginPath();
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.stroke();
};

// ========================
// vertex drawing functions
// ========================

export const draw_vertex_highlight = (
  ctx: CanvasRenderingContext2D,
  highlightedVertex: Point,
  scale: number,
  wallColor: string
) => {
  const highlightColor = colord(wallColor).alpha(0.5).toRgbString();
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  const radius = 8 / scale;
  ctx.arc(highlightedVertex.x, highlightedVertex.y, radius, 0, Math.PI * 2);
};

// ========================
// Marker drawing functions
// ========================

export const draw_marker_selection_highlight = (
  ctx: CanvasRenderingContext2D,
  marker: Marker,
  selectedObject: Selection | null,
  scale: number,
  gridSize: number
) => {
  const { x, y } = marker.pos;
  ctx.fillStyle = marker.color;
  ctx.beginPath();
  ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
  ctx.fill();
  if (
    selectedObject &&
    selectedObject.type === "marker" &&
    selectedObject.marker === marker
  ) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
  }
};

// ============================
// helper calculation functions
// ============================

//
// returns True if input point is within threshold distance to the line.
//
export const isPointOnLine = (
  point: Point,
  line: Line,
  threshold: number
): boolean => {
  const { start, end } = line;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const distSq = (point.x - start.x) ** 2 + (point.y - start.y) ** 2;
    return Math.sqrt(distSq) < threshold;
  }
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;
  const distSq = (point.x - closestX) ** 2 + (point.y - closestY) ** 2;
  return Math.sqrt(distSq) < threshold;
};

//
// returns true if two points have the same x and y values
//
export const samePoint = (point1: Point, point2: Point): boolean => {
  return point1.x == point2.x && point1.y == point2.y;
};

//
// returns true if playertoken not in markers array
//
export const uniqueMarker = (playerToken: Character, markers: Marker[]) => {
  for (const marker of markers) {
    if (marker.characterId === playerToken.id) {
      return false;
    }
  }

  return true;
};

//
// return marker object of marker matching charid in markers
//
export const markerFromCharId = (id: string, markers: Marker[]) => {
  for (const marker of markers) {
    if (marker.characterId === id) {
      return marker;
    }
  }

  return false;
};
