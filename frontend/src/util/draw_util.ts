//
// Types for canvas
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

//
// Line drawing functions
//

//
// Draw dotted preview line when user is creating a line
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
