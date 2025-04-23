import { useState, useEffect } from "react";
import { Search, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";

import { usePexelsVideos } from "../../../hooks/use-pexels-video";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { ClipOverlay, Overlay, OverlayType } from "../../../types";
import { VideoDetails } from "./video-details";
import { FileUpload } from "../../shared/file-upload";
import {
  useFileUpload,
  getAcceptedFileTypes,
} from "../../../hooks/use-file-upload";

interface PexelsVideoFile {
  quality: string;
  link: string;
}

interface PexelsVideo {
  id: number | string;
  image: string;
  video_files: PexelsVideoFile[];
}

/**
 * VideoOverlayPanel is a component that provides video search and management functionality.
 * It allows users to:
 * - Search and browse videos from the Pexels API
 * - Upload videos from their device
 * - Add videos to the timeline as overlays
 * - Manage video properties when a video overlay is selected
 *
 * The component has two main states:
 * 1. Search/Upload mode: Shows tabs for searching Pexels videos or uploading from device
 * 2. Edit mode: Shows video details panel when a video overlay is selected
 *
 * @component
 * @example
 * ```tsx
 * <VideoOverlayPanel />
 * ```
 */
export const VideoOverlayPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { videos, isLoading, fetchVideos } = usePexelsVideos();
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
  } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<Overlay | null>(null);
  const { uploadFile, isLoading: isUploading } = useFileUpload();
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.VIDEO) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  /**
   * Creates a new video overlay with default settings
   * @param src - Source URL for the video
   * @param thumbnailSrc - URL for the video thumbnail/preview
   */
  const createVideoOverlay = (src: string, thumbnailSrc: string = "") => {
    const { width, height } = getAspectRatioDimensions();

    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    const newOverlay: Overlay = {
      left: 0,
      top: 0,
      width,
      height,
      durationInFrames: 200,
      from,
      id: Date.now(),
      rotation: 0,
      row,
      isDragging: false,
      type: OverlayType.VIDEO,
      content: thumbnailSrc || "",
      src: src,
      videoStartTime: 0,
      styles: {
        opacity: 1,
        zIndex: 100,
        transform: "none",
        objectFit: "cover",
      },
    };

    addOverlay(newOverlay);
  };

  const handleAddClip = (video: PexelsVideo) => {
    // Find the best quality video file (prioritize UHD > HD > SD)
    const videoFile =
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "uhd"
      ) ||
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "hd"
      ) ||
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "sd"
      ) ||
      video.video_files[0]; // Fallback to first file if no matches

    createVideoOverlay(videoFile?.link ?? "", video.image);
  };

  /**
   * Handles video file upload from user's device
   * @param file - The uploaded video file
   */
  const handleFileUpload = async (file: File) => {
    try {
      const videoUrl = await uploadFile(file);

      // Generate a thumbnail from the video
      setUploadPreview(videoUrl);

      // Create video element to get dimensions and generate thumbnail
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        // Use the video itself as the thumbnail for now
        createVideoOverlay(videoUrl, videoUrl);
      };

      video.onerror = () => {
        // In case of error, still add the video but without thumbnail
        createVideoOverlay(videoUrl);
      };

      video.src = videoUrl;
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  const handleUpdateOverlay = (updatedOverlay: Overlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      {!localOverlay ? (
        <Tabs defaultValue="pexels" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="pexels" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search Videos</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pexels">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-blue-400"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-zinc-200 border-gray-200 dark:border-white/5"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-sm"
                  />
                ))
              ) : videos.length > 0 ? (
                videos.map((video) => (
                  <button
                    key={video.id}
                    className="relative aspect-video cursor-pointer border border-transparent hover:border-white rounded-md"
                    onClick={() => handleAddClip(video)}
                  >
                    <div className="relative">
                      <img
                        src={video.image}
                        alt={`Video thumbnail ${video.id}`}
                        className="rounded-sm object-cover w-full h-full hover:opacity-60 transition-opacity duration-200"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-gray-500">
                  <p>Search for videos to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="rounded-md overflow-hidden">
              <FileUpload
                acceptedFileTypes={getAcceptedFileTypes("video")}
                onFileSelected={handleFileUpload}
                buttonText="Upload Video"
                maxSizeMB={100}
              />
            </div>

            {uploadPreview && (
              <div className="mt-4 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <video
                  src={uploadPreview}
                  className="w-full aspect-video object-cover"
                  controls
                />
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <h4 className="font-medium mb-1">Supported formats:</h4>
              <p>MP4, WebM, QuickTime</p>
              <h4 className="font-medium mt-3 mb-1">Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use MP4 format with H.264 codec for best compatibility</li>
                <li>
                  Keep video length under 60 seconds for better performance
                </li>
                <li>Consider compressing large video files before uploading</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <VideoDetails
          localOverlay={localOverlay as ClipOverlay}
          setLocalOverlay={handleUpdateOverlay}
        />
      )}
    </div>
  );
};
