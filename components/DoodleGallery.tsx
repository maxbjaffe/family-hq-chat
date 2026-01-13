"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Drawing {
  id: string;
  title: string;
  thumbnail_data: string;
  created_at: string;
}

export function DoodleGallery() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [fullImageData, setFullImageData] = useState<string | null>(null);

  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/doodles");
      const data = await response.json();

      if (response.ok) {
        setDrawings(data.drawings || []);
      } else {
        toast.error("Failed to load drawings");
      }
    } catch (error) {
      console.error("Error loading drawings:", error);
      toast.error("Failed to load drawings");
    } finally {
      setLoading(false);
    }
  };

  const viewDrawing = async (id: string) => {
    try {
      const response = await fetch(`/api/doodles/${id}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedDrawing(id);
        setFullImageData(data.drawing.image_data);
      } else {
        toast.error("Failed to load drawing");
      }
    } catch (error) {
      console.error("Error loading drawing:", error);
      toast.error("Failed to load drawing");
    }
  };

  const deleteDrawing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this drawing?")) {
      return;
    }

    try {
      const response = await fetch(`/api/doodles?id=${id}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("Drawing deleted");
        setDrawings(drawings.filter((d) => d.id !== id));
        if (selectedDrawing === id) {
          setSelectedDrawing(null);
          setFullImageData(null);
        }
      } else {
        toast.error("Failed to delete drawing");
      }
    } catch (error) {
      console.error("Error deleting drawing:", error);
      toast.error("Failed to delete drawing");
    }
  };

  const downloadDrawing = (imageData: string, title: string) => {
    const link = document.createElement("a");
    link.download = `${title.replace(/\s+/g, "_")}.png`;
    link.href = imageData;
    link.click();
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedDrawing && fullImageData ? (
        <Card className="shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              {drawings.find((d) => d.id === selectedDrawing)?.title}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadDrawing(
                    fullImageData,
                    drawings.find((d) => d.id === selectedDrawing)?.title || "doodle"
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDrawing(null);
                  setFullImageData(null);
                }}
              >
                Back to Gallery
              </Button>
            </div>
          </div>
          <img
            src={fullImageData}
            alt="Drawing"
            className="w-full rounded-lg border-4 border-purple-300"
          />
        </Card>
      ) : (
        <Card className="shadow-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Doodle Gallery
            </h3>
          </div>

          {drawings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No saved drawings yet!</p>
              <p className="text-sm">Create and save your first masterpiece above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {drawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="relative group cursor-pointer"
                  onClick={() => viewDrawing(drawing.id)}
                >
                  <div className="aspect-square rounded-lg border-4 border-purple-200 overflow-hidden hover:border-purple-400 transition-all hover:scale-105">
                    <img
                      src={drawing.thumbnail_data}
                      alt={drawing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-bold truncate">{drawing.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(drawing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDrawing(drawing.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
