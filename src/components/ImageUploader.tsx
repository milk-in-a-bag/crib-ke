"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 10;

export interface UploadedImage {
  url: string;
  public_id: string;
  /** local preview URL (object URL) */
  preview: string;
  name: string;
}

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  name: string;
  url?: string;
  public_id?: string;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

interface ImageUploaderProps {
  /** Already-uploaded image URLs (edit mode) */
  initialUrls?: string[];
  onChange: (images: UploadedImage[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export function ImageUploader({
  initialUrls = [],
  onChange,
  onUploadingChange,
}: ImageUploaderProps) {
  const [items, setItems] = useState<ImageItem[]>(() =>
    initialUrls.map((url) => ({
      id: uid(),
      preview: url,
      name: url.split("/").pop() ?? "image",
      url,
      public_id: url,
      status: "done" as const,
    })),
  );

  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent of uploading state
  useEffect(() => {
    const uploading = items.some((i) => i.status === "uploading");
    onUploadingChange?.(uploading);
  }, [items, onUploadingChange]);

  // Notify parent of done images
  useEffect(() => {
    const done = items
      .filter((i) => i.status === "done" && i.url)
      .map((i) => ({
        url: i.url!,
        public_id: i.public_id!,
        preview: i.preview,
        name: i.name,
      }));
    onChange(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const uploadFile = useCallback(async (item: ImageItem, file: File) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)),
    );
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.details ?? "Upload failed");
      }
      const { url, public_id } = await res.json();
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "done", url, public_id, error: undefined }
            : i,
        ),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : i,
        ),
      );
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remaining = MAX_IMAGES - items.length;
      if (remaining <= 0) return;

      const toAdd: ImageItem[] = [];
      for (const file of arr.slice(0, remaining)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toAdd.push({
            id: uid(),
            file,
            preview: "",
            name: file.name,
            status: "error",
            error: `${file.name}: unsupported file type (JPEG, PNG, WebP only)`,
          });
          continue;
        }
        if (file.size > MAX_SIZE) {
          toAdd.push({
            id: uid(),
            file,
            preview: "",
            name: file.name,
            status: "error",
            error: `${file.name}: exceeds 10 MB limit`,
          });
          continue;
        }
        toAdd.push({
          id: uid(),
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
          status: "idle",
        });
      }

      setItems((prev) => [...prev, ...toAdd]);

      // kick off uploads for valid files
      for (const item of toAdd) {
        if (item.status === "idle" && item.file) {
          uploadFile(item, item.file);
        }
      }
    },
    [items.length, uploadFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview && item.preview.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleRetry = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.file) uploadFile(item, item.file);
  };

  // Drag-to-reorder handlers
  const handleItemDragStart = (index: number) => setDragIndex(index);
  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleItemDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleItemDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Drag &amp; drop images here, or{" "}
          <span className="text-orange-500 font-semibold">browse</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          JPEG, PNG, WebP · max 10 MB each · up to {MAX_IMAGES} images
        </p>
      </div>

      {/* Thumbnails */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={item.status === "done"}
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              onDragEnd={handleItemDragEnd}
              className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                dragOverIndex === index
                  ? "border-orange-400 scale-105"
                  : "border-transparent"
              } ${item.status === "done" ? "cursor-grab" : ""}`}
            >
              {item.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.preview}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-400 text-center px-1 break-all">
                    {item.name}
                  </span>
                </div>
              )}

              {/* Uploading overlay */}
              {item.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {item.status === "error" && (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-1 gap-1">
                  <p className="text-white text-xs text-center leading-tight line-clamp-3">
                    {item.error}
                  </p>
                  {item.file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(item.id);
                      }}
                      className="text-xs bg-white text-red-700 px-2 py-0.5 rounded font-semibold hover:bg-red-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* First image badge */}
              {index === 0 && item.status === "done" && (
                <span className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                  Cover
                </span>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs leading-none"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
