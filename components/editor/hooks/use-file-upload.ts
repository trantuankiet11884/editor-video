"use client";

import { useState } from "react";

interface FileUploadResult {
  localUrl: string | null;
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<string>;
  clearFile: () => void;
}

export function useFileUpload(): FileUploadResult {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we're just creating a local URL for the file
      // In a real application, you might want to upload it to a server
      const url = URL.createObjectURL(file);
      setLocalUrl(url);
      setIsLoading(false);
      return url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  const clearFile = () => {
    if (localUrl) {
      URL.revokeObjectURL(localUrl);
    }
    setLocalUrl(null);
    setError(null);
  };

  return {
    localUrl,
    isLoading,
    error,
    uploadFile,
    clearFile,
  };
}

/**
 * Helper function to get the mime type for different overlay types
 */
export function getAcceptedFileTypes(
  type: "image" | "video" | "audio"
): string {
  switch (type) {
    case "image":
      return "image/jpeg,image/png,image/gif,image/webp";
    case "video":
      return "video/mp4,video/webm,video/quicktime";
    case "audio":
      return "audio/mpeg,audio/wav,audio/ogg";
    default:
      return "";
  }
}

/**
 * Helper function to get file extension from file object
 */
export function getFileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
