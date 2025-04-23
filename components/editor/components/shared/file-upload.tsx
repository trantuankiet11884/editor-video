"use client";

import React, { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  acceptedFileTypes: string;
  onFileSelected: (file: File) => void;
  maxSizeMB?: number;
  className?: string;
  buttonText?: string;
  multiple?: boolean;
}

export const FileUpload = ({
  acceptedFileTypes,
  onFileSelected,
  maxSizeMB = 50,
  className = "",
  buttonText = "Upload File",
  multiple = false,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the ${maxSizeMB}MB limit`);
      return false;
    }

    // Check file type
    const fileType = file.type;
    const acceptedTypes = acceptedFileTypes
      .split(",")
      .map((type) => type.trim());

    // If acceptedFileTypes includes the file extension (e.g., .mp4)
    if (
      acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return (
          type === fileType ||
          type === "*/*" ||
          type === fileType.split("/")[0] + "/*"
        );
      })
    ) {
      return true;
    }

    setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
    return false;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }
          ${error ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          multiple={multiple}
        />

        <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {buttonText}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Drag & drop or click to upload
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Max size: {maxSizeMB}MB
        </p>
      </div>

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              clearError();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
