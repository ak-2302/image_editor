import { useState } from "react";

export type CanvasSize = {
  width: number;
  height: number;
};

export function useCanvasState() {
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null);
  const [showBlankCanvasForm, setShowBlankCanvasForm] = useState(false);
  const [blankWidth, setBlankWidth] = useState(1200);
  const [blankHeight, setBlankHeight] = useState(800);
  const [frameOpacity, setFrameOpacity] = useState(100);
  const [frameThickness, setFrameThickness] = useState(1);

  const createBlankCanvas = () => {
    if (blankWidth < 1 || blankHeight < 1) return false;
    setCanvasSize({ width: blankWidth, height: blankHeight });
    setShowBlankCanvasForm(false);
    return true;
  };

  const resetCanvas = () => {
    setCanvasSize(null);
    setShowBlankCanvasForm(false);
  };

  return {
    canvasSize,
    setCanvasSize,
    showBlankCanvasForm,
    setShowBlankCanvasForm,
    blankWidth,
    setBlankWidth,
    blankHeight,
    setBlankHeight,
    frameOpacity,
    setFrameOpacity,
    frameThickness,
    setFrameThickness,
    createBlankCanvas,
    resetCanvas,
  };
}
