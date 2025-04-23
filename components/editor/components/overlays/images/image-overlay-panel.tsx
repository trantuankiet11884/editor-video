import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import {
  getAcceptedFileTypes,
  useFileUpload,
} from "../../../hooks/use-file-upload";
import { usePexelsImages } from "../../../hooks/use-pexels-images";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { ImageOverlay, Overlay, OverlayType } from "../../../types";
import { FileUpload } from "../../shared/file-upload";
import { ImageDetails } from "./image-details";

/**
 * Interface representing an image from the Pexels API
 */
interface PexelsImage {
  id: number | string;
  src: {
    original: string;
    medium: string;
  };
}

/**
 * ImageOverlayPanel Component
 *
 * A panel that provides functionality to:
 * 1. Search and select images from Pexels
 * 2. Upload images from device
 * 3. Add selected images as overlays to the editor
 * 4. Modify existing image overlay properties
 *
 * The panel has two main states:
 * - Search/Upload mode: Shows tabs for searching Pexels images or uploading from device
 * - Edit mode: Shows image details editor when an existing image overlay is selected
 */
export const ImageOverlayPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { images, isLoading, fetchImages } = usePexelsImages();
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
  const [isAddingAll, setIsAddingAll] = useState(false);

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.IMAGE) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  /**
   * Handles the image search form submission
   * Triggers the Pexels API call with the current search query
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchImages(searchQuery);
    }
  };

  /**
   * Creates a new image overlay with default properties
   * @param src - URL of the image to add
   * @param position - Optional position override for the overlay
   */
  const createImageOverlay = (
    src: string,
    position?: { from: number; row: number }
  ) => {
    const { width, height } = getAspectRatioDimensions();
    const { from, row } =
      position ||
      findNextAvailablePosition(overlays, visibleRows, durationInFrames);

    const newOverlay: Overlay = {
      left: 0,
      top: 0,
      width,
      height,
      durationInFrames: 120,
      from,
      id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique IDs when adding multiple images quickly
      rotation: 0,
      row,
      isDragging: false,
      type: OverlayType.IMAGE,
      src: src,
      styles: {
        objectFit: "cover",
        animation: {
          enter: "fadeIn",
          exit: "fadeOut",
        },
      },
    };

    addOverlay(newOverlay);
  };

  /**
   * Adds a new image overlay from Pexels API
   * @param image - The selected Pexels image to add
   */
  const handleAddImage = (image: PexelsImage) => {
    createImageOverlay(image.src.original);
  };

  /**
   * Adds all images from search results to the timeline
   * Images are distributed evenly on a single row with optimized spacing
   */
  const handleAddAllImages = async () => {
    if (images.length === 0 || isAddingAll) return;

    setIsAddingAll(true);

    try {
      // Get the initial position for the first image
      const initialPosition = findNextAvailablePosition(
        overlays,
        visibleRows,
        durationInFrames
      );

      // Filter images to only include those with URLs
      const validImages = images.filter(
        (image) => image.src && image.src.original
      );

      if (validImages.length === 0) {
        return;
      }

      // Calculate available timeline space
      const availableSpace = durationInFrames - initialPosition.from;

      // Each image has a default duration of 120 frames (5 seconds at 24fps)
      const imageDuration = 120;

      // Calculate total space needed for all images
      const totalImagesSpace = validImages.length * imageDuration;

      // If we can't fit all images even without spacing, adjust the image duration
      if (totalImagesSpace > availableSpace) {
        // Calculate the maximum possible duration for each image to fit them all
        const maxImageDuration = Math.floor(
          availableSpace / validImages.length
        );

        // Set a minimum duration to ensure images are still visible
        const adjustedImageDuration = Math.max(60, maxImageDuration);

        // If we still can't fit all images with the minimum duration, we'll use it anyway
        // and let the user scroll to see the rest

        // Add each image with the adjusted duration and no spacing
        for (let i = 0; i < validImages.length; i++) {
          const image = validImages[i];
          const position = {
            from: initialPosition.from + i * adjustedImageDuration,
            row: initialPosition.row,
          };

          // Create the overlay with the adjusted duration
          const { width, height } = getAspectRatioDimensions();
          const newOverlay: Overlay = {
            left: 0,
            top: 0,
            width,
            height,
            durationInFrames: adjustedImageDuration,
            from: position.from,
            id: Date.now() + Math.floor(Math.random() * 1000),
            rotation: 0,
            row: position.row,
            isDragging: false,
            type: OverlayType.IMAGE,
            src: image.src.original,
            styles: {
              objectFit: "cover",
              animation: {
                enter: "fadeIn",
                exit: "fadeOut",
              },
            },
          };

          addOverlay(newOverlay);

          // Add a small delay to avoid UI freezing when adding many images
          if (i % 5 === 0 && i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      } else {
        // We have enough space to fit all images with their full duration
        // Calculate the optimal spacing to distribute images evenly

        // Calculate remaining space after placing all images
        const remainingSpace = availableSpace - totalImagesSpace;

        // Calculate spacing between images
        // If only one image, spacing is irrelevant
        const spacing =
          validImages.length > 1
            ? Math.floor(remainingSpace / (validImages.length - 1))
            : 0;

        // Add each image with calculated spacing
        for (let i = 0; i < validImages.length; i++) {
          const image = validImages[i];
          const position = {
            from: initialPosition.from + i * (imageDuration + spacing),
            row: initialPosition.row,
          };

          createImageOverlay(image.src.original, position);

          // Add a small delay to avoid UI freezing when adding many images
          if (i % 5 === 0 && i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }
    } finally {
      setIsAddingAll(false);
    }
  };

  /**
   * Handles file upload from user's device
   * @param file - The uploaded image file
   */
  const handleFileUpload = async (file: File) => {
    try {
      const url = await uploadFile(file);
      createImageOverlay(url);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  /**
   * Updates an existing image overlay's properties
   * @param updatedOverlay - The modified overlay object
   * Updates both local state and global editor context
   */
  const handleUpdateOverlay = (updatedOverlay: Overlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900/50 h-full">
      {!localOverlay ? (
        <Tabs defaultValue="pexels" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-md">
            <TabsTrigger
              value="pexels"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 hover:bg-gray-200 hover:dark:bg-gray-700"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </TabsTrigger>

            <TabsTrigger
              value="upload"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 hover:bg-gray-200 hover:dark:bg-gray-700"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pexels">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search images..."
                value={searchQuery}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-400"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                className="bg-background hover:bg-muted text-foreground border-border"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {images.length > 0 && (
              <div className="mb-4 flex justify-end">
                <Button
                  onClick={handleAddAllImages}
                  variant="outline"
                  disabled={isAddingAll || images.length === 0}
                  className="text-sm flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add All Images to Timeline
                  {isAddingAll && (
                    <span className="ml-1 h-3 w-3 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                  )}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative aspect-video bg-muted animate-pulse rounded-sm"
                  />
                ))
              ) : images.length > 0 ? (
                images.map((image) => (
                  <button
                    key={image.id}
                    className="relative aspect-video cursor-pointer border border-border hover:border-foreground rounded-md"
                    onClick={() => handleAddImage(image)}
                  >
                    <div className="relative">
                      <img
                        src={image.src.medium}
                        alt={`Image thumbnail ${image.id}`}
                        className="rounded-sm object-cover w-full h-full hover:opacity-60 transition-opacity duration-200"
                      />
                      <div className="absolute inset-0 bg-background/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <p>Search for images to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="rounded-md overflow-hidden">
              <FileUpload
                acceptedFileTypes={getAcceptedFileTypes("image")}
                onFileSelected={handleFileUpload}
                buttonText="Upload Image"
                maxSizeMB={10}
              />
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <h4 className="font-medium mb-1">Supported formats:</h4>
              <p>JPG, PNG, GIF, WebP</p>
              <h4 className="font-medium mt-3 mb-1">Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use high resolution images for best quality</li>
                <li>Transparent PNG files work well for overlays</li>
                <li>Keep file size under 10MB for better performance</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <ImageDetails
          localOverlay={localOverlay as ImageOverlay}
          setLocalOverlay={handleUpdateOverlay}
        />
      )}
    </div>
  );
};
