/**
 * ImageUpload Component
 * Allows users to upload images or capture from camera
 * Supports drag & drop, file selection, and mobile camera capture
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";

interface ImageUploadProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onImageRemoved?: () => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onImageSelected,
  onImageRemoved,
  maxSizeMB = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"],
  className,
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Please upload ${acceptedTypes.map(t => t.split('/')[1]).join(', ')} files.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      setIsLoading(false);
      onImageSelected(file, url);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected, maxSizeMB, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onImageRemoved?.();
  }, [onImageRemoved]);

  const openFileSelector = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {previewUrl ? (
          // Preview state
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/30"
          >
            <img
              src={previewUrl}
              alt="Uploaded LEGO set"
              className="w-full h-auto max-h-[400px] object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4">
              <p className="text-white text-xs sm:text-sm font-medium">
                Image uploaded successfully
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 h-7 sm:h-8 text-xs sm:text-sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Change Image
              </Button>
            </div>
          </motion.div>
        ) : (
          // Upload state
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-4 sm:p-8 transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-red-300 bg-red-50/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                
                <h3 className="text-base sm:text-lg font-heading font-bold mb-1 sm:mb-2">
                  Upload LEGO Set Image
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm px-2">
                  Take a photo of your LEGO box or upload an image of the completed set you want to build
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    onClick={openCamera}
                    disabled={disabled}
                    className="gap-2 h-10 sm:h-11 text-sm sm:text-base"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openFileSelector}
                    disabled={disabled}
                    className="gap-2 h-10 sm:h-11 text-sm sm:text-base"
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    Upload Image
                  </Button>
                </div>

                {/* Drag & drop hint */}
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-4 hidden sm:block">
                  or drag and drop an image here
                </p>

                {/* File type info */}
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  Supports: JPG, PNG, WebP • Max {maxSizeMB}MB
                </p>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
