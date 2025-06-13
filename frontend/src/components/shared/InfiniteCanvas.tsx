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
  activeDrawButton:
    | "place-marker"
    | "draw-lines"
    | "draw-box"
    | "dance-time"
    | "erase"
    | null;
  markerColor: string;
};

type Point = { x: number; y: number };
type Marker = { id: number; pos: Point; color: string };
type Line = { id: number; start: Point; end: Point; color: string };

// History types for the Undo feature
type HistoryEntry =
  | { type: "ADD_MARKER"; payload: { marker: Marker } }
  | { type: "DELETE_MARKER"; payload: { marker: Marker } }
  | { type: "ADD_LINE"; payload: { line: Line } }
  | { type: "DELETE_LINE"; payload: { line: Line } }
  | {
      type: "MOVE_MARKER";
      payload: { oldPos: Point; newPos: Point; marker: Marker };
    };

// Selection Type
type Selection =
  | { type: "marker"; marker: Marker }
  | { type: "line"; index: number };

const InfiniteCanvas: React.FC<MapPageProps> = ({
  activeDrawButton,
  markerColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  const markers = useRef<Marker[]>([]);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const draggingMarker = useRef<Marker | null>(null);
  const isShiftDown = useRef<boolean>(false);
  const highlightedVertex = useRef<Point | null>(null);
  const lastMousePos = useRef<Point | null>(null);
  const lines = useRef<Line[]>([]);
  const lineDrawingStart = useRef<Point | null>(null);
  const history = useRef<HistoryEntry[]>([]);
  const MAX_HISTORY_LENGTH = 100;
  const dragStartMarker = useRef<Marker | null>(null);
  const dragStartMarkerPos = useRef<Point | null>(null);
  const hasMovedMarker = useRef<boolean>(false);
  const isErasing = useRef<boolean>(false);

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
    markers.current.forEach((marker) => {
      const { x, y } = marker.pos;
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
      if (
        selectedObject.current?.type === "marker" &&
        selectedObject.current.marker === marker
      ) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    });
    ctx.restore();
  };

  // pointFromKey removed

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

    const eraseAtPoint = (worldX: number, worldY: number) => {
      // Check for markers first
      const markerIndex = markers.current.findIndex((marker) => {
        const markerCenterX = marker.pos.x + gridSize / 2;
        const markerCenterY = marker.pos.y + gridSize / 2;
        const markerRadius = gridSize / 4;
        const distance = Math.sqrt(
          (worldX - markerCenterX) ** 2 + (worldY - markerCenterY) ** 2
        );
        return distance <= markerRadius;
      });

      if (markerIndex !== -1) {
        const [deletedMarker] = markers.current.splice(markerIndex, 1);
        addHistoryEntry({
          type: "DELETE_MARKER",
          payload: { marker: deletedMarker },
        });
        if (
          selectedObject.current?.type === "marker" &&
          selectedObject.current.marker.id === deletedMarker.id
        ) {
          selectedObject.current = null;
        }
        draw();
        return;
      }

      const eraseThreshold = 5 / s.scale;
      const lineIndex = lines.current.findIndex((line) =>
        isPointOnLine({ x: worldX, y: worldY }, line, eraseThreshold)
      );

      if (lineIndex !== -1) {
        const [deletedLine] = lines.current.splice(lineIndex, 1);
        addHistoryEntry({
          type: "DELETE_LINE",
          payload: { line: deletedLine }, // V&@H payload might change with refactor
        });
        // V&@H check uses line index logic
        if (
          selectedObject.current?.type === "line" &&
          selectedObject.current.index >= lineIndex
        ) {
          // Deselect or update index if needed. Deselecting is simplest.
          selectedObject.current = null;
        }
        draw();
      }
    };

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
      hasMovedMarker.current = false;

      const isLineDrawingMode =
        isShiftDown.current || activeDrawButton === "draw-lines";
      const isMarkerPlaceMode = activeDrawButton === "place-marker";

      if (activeDrawButton === "erase") {
        isErasing.current = true; // set isErasing true when mouse down
        selectedObject.current = null; // deselect current when erasing
        const rect = canvas.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - s.offsetX) / s.scale;
        const worldY = (e.clientY - rect.top - s.offsetY) / s.scale;
        eraseAtPoint(worldX, worldY); // Erase on initial click
        e.stopPropagation(); // Prevent other handlers
        return;
      }

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
        // Find marker at this position
        const markerAt = markers.current.find(
          (m) => m.pos.x === gridX && m.pos.y === gridY
        );
        if (markerAt) {
          dragStartMarker.current = markerAt;
          dragStartMarkerPos.current = { ...markerAt.pos };
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

      // erase at spot under moving mouse
      if (isErasing.current) {
        const rect = canvas.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - s.offsetX) / s.scale;
        const worldY = (e.clientY - rect.top - s.offsetY) / s.scale;
        eraseAtPoint(worldX, worldY);
        return;
      }

      // hightlight nearest vertex if in line drawing mode
      if (isLineDrawingMode && !s.isDragging && !draggingMarker.current) {
        updateHighlight(e.clientX, e.clientY);
      } else if (highlightedVertex.current) {
        clearHighlight();
      }

      const moved =
        Math.abs(e.clientX - dragStart.current.x) > 2 ||
        Math.abs(e.clientY - dragStart.current.y) > 2;
      if (dragStartMarker.current && !draggingMarker.current && moved) {
        draggingMarker.current = dragStartMarker.current;
        selectedObject.current = null;
      }

      if (draggingMarker.current) {
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;
        const x = (mouseX - s.offsetX) / s.scale;
        const y = (mouseY - s.offsetY) / s.scale;
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;
        // Only move if new position and no marker there
        if (
          (draggingMarker.current.pos.x !== gridX ||
            draggingMarker.current.pos.y !== gridY) &&
          !markers.current.some((m) => m.pos.x === gridX && m.pos.y === gridY)
        ) {
          // Update marker position
          draggingMarker.current.pos = { x: gridX, y: gridY };
          hasMovedMarker.current = true;
          draw();
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

      // set isErasing to false when mouse lifted
      if (isErasing.current) {
        isErasing.current = false;
        return;
      }

      if (
        dragStartMarker.current &&
        draggingMarker.current &&
        hasMovedMarker.current
      ) {
        addHistoryEntry({
          type: "MOVE_MARKER",
          payload: {
            oldPos: dragStartMarkerPos.current!,
            newPos: { ...draggingMarker.current.pos },
            marker: draggingMarker.current,
          },
        });
        hasMovedMarker.current = false;
      } else if (isLineDrawingMode && !moved && highlightedVertex.current) {
        if (lineDrawingStart.current) {
          const newLine: Line = {
            id:
              lines.current.length > 0
                ? lines.current[lines.current.length - 1].id + 1
                : 1,
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
        // Find marker at this position
        const markerAt = markers.current.find(
          (m) => m.pos.x === gridX && m.pos.y === gridY
        );
        if (markerAt) {
          const markerCenterX = gridX + gridSize / 2;
          const markerCenterY = gridY + gridSize / 2;
          const markerRadius = gridSize / 4;
          const distance = Math.sqrt(
            (mouseWorldX - markerCenterX) ** 2 +
              (mouseWorldY - markerCenterY) ** 2
          );
          if (distance <= markerRadius) {
            selectedObject.current = { type: "marker", marker: markerAt };
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
            // Only add marker if not present at this position
            if (
              !markers.current.some(
                (m) => m.pos.x === gridX && m.pos.y === gridY
              )
            ) {
              const newMarker: Marker = {
                id:
                  markers.current.length > 0
                    ? markers.current[markers.current.length - 1].id + 1
                    : 1,
                pos: { x: gridX, y: gridY },
                color: markerColor,
              };
              markers.current.push(newMarker);
              addHistoryEntry({
                type: "ADD_MARKER",
                payload: { marker: newMarker },
              });
            }
          }
        }
      }

      draggingMarker.current = null;
      dragStartMarker.current = null;
      s.isDragging = false;
      hasMovedMarker.current = false;
      dragStartMarkerPos.current = null;
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
          markers.current.pop();
          break;
        case "DELETE_MARKER":
          markers.current.push(lastAction.payload.marker);
          break;
        case "ADD_LINE":
          lines.current.pop();
          break;
        case "DELETE_LINE":
          lines.current.push(lastAction.payload.line);
          break;
        case "MOVE_MARKER": {
          const { oldPos, newPos, marker } = lastAction.payload;
          const markerToUpdate = markers.current.find(
            (m) => m.id === marker.id
          );
          if (markerToUpdate) {
            markerToUpdate.pos = oldPos;
          }
        }
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
          const marker = selectedObject.current.marker;
          const idx = markers.current.indexOf(marker);
          if (idx !== -1) {
            markers.current.splice(idx, 1);
            addHistoryEntry({
              type: "DELETE_MARKER",
              payload: { marker },
            });
          }
        } else if (selectedObject.current.type === "line") {
          const { index } = selectedObject.current;
          const deletedLine = lines.current[index];
          if (deletedLine) {
            lines.current.splice(index, 1);
            addHistoryEntry({
              type: "DELETE_LINE",
              payload: { line: deletedLine },
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

    // dynamic cursor changing
    if (activeDrawButton === "erase") {
      canvas.style.cursor = "crosshair";
    } else if (s.isDragging) {
      canvas.style.cursor = "grabbing";
    } else if (
      activeDrawButton === "place-marker" ||
      activeDrawButton === "draw-lines"
    ) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "grab";
    }

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
  }, [activeDrawButton, markerColor]);

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
