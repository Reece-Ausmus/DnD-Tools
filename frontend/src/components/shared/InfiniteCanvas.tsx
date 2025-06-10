import React, { useRef, useEffect } from "react";

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

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
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Drag marker state
  const draggingMarker = useRef<string | null>(null);
  const isOverGrid = useRef<boolean>(false);

  const draw = (
    ctx: CanvasRenderingContext2D,
    { scale, offsetX, offsetY }: CanvasState
  ) => {
    const { width, height } = ctx.canvas;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw a grid
    const gridSize = 50;
    ctx.strokeStyle = "#ccc";
    const startX = -offsetX / scale - width / scale;
    const endX = -offsetX / scale + 2 * (width / scale);
    const startY = -offsetY / scale - height / scale;
    const endY = -offsetY / scale + 2 * (height / scale);

    for (
      let x = Math.floor(startX / gridSize) * gridSize;
      x < endX;
      x += gridSize
    ) {
      for (
        let y = Math.floor(startY / gridSize) * gridSize;
        y < endY;
        y += gridSize
      ) {
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    }

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

    const onMouseDown = (e: MouseEvent) => {
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
        draggingMarker.current = key;
      } else {
        s.isDragging = true;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
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
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.offsetX += dx;
      s.offsetY += dy;
      draw(ctx, s);
    };

    const onMouseUp = (e: MouseEvent) => {
      const moved =
        Math.abs(e.clientX - dragStart.current.x) > 2 ||
        Math.abs(e.clientY - dragStart.current.y) > 2;

      if (!draggingMarker.current && !moved) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const x = (mouseX - s.offsetX) / s.scale;
        const y = (mouseY - s.offsetY) / s.scale;
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;
        const key = `${gridX},${gridY}`;
        if (markers.current.has(key)) {
          markers.current.delete(key);
        } else {
          const randomColor = `hsl(${Math.floor(
            Math.random() * 360
          )}, 70%, 50%)`;
          markers.current.set(key, {
            id: crypto.randomUUID(),
            color: randomColor,
          });
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
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale * zoomFactor)
      );
      const actualZoomFactor = newScale / scale;

      s.offsetX = mouseX - (mouseX - offsetX) * actualZoomFactor;
      s.offsetY = mouseY - (mouseY - offsetY) * actualZoomFactor;
      s.scale = newScale;

      draw(ctx, s);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

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
