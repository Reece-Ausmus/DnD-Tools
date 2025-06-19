import { Point, Marker, Line, Selection } from "@/util/types";

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
// if line is selected, draw with blue highlight
//
export const draw_selected_highlight = (
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
