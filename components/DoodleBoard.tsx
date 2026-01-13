"use client";

import { useRef, useState, useEffect, TouchEvent, MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Paintbrush,
  Eraser,
  Trash2,
  Save,
  Undo,
  Redo,
  Sparkles,
  Stamp,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

export function DoodleBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#FF6B6B");
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState<"draw" | "erase" | "stamp">("draw");
  const [rainbowMode, setRainbowMode] = useState(false);
  const [glitterMode, setGlitterMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [selectedStamp, setSelectedStamp] = useState<string>("heart");
  const rainbowIndex = useRef(0);

  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B500", "#2ECC71",
    "#E74C3C", "#9B59B6", "#3498DB", "#1ABC9C", "#F39C12",
    "#D35400", "#C0392B", "#8E44AD", "#2980B9", "#27AE60",
    "#16A085", "#F1C40F", "#E67E22", "#ECF0F1",
  ];

  const backgroundColors = [
    "#FFFFFF", "#FFF9E6", "#E8F8F5", "#EBF5FB", "#F4ECF7",
    "#FDEEF4", "#FEF5E7", "#F8F9F9", "#000000",
  ];

  const brushSizes = [3, 5, 8, 12, 20, 30];

  const stamps = [
    { name: "heart", emoji: "❤️" },
    { name: "star", emoji: "⭐" },
    { name: "smile", emoji: "😊" },
    { name: "flower", emoji: "🌸" },
    { name: "rocket", emoji: "🚀" },
    { name: "rainbow", emoji: "🌈" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      saveToHistory();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [backgroundColor]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      restoreFromHistory(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      restoreFromHistory(historyStep + 1);
    }
  };

  const restoreFromHistory = (step: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = history[step];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const getRainbowColor = () => {
    const rainbowColors = [
      "#FF0000", "#FF7F00", "#FFFF00", "#00FF00",
      "#0000FF", "#4B0082", "#9400D3",
    ];
    const c = rainbowColors[rainbowIndex.current % rainbowColors.length];
    rainbowIndex.current++;
    return c;
  };

  const drawGlitter = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sparkleCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < sparkleCount; i++) {
      const offsetX = (Math.random() - 0.5) * brushSize * 3;
      const offsetY = (Math.random() - 0.5) * brushSize * 3;
      const sparkleSize = Math.random() * 3 + 1;

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawStamp = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stamp = stamps.find((s) => s.name === selectedStamp);
    if (!stamp) return;

    ctx.font = `${brushSize * 8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stamp.emoji, x, y);

    saveToHistory();
  };

  const startDrawing = (x: number, y: number) => {
    if (mode === "stamp") {
      drawStamp(x, y);
      return;
    }

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || mode === "stamp") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawColor =
      mode === "erase"
        ? backgroundColor
        : rainbowMode
        ? getRainbowColor()
        : color;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = mode === "erase" ? brushSize * 2 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(x, y);
    ctx.stroke();

    if (glitterMode && mode === "draw") {
      drawGlitter(x, y);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const title = prompt(
      "Give your drawing a name!",
      `Masterpiece ${new Date().toLocaleDateString()}`
    );
    if (!title) return;

    const imageData = canvas.toDataURL();

    try {
      const response = await fetch("/api/doodles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, imageData }),
      });

      if (response.ok) {
        toast.success("Drawing saved to gallery! 🎨");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save drawing");
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to save drawing");
    }
  };

  return (
    <Card className="shadow-lg bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="p-4 space-y-4">
        {/* Canvas */}
        <div
          className="relative rounded-lg border-4 border-purple-300 shadow-inner overflow-hidden"
          style={{ backgroundColor }}
        >
          <canvas
            ref={canvasRef}
            className="w-full touch-none cursor-crosshair"
            style={{ height: "500px" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Tools */}
        <div className="space-y-3">
          {/* Mode and Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={mode === "draw" ? "default" : "outline"}
              size="lg"
              onClick={() => setMode("draw")}
              className="flex-1 min-w-[80px] h-12"
            >
              <Paintbrush className="h-5 w-5 mr-2" />
              Draw
            </Button>
            <Button
              variant={mode === "erase" ? "default" : "outline"}
              size="lg"
              onClick={() => setMode("erase")}
              className="flex-1 min-w-[80px] h-12"
            >
              <Eraser className="h-5 w-5 mr-2" />
              Erase
            </Button>
            <Button
              variant={mode === "stamp" ? "default" : "outline"}
              size="lg"
              onClick={() => setMode("stamp")}
              className="flex-1 min-w-[80px] h-12"
            >
              <Stamp className="h-5 w-5 mr-2" />
              Stamp
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="lg" onClick={undo} disabled={historyStep <= 0} className="h-12">
              <Undo className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={redo} disabled={historyStep >= history.length - 1} className="h-12">
              <Redo className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={clearCanvas} className="h-12">
              <Trash2 className="h-5 w-5 mr-2" />
              Clear
            </Button>
            <Button variant="default" size="lg" onClick={saveDrawing} className="h-12 bg-green-600 hover:bg-green-700">
              <Save className="h-5 w-5 mr-2" />
              Save
            </Button>
          </div>

          {/* Special Effects (Draw mode only) */}
          {mode === "draw" && (
            <div className="flex gap-2">
              <Button
                variant={rainbowMode ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  setRainbowMode(!rainbowMode);
                  if (!rainbowMode) rainbowIndex.current = 0;
                }}
                className="flex-1 h-12"
              >
                🌈 Rainbow
              </Button>
              <Button
                variant={glitterMode ? "default" : "outline"}
                size="lg"
                onClick={() => setGlitterMode(!glitterMode)}
                className="flex-1 h-12"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Glitter
              </Button>
            </div>
          )}

          {/* Stamps */}
          {mode === "stamp" && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Stickers:</p>
              <div className="flex gap-2 flex-wrap">
                {stamps.map((stamp) => (
                  <button
                    key={stamp.name}
                    className={`text-3xl w-14 h-14 rounded-lg border-4 transition-all hover:scale-110 ${
                      selectedStamp === stamp.name
                        ? "border-purple-600 bg-purple-100 scale-110"
                        : "border-gray-300 bg-white"
                    }`}
                    onClick={() => setSelectedStamp(stamp.name)}
                  >
                    {stamp.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Palette */}
          {mode === "draw" && !rainbowMode && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Colors:</p>
              <div className="grid grid-cols-12 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-4 transition-all hover:scale-110 ${
                      color === c ? "border-gray-800 scale-110" : "border-white"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Background Colors */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Background:
            </p>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map((bg) => (
                <button
                  key={bg}
                  className={`w-10 h-10 rounded-lg border-4 transition-all hover:scale-110 ${
                    backgroundColor === bg
                      ? "border-purple-600 scale-110"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: bg }}
                  onClick={() => setBackgroundColor(bg)}
                />
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">
              {mode === "draw" ? "Brush" : mode === "erase" ? "Eraser" : "Stamp"} Size:
            </p>
            <div className="flex gap-2">
              {brushSizes.map((size) => (
                <button
                  key={size}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                    brushSize === size
                      ? "border-purple-600 bg-purple-100"
                      : "border-gray-300 bg-white"
                  }`}
                  onClick={() => setBrushSize(size)}
                >
                  <div
                    className="rounded-full bg-gray-800"
                    style={{
                      width: `${Math.min(size * 2, 40)}px`,
                      height: `${Math.min(size * 2, 40)}px`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
