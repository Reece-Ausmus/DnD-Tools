import React, { useRef, useEffect } from "react";

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

type Point = { x: number; y: number };

// --- MODIFICATION 1: Update the Line type ---
type Line = {
  start: Point;
  end: Point;
  color: string;
};
// --- END MODIFICATION ---

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  const markers = useRef<Map<string, { id: string; color: string }>>(new Map());
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const draggingMarker = useRef<string | null>(null);

  const isShiftDown = useRef<boolean>(false);
  const highlightedVertex = useRef<Point | null>(null);
  const lastMousePos = useRef<Point | null>(null);

  const lines = useRef<Line[]>([]);
  const lineDrawingStart = useRef<Point | null>(null);

  const draw = (
    ctx: CanvasRenderingContext2D,
    { scale, offsetX, offsetY }: CanvasState
  ) => {
    const { width, height } = ctx.canvas;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const gridSize = 50;
    // Draw grid
    ctx.strokeStyle = "#ccc";
    for (
      let x = Math.floor((-offsetX / scale) / gridSize) * gridSize;
      x < (-offsetX / scale) + width / scale;
      x += gridSize
    ) {
      for (
        let y = Math.floor((-offsetY / scale) / gridSize) * gridSize;
        y < (-offsetY / scale) + height / scale;
        y += gridSize
      ) {
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    }

    // Draw lines
    ctx.save();
    ctx.lineWidth = 3 / scale;
    
    // --- MODIFICATION 2: Use the color from the line object ---
    // 1. Draw all completed, persistent lines from the array
    lines.current.forEach(line => {
      ctx.strokeStyle = line.color; // Use the line's specific color
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
    });
    // --- END MODIFICATION ---
    
    // 2. Draw the temporary preview line if currently drawing
    if (lineDrawingStart.current && highlightedVertex.current) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.setLineDash([8 / scale, 4 / scale]);
        ctx.beginPath();
        ctx.moveTo(lineDrawingStart.current.x, lineDrawingStart.current.y);
        ctx.lineTo(highlightedVertex.current.x, highlightedVertex.current.y);
        ctx.stroke();
    }
    ctx.restore();

    // Draw highlight for nearest vertex
    if (highlightedVertex.current) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
      ctx.beginPath();
      const radius = 8 / scale;
      ctx.arc(
        highlightedVertex.current.x,
        highlightedVertex.current.y,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // Draw markers
    markers.current.forEach((marker, key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  useEffect(() => {
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 5;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = state.current;
    const gridSize = 50;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      draw(ctx, s);
    };
    window.addEventListener("resize", resize);
    resize();
    
    const updateHighlight = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const worldX = (clientX - rect.left - s.offsetX) / s.scale;
        const worldY = (clientY - rect.top - s.offsetY) / s.scale;
        const nearestX = Math.round(worldX / gridSize) * gridSize;
        const nearestY = Math.round(worldY / gridSize) * gridSize;
        
        if (highlightedVertex.current?.x !== nearestX || highlightedVertex.current?.y !== nearestY) {
            highlightedVertex.current = { x: nearestX, y: nearestY };
            draw(ctx, s);
        }
    };

    const clearHighlight = () => {
        if (highlightedVertex.current) {
            highlightedVertex.current = null;
            draw(ctx, s);
        }
    };

    const onMouseDown = (e: MouseEvent) => {
      dragStart.current = { x: e.clientX, y: e.clientY };

      if (!isShiftDown.current) {
        const gridX = Math.floor(((e.clientX - canvas.getBoundingClientRect().left) - s.offsetX) / s.scale / gridSize) * gridSize;
        const gridY = Math.floor(((e.clientY - canvas.getBoundingClientRect().top) - s.offsetY) / s.scale / gridSize) * gridSize;
        const key = `${gridX},${gridY}`;
        
        if (markers.current.has(key)) {
          draggingMarker.current = key;
        } else {
          s.isDragging = true;
          s.lastX = e.clientX;
          s.lastY = e.clientY;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (isShiftDown.current && !s.isDragging && !draggingMarker.current) {
          updateHighlight(e.clientX, e.clientY);
      } else if (highlightedVertex.current) {
          clearHighlight();
      }
      if (draggingMarker.current) {
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;
        const x = (mouseX - s.offsetX) / s.scale;
        const y = (mouseY - s.offsetY) / s.scale;
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;
        const newKey = `${gridX},${gridY}`;
        if (newKey !== draggingMarker.current && !markers.current.has(newKey)) {
          const markerData = markers.current.get(draggingMarker.current);
          if (markerData) {
            markers.current.delete(draggingMarker.current);
            markers.current.set(newKey, markerData);
            draggingMarker.current = newKey;
            draw(ctx, s);
          }
        }
        return;
      }
      if (!s.isDragging) return;
      s.offsetX += e.clientX - s.lastX;
      s.offsetY += e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      draw(ctx, s);
    };

    const onMouseUp = (e: MouseEvent) => {
      const moved = Math.abs(e.clientX - dragStart.current.x) > 2 || Math.abs(e.clientY - dragStart.current.y) > 2;
      
      if (isShiftDown.current && !moved && highlightedVertex.current) {
        if (lineDrawingStart.current) {
          // --- MODIFICATION 3: Add the color when creating the line object ---
          lines.current.push({
            start: lineDrawingStart.current,
            end: highlightedVertex.current,
            color: "red",
          });
          // --- END MODIFICATION ---
          lineDrawingStart.current = null;
        } else {
          lineDrawingStart.current = highlightedVertex.current;
        }
      } else if (!isShiftDown.current && !draggingMarker.current && !moved) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - s.offsetX) / s.scale;
        const y = (e.clientY - rect.top - s.offsetY) / s.scale;
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;
        const key = `${gridX},${gridY}`;
        if (markers.current.has(key)) {
          markers.current.delete(key);
        } else {
          markers.current.set(key, { id: crypto.randomUUID(), color: `hsl(${Math.random() * 360}, 70%, 50%)` });
        }
      }

      draggingMarker.current = null;
      s.isDragging = false;
      draw(ctx, s);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const { scale, offsetX, offsetY } = s;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoomFactor));
      const actualZoomFactor = newScale / scale;
      s.offsetX = mouseX - (mouseX - offsetX) * actualZoomFactor;
      s.offsetY = mouseY - (mouseY - offsetY) * actualZoomFactor;
      s.scale = newScale;
      draw(ctx, s);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && lineDrawingStart.current) {
            lineDrawingStart.current = null;
            draw(ctx, s);
        }
        if (e.key === 'Shift' && !isShiftDown.current) {
            isShiftDown.current = true;
            if (lastMousePos.current) {
                updateHighlight(lastMousePos.current.x, lastMousePos.current.y);
            }
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = false;
        if (lineDrawingStart.current) {
          lineDrawingStart.current = null;
        }
        clearHighlight();
      }
    };
    
    const onMouseLeave = () => {
        lastMousePos.current = null;
        if (!lineDrawingStart.current) {
          clearHighlight();
        }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return ( <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }} /> );
};

export default InfiniteCanvas;