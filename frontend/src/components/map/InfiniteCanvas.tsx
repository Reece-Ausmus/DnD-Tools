import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useSnackbar } from "@/context/SnackbarContext";

import { Point, Marker, Line, Selection, Character } from "@/util/types";
import {
  preview_line,
  isPointOnLine,
  draw_selected_line_highlight,
  draw_vertex_highlight,
  draw_marker_selection_highlight,
  preview_line_box,
  samePoint,
  uniqueMarker,
  markerFromCharId,
} from "@/util/draw_util";

// --- TYPES ---
interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

import type { Socket } from "socket.io-client";

// The API handle we will expose to the parent
export interface ChildHandle {
  centerGridOnPoint: (id: string) => void;
}

type MapPageProps = {
  activeDrawButton:
    | "place-marker"
    | "draw-lines"
    | "draw-box"
    | "draw-circle"
    | "dance-time"
    | "erase"
    | null;
  markerColor: string;
  wallColor: string;
  socket: Socket;
  mapId: string;
  getMapStateRef: React.MutableRefObject<
    (() => { markers: Marker[]; lines: Line[] }) | undefined
  >;
  isDM: boolean;
  isGridOn: boolean;
  characterId: string;
  isAxesOn: boolean;
  playerTokenSelected: Character | null;
};

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

const InfiniteCanvas = forwardRef<ChildHandle, MapPageProps>((props, ref) => {
  // 2. DESTRUCTURE PROPS INSIDE THE COMPONENT
  const {
    activeDrawButton,
    markerColor,
    wallColor,
    socket,
    mapId,
    getMapStateRef,
    isDM,
    isGridOn,
    characterId,
    isAxesOn,
    playerTokenSelected,
  } = props;

  // Provide access to current map state via ref
  useEffect(() => {
    getMapStateRef.current = () => ({
      markers: markers.current,
      lines: lines.current,
    });
    return () => {
      getMapStateRef.current = undefined;
    };
  }, []);
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
  const { showSnackbar } = useSnackbar();

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

    const gridColor = "#404040";
    const axisColor = "#6E6E6E";
    const normalLineWidth = 1.5 / scale;
    const axisLineWidth = 2.5 / scale;

    // Draw grid lines
    ctx.save();
    if (isGridOn) {
      // draw non-axis grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = normalLineWidth;
      ctx.beginPath();

      // Draw vertical lines
      for (let x = startX; x < endX; x += gridSize) {
        //if (x === 0) continue;
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      // Draw horizontal lines
      for (let y = startY; y < endY; y += gridSize) {
        //if (y === 0) continue;
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // draw x and y axis
    ctx.save();
    if (isAxesOn) {
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = axisLineWidth;
      ctx.beginPath();

      // draw y axis if in current view
      if (0 >= startX && 0 < endX) {
        ctx.moveTo(0, startY);
        ctx.lineTo(0, endY);
      }
      // draw x axis if in current view
      if (0 >= startY && 0 < endY) {
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, 0);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Draw lines with selection highlight
    ctx.save();
    lines.current.forEach((line, index) => {
      draw_selected_line_highlight(
        ctx,
        line,
        index,
        selectedObject.current,
        scale
      );
    });
    ctx.restore();

    // Draw preview line
    if (
      (activeDrawButton === "draw-lines" || isShiftDown.current) &&
      lineDrawingStart.current &&
      highlightedVertex.current
    ) {
      preview_line(
        ctx,
        lineDrawingStart.current,
        highlightedVertex.current,
        scale,
        wallColor
      );
    }

    // Draw preview lines (box)
    if (
      activeDrawButton === "draw-box" &&
      !isShiftDown.current &&
      lineDrawingStart.current &&
      highlightedVertex.current
    ) {
      preview_line_box(
        ctx,
        lineDrawingStart.current,
        highlightedVertex.current,
        scale,
        wallColor
      );
    }

    // Draw vertex highlight
    ctx.save();
    if (highlightedVertex.current) {
      draw_vertex_highlight(ctx, highlightedVertex.current, scale, wallColor);
      ctx.fill();
    }
    ctx.restore();

    // Draw markers with selection highlight
    markers.current.forEach((marker) => {
      draw_marker_selection_highlight(
        ctx,
        marker,
        selectedObject.current,
        scale,
        gridSize
      );
    });
    ctx.restore();
  };

  const centerGridOnPoint = (id: string, duration: number = 500) => {
    // find marker position from character id
    const marker = markerFromCharId(id, markers.current);
    if (!marker) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const { scale } = state.current;

    const point = marker.pos;

    const targetX = width / 2 - point.x * scale - (50 * scale) / 2;
    const targetY = height / 2 - point.y * scale - (50 * scale) / 2;

    const startX = state.current.offsetX;
    const startY = state.current.offsetY;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Clamp at 1

      // Ease-out function for a smoother stop
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      state.current.offsetX = startX + (targetX - startX) * easedProgress;
      state.current.offsetY = startY + (targetY - startY) * easedProgress;

      draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  useImperativeHandle(ref, () => ({
    centerGridOnPoint: centerGridOnPoint,
  }));

  //   ____________________
  //  /                    \
  // |                      |
  // |         RIP          |
  // | pointFromKey removed |
  // |                      |
  // |    6/11/25-6/12/25   |
  // |                    _ |
  // |__\|____|/____|___\/ \|

  useEffect(() => {
    const MIN_SCALE = 0.25;
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
      if (!isDM) return;
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
        socket.emit("remove_marker", {
          map_id: mapId,
          marker_id: deletedMarker.id,
        });
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
        socket.emit("remove_line", { map_id: mapId, line_id: deletedLine.id });
      }
    };

    const addHistoryEntry = (entry: HistoryEntry) => {
      history.current.push(entry);
      if (history.current.length > MAX_HISTORY_LENGTH) {
        history.current.shift();
      }
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
        // Updated logic: allow player to always drag canvas, but only interact with own marker
        if (markerAt) {
          if (!isDM && markerAt.characterId !== characterId) {
            // Not allowed to interact with this marker; drag canvas instead
            s.isDragging = true;
            s.lastX = e.clientX;
            s.lastY = e.clientY;
            return;
          }
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
      const isBoxDrawingMode = activeDrawButton === "draw-box";
      const isCircleDrawingMode = activeDrawButton === "draw-circle";

      // erase at spot under moving mouse
      if (isErasing.current) {
        const rect = canvas.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - s.offsetX) / s.scale;
        const worldY = (e.clientY - rect.top - s.offsetY) / s.scale;
        eraseAtPoint(worldX, worldY);
        return;
      }

      // hightlight nearest vertex if in line drawing mode or box drawing mode
      if (
        isDM &&
        (isLineDrawingMode || isBoxDrawingMode || isCircleDrawingMode) &&
        !s.isDragging &&
        !draggingMarker.current
      ) {
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
          socket.emit("move_marker", {
            map_id: mapId,
            marker_id: draggingMarker.current.id,
            new_position: draggingMarker.current.pos,
          });
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
      const isMarkerPlaceMode =
        activeDrawButton === "place-marker" || playerTokenSelected;
      const isBoxDrawingMode = activeDrawButton === "draw-box";
      const isCircleDrawingMode = activeDrawButton === "draw-circle";

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
      } else if (
        isDM &&
        isLineDrawingMode &&
        !moved &&
        highlightedVertex.current
      ) {
        if (
          lineDrawingStart.current &&
          !samePoint(lineDrawingStart.current, highlightedVertex.current)
        ) {
          const newLine: Line = {
            id: crypto.randomUUID(),
            start: lineDrawingStart.current,
            end: highlightedVertex.current,
            color: wallColor,
          };
          lines.current.push(newLine);
          addHistoryEntry({ type: "ADD_LINE", payload: { line: newLine } });
          socket.emit("add_line", {
            map_id: mapId,
            line: newLine,
          });
          lineDrawingStart.current = null;
        } else {
          lineDrawingStart.current = highlightedVertex.current;
        }
      } else if (
        isDM &&
        isBoxDrawingMode &&
        !moved &&
        highlightedVertex.current
      ) {
        if (
          lineDrawingStart.current &&
          !samePoint(lineDrawingStart.current, highlightedVertex.current)
        ) {
          let pointsForLines: [Point, Point][] = [];
          const hLinePoint1: Point = {
            x: lineDrawingStart.current.x,
            y: highlightedVertex.current.y,
          };
          const hLinePoint2: Point = {
            x: highlightedVertex.current.x,
            y: lineDrawingStart.current.y,
          };
          const sideLinePoint1: Point = {
            x: lineDrawingStart.current.x,
            y: highlightedVertex.current.y,
          };
          const sideLinePoint2: Point = {
            x: highlightedVertex.current.x,
            y: lineDrawingStart.current.y,
          };
          pointsForLines.push([hLinePoint1, highlightedVertex.current]);
          pointsForLines.push([hLinePoint2, lineDrawingStart.current]);
          pointsForLines.push([sideLinePoint1, lineDrawingStart.current]);
          pointsForLines.push([sideLinePoint2, highlightedVertex.current]);

          let noZeroLines = true;
          // check all lines greater than zero length
          pointsForLines.forEach(([startPoint, endPoint], index) => {
            if (
              startPoint.x - endPoint.x == 0 &&
              startPoint.y - endPoint.y == 0
            ) {
              noZeroLines = false;
            }
          });

          if (noZeroLines) {
            pointsForLines.forEach(([startPoint, endPoint], index) => {
              const newLine: Line = {
                id: crypto.randomUUID(),
                start: startPoint,
                end: endPoint,
                color: wallColor,
              };
              lines.current.push(newLine);
              addHistoryEntry({ type: "ADD_LINE", payload: { line: newLine } });
              socket.emit("add_line", {
                map_id: mapId,
                line: newLine,
              });
            });
            lineDrawingStart.current = null;
          }
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
        if (isDM && markerAt) {
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

        if (isDM && !didSelectSomething) {
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
        if (isDM && !didSelectSomething && isMarkerPlaceMode) {
          if (selectedObject.current) {
            selectedObject.current = null;
          } else {
            // Only add marker if not present at this position
            if (
              !markers.current.some(
                (m) => m.pos.x === gridX && m.pos.y === gridY
              )
            ) {
              // dont place marker if a player marker already on the board
              if (
                !playerTokenSelected ||
                (playerTokenSelected &&
                  uniqueMarker(playerTokenSelected, markers.current))
              ) {
                const newMarker: Marker = {
                  id: crypto.randomUUID(),
                  pos: { x: gridX, y: gridY },
                  color: markerColor,
                };
                if (playerTokenSelected) {
                  newMarker.characterId = playerTokenSelected.id;
                }
                markers.current.push(newMarker);
                addHistoryEntry({
                  type: "ADD_MARKER",
                  payload: { marker: newMarker },
                });
                socket.emit("add_marker", {
                  map_id: mapId,
                  marker: newMarker,
                });
              } else {
                let message =
                  playerTokenSelected.name + "'s token already on board.";
                showSnackbar(message, "info");
              }
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
      if (!isDM) return;
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
        ((isDM && e.key === "Delete") || e.key === "Backspace") &&
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
            socket.emit("remove_marker", {
              map_id: mapId,
              marker_id: marker.id,
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
            socket.emit("remove_line", {
              map_id: mapId,
              line_id: deletedLine.id,
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

      if (isDM && e.key === "Shift" && !isShiftDown.current) {
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
      activeDrawButton === "draw-lines" ||
      activeDrawButton === "draw-box" ||
      activeDrawButton === "draw-circle" ||
      playerTokenSelected
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
  }, [
    activeDrawButton,
    markerColor,
    wallColor,
    mapId,
    isGridOn,
    isAxesOn,
    playerTokenSelected,
  ]);

  // --- SOCKET EVENTS SYNC ---
  useEffect(() => {
    const handleMarkerAdded = (data: { marker: Marker }) => {
      if (!markers.current.some((m) => m.id === data.marker.id)) {
        markers.current.push(data.marker);
        draw();
      }
    };

    const handleMarkerRemoved = (data: { marker_id: string }) => {
      const index = markers.current.findIndex((m) => m.id === data.marker_id);
      if (index !== -1) {
        markers.current.splice(index, 1);
        draw();
      }
    };

    const handleMarkerMoved = (data: {
      marker_id: string;
      new_position: Point;
    }) => {
      const marker = markers.current.find((m) => m.id === data.marker_id);
      if (marker) {
        marker.pos = data.new_position;
        draw();
      }
    };

    const handleLineAdded = (data: { line: Line }) => {
      if (!lines.current.some((l) => l.id === data.line.id)) {
        lines.current.push(data.line);
        draw();
      }
    };

    const handleLineRemoved = (data: { line_id: string }) => {
      const index = lines.current.findIndex((l) => l.id === data.line_id);
      if (index !== -1) {
        lines.current.splice(index, 1);
        draw();
      }
    };

    const handleMapDisconnected = () => {
      markers.current = [];
      lines.current = [];
      draw();
    };

    const handleMapDeleted = () => {
      markers.current = [];
      lines.current = [];
      draw();
    };

    socket.on("map_deleted", handleMapDeleted);
    socket.on("map_disconnected", handleMapDisconnected);
    socket.on("marker_added", handleMarkerAdded);
    socket.on("marker_removed", handleMarkerRemoved);
    socket.on("marker_moved", handleMarkerMoved);
    socket.on("line_added", handleLineAdded);
    socket.on("line_removed", handleLineRemoved);

    return () => {
      socket.off("map_deleted", handleMapDeleted);
      socket.off("map_disconnected", handleMapDisconnected);
      socket.off("marker_added", handleMarkerAdded);
      socket.off("marker_removed", handleMarkerRemoved);
      socket.off("marker_moved", handleMarkerMoved);
      socket.off("line_added", handleLineAdded);
      socket.off("line_removed", handleLineRemoved);
    };
  }, [socket]);

  useEffect(() => {
    const handleInitializeMapState = (data: {
      map_id: string;
      markers: Marker[];
      lines: Line[];
    }) => {
      markers.current = data.markers;
      lines.current = data.lines;
      draw();
    };

    const handleRequestMapState = (data: {
      map_id: string;
      target_sid: string;
    }) => {
      if (mapId !== data.map_id) return;

      socket.emit("send_map_state", {
        target_sid: data.target_sid,
        map_id: data.map_id,
        markers: markers.current,
        lines: lines.current,
      });
    };

    socket.on("initialize_map_state", handleInitializeMapState);
    socket.on("request_map_state", handleRequestMapState);
    return () => {
      socket.off("initialize_map_state", handleInitializeMapState);
      socket.off("request_map_state", handleRequestMapState);
    };
  }, [socket, mapId]);

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
});

export default InfiniteCanvas;
