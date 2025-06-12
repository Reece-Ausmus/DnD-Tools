import React, { useRef, useEffect } from "react";

// --- TYPES ---
interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

// statuses from Map.tsx
type MapPageProps = {
  activeDrawButton: "place-marker" | "draw-lines" | "draw-box" | null;
};

type Point = { x: number; y: number };
type Marker = { id: string; pos: Point; color: string };
type Line = { start: Point; end: Point; color: string };

// History types for the Undo feature
type HistoryEntry =
  | { type: "ADD_MARKER"; payload: { key: string } }
  | { type: "DELETE_MARKER"; payload: { key: string; marker: Marker } }
  | { type: "ADD_LINE"; payload: { line: Line } }
  | { type: "DELETE_LINE"; payload: { line: Line; index: number } }
  | {
      type: "MOVE_MARKER";
      payload: { oldKey: string; newKey: string; marker: Marker };
    };

// Selection Type
type Selection =
  | { type: "marker"; key: string }
  | { type: "line"; index: number };

const InfiniteCanvas: React.FC<MapPageProps> = ({ activeDrawButton }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  const markers = useRef<Map<string, Marker>>(new Map());
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const draggingMarker = useRef<string | null>(null);
  const isShiftDown = useRef<boolean>(false);
  const highlightedVertex = useRef<Point | null>(null);
  const lastMousePos = useRef<Point | null>(null);
  const lines = useRef<Line[]>([]);
  const lineDrawingStart = useRef<Point | null>(null);
  const history = useRef<HistoryEntry[]>([]);
  const MAX_HISTORY_LENGTH = 100;
  const dragStartMarkerKey = useRef<string | null>(null);

  const selectedObject = useRef<Selection | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { scale, offsetX, offsetY } = state.current;
    const { width, height } = ctx.canvas;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const gridSize = 50;
    ctx.strokeStyle = "#ccc";
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const endX = startX + width / scale + gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endY = startY + height / scale + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    }

    // Draw lines with selection highlight
    ctx.save();
    lines.current.forEach((line, index) => {
      if (
        selectedObject.current?.type === "line" &&
        selectedObject.current.index === index
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
    });
    ctx.restore();

    // Draw preview line
    if (lineDrawingStart.current && highlightedVertex.current) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.setLineDash([8 / scale, 4 / scale]);
      ctx.lineWidth = 3 / scale;
      ctx.beginPath();
      ctx.moveTo(lineDrawingStart.current.x, lineDrawingStart.current.y);
      ctx.lineTo(highlightedVertex.current.x, highlightedVertex.current.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw vertex highlight
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

    // Draw markers with selection highlight
    markers.current.forEach((marker, key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();

      if (
        selectedObject.current?.type === "marker" &&
        selectedObject.current.key === key
      ) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    });
    ctx.restore();
  };

  const pointFromKey = (key: string): Point => {
    if (!key || typeof key !== "string") {
      throw new Error("Invalid input: key must be a non-empty string.");
    }

    const parts = key.split(",");

    if (parts.length !== 2) {
      throw new Error(`Invalid key format: Expected "x,y" but got "${key}".`);
    }

    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);

    // Check if parseInt resulted in NaN (e.g., from "hello,world")
    if (isNaN(x) || isNaN(y)) {
      throw new Error(
        `Invalid key content: Could not parse numbers from "${key}".`
      );
    }

    const newPoint: Point = { x, y };
    return newPoint;
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
      draw();
    };
    window.addEventListener("resize", resize);
    resize();

    const addHistoryEntry = (entry: HistoryEntry) => {
      history.current.push(entry);
      if (history.current.length > MAX_HISTORY_LENGTH) {
        history.current.shift();
      }
    };

    const isPointOnLine = (
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

    const updateHighlight = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const worldX = (clientX - rect.left - s.offsetX) / s.scale;
      const worldY = (clientY - rect.top - s.offsetY) / s.scale;
      const nearestX = Math.round(worldX / gridSize) * gridSize;
      const nearestY = Math.round(worldY / gridSize) * gridSize;

      if (
        highlightedVertex.current?.x !== nearestX ||
        highlightedVertex.current?.y !== nearestY
      ) {
        highlightedVertex.current = { x: nearestX, y: nearestY };
        draw();
      }
    };

    const clearHighlight = () => {
      if (highlightedVertex.current) {
        highlightedVertex.current = null;
        draw();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      dragStart.current = { x: e.clientX, y: e.clientY };

      const isLineDrawingMode =
        isShiftDown.current || activeDrawButton === "draw-lines";
      const isMarkerPlaceMode = activeDrawButton === "place-marker";

      if (!isShiftDown.current) {
        const gridX =
          Math.floor(
            (e.clientX - canvas.getBoundingClientRect().left - s.offsetX) /
              s.scale /
              gridSize
          ) * gridSize;
        const gridY =
          Math.floor(
            (e.clientY - canvas.getBoundingClientRect().top - s.offsetY) /
              s.scale /
              gridSize
          ) * gridSize;
        const key = `${gridX},${gridY}`;
        if (markers.current.has(key)) {
          dragStartMarkerKey.current = key;
        } else {
          s.isDragging = true;
          s.lastX = e.clientX;
          s.lastY = e.clientY;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const isLineDrawingMode =
        isShiftDown.current || activeDrawButton === "draw-lines";
      const isMarkerPlaceMode = activeDrawButton === "place-marker";

      // hightlight nearest vertex if in line drawing mode
      if (isLineDrawingMode && !s.isDragging && !draggingMarker.current) {
        updateHighlight(e.clientX, e.clientY);
      } else if (highlightedVertex.current) {
        clearHighlight();
      }

      const moved =
        Math.abs(e.clientX - dragStart.current.x) > 2 ||
        Math.abs(e.clientY - dragStart.current.y) > 2;
      if (dragStartMarkerKey.current && !draggingMarker.current && moved) {
        draggingMarker.current = dragStartMarkerKey.current;
        selectedObject.current = null;
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
            draw();
          }
        }
        return;
      }

      if (!s.isDragging) return;
      s.offsetX += e.clientX - s.lastX;
      s.offsetY += e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      draw();
    };

    const onMouseUp = (e: MouseEvent) => {
      const moved =
        Math.abs(e.clientX - dragStart.current.x) > 2 ||
        Math.abs(e.clientY - dragStart.current.y) > 2;

      const isLineDrawingMode =
        isShiftDown.current || activeDrawButton === "draw-lines";
      const isMarkerPlaceMode = activeDrawButton === "place-marker";

      if (dragStartMarkerKey.current && draggingMarker.current && moved) {
        const marker = markers.current.get(draggingMarker.current);
        if (marker) {
          addHistoryEntry({
            type: "MOVE_MARKER",
            payload: {
              oldKey: dragStartMarkerKey.current,
              newKey: draggingMarker.current,
              marker,
            },
          });
        }
      } else if (isLineDrawingMode && !moved && highlightedVertex.current) {
        if (lineDrawingStart.current) {
          const newLine: Line = {
            start: lineDrawingStart.current,
            end: highlightedVertex.current,
            color: "red",
          };
          lines.current.push(newLine);
          addHistoryEntry({ type: "ADD_LINE", payload: { line: newLine } });
          lineDrawingStart.current = null;
        } else {
          lineDrawingStart.current = highlightedVertex.current;
        }
      } else if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const mouseWorldX = (e.clientX - rect.left - s.offsetX) / s.scale;
        const mouseWorldY = (e.clientY - rect.top - s.offsetY) / s.scale;
        let didSelectSomething = false;

        const gridX = Math.floor(mouseWorldX / gridSize) * gridSize;
        const gridY = Math.floor(mouseWorldY / gridSize) * gridSize;
        const key = `${gridX},${gridY}`;
        if (markers.current.has(key)) {
          const markerCenterX = gridX + gridSize / 2;
          const markerCenterY = gridY + gridSize / 2;
          const markerRadius = gridSize / 4;
          const distance = Math.sqrt(
            (mouseWorldX - markerCenterX) ** 2 +
              (mouseWorldY - markerCenterY) ** 2
          );
          if (distance <= markerRadius) {
            selectedObject.current = { type: "marker", key };
            didSelectSomething = true;
          }
        }

        if (!didSelectSomething) {
          const clickThreshold = 5 / s.scale;
          for (let i = lines.current.length - 1; i >= 0; i--) {
            if (
              isPointOnLine(
                { x: mouseWorldX, y: mouseWorldY },
                lines.current[i],
                clickThreshold
              )
            ) {
              selectedObject.current = { type: "line", index: i };
              didSelectSomething = true;
              break;
            }
          }
        }
        if (!didSelectSomething && isMarkerPlaceMode) {
          if (selectedObject.current) {
            selectedObject.current = null;
          } else {
            const newMarker: Marker = {
              id: crypto.randomUUID(),
              pos: pointFromKey(key),
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            };
            markers.current.set(key, newMarker);
            addHistoryEntry({ type: "ADD_MARKER", payload: { key } });
          }
        }
      }

      draggingMarker.current = null;
      dragStartMarkerKey.current = null;
      s.isDragging = false;
      draw();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, s.scale * zoomFactor)
      );
      const actualZoomFactor = newScale / s.scale;
      s.offsetX = mouseX - (mouseX - s.offsetX) * actualZoomFactor;
      s.offsetY = mouseY - (mouseY - s.offsetY) * actualZoomFactor;
      s.scale = newScale;
      draw();
    };

    const handleUndo = () => {
      const lastAction = history.current.pop();
      if (!lastAction) return;

      switch (lastAction.type) {
        case "ADD_MARKER":
          markers.current.delete(lastAction.payload.key);
          break;
        case "DELETE_MARKER":
          markers.current.set(
            lastAction.payload.key,
            lastAction.payload.marker
          );
          break;
        case "ADD_LINE":
          lines.current.pop();
          break;
        case "DELETE_LINE":
          lines.current.splice(
            lastAction.payload.index,
            0,
            lastAction.payload.line
          );
          break;
        case "MOVE_MARKER":
          const { oldKey, newKey, marker } = lastAction.payload;
          markers.current.delete(newKey);
          markers.current.set(oldKey, marker);
          break;
      }
      selectedObject.current = null; // Deselect after undoing
      draw();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedObject.current
      ) {
        e.preventDefault();
        if (selectedObject.current.type === "marker") {
          const { key } = selectedObject.current;
          const deletedMarker = markers.current.get(key);
          if (deletedMarker) {
            markers.current.delete(key);
            addHistoryEntry({
              type: "DELETE_MARKER",
              payload: { key, marker: deletedMarker },
            });
          }
        } else if (selectedObject.current.type === "line") {
          const { index } = selectedObject.current;
          const deletedLine = lines.current[index];
          if (deletedLine) {
            lines.current.splice(index, 1);
            addHistoryEntry({
              type: "DELETE_LINE",
              payload: { line: deletedLine, index },
            });
          }
        }
        selectedObject.current = null;
        draw();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === "Escape") {
        if (lineDrawingStart.current) {
          lineDrawingStart.current = null;
        } else if (selectedObject.current) {
          selectedObject.current = null;
        }
        draw();
      }

      if (e.key === "Shift" && !isShiftDown.current) {
        isShiftDown.current = true;
        if (lastMousePos.current) {
          updateHighlight(lastMousePos.current.x, lastMousePos.current.y);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
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
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [activeDrawButton]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        cursor: "grab",
      }}
    />
  );
};

export default InfiniteCanvas;
