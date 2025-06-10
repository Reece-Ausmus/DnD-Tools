import React, { useEffect, useRef } from "react";
import { InfiniteCanvas } from "@/components/shared/InfiniteCanvas";

export const InfiniteCanvasComponent: React.FC<{ cellSize?: number }> = ({
  cellSize = 40,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const infiniteCanvasRef = useRef<InfiniteCanvas | null>(null);
  // Drag state refs
  const isDragging = useRef(false);
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Set canvas dimensions
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      infiniteCanvasRef.current = new InfiniteCanvas(canvas, cellSize);

      // Mouse event handlers for dragging
      const handleMouseDown = (e: MouseEvent) => {
        isDragging.current = true;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (
          isDragging.current &&
          lastMousePosition.current &&
          infiniteCanvasRef.current
        ) {
          const dx = e.clientX - lastMousePosition.current.x;
          const dy = e.clientY - lastMousePosition.current.y;
          lastMousePosition.current = { x: e.clientX, y: e.clientY };

          infiniteCanvasRef.current.offsetRight(
            dx / infiniteCanvasRef.current.scale
          );
          infiniteCanvasRef.current.offsetDown(
            dy / infiniteCanvasRef.current.scale
          );
          lastMousePosition.current = { x: e.clientX, y: e.clientY };

          infiniteCanvasRef.current.offsetRight(
            dx / infiniteCanvasRef.current.scale
          );
          infiniteCanvasRef.current.offsetDown(
            dy / infiniteCanvasRef.current.scale
          );
        }
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        lastMousePosition.current = null;
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [cellSize]);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
