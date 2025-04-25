import { Player, PlayerRef } from "@remotion/player";
import React, { useEffect } from "react";
import { FPS } from "../../constants";
import { useEditorContext } from "../../contexts/editor-context";
import { Main } from "../../remotion/main";

// Custom type for prefetch return value
// interface PrefetchResult {
//   waitUntilDone: () => Promise<string>;
//   free: () => void;
// }

/**
 * Props for the VideoPlayer component
 * @interface VideoPlayerProps
 * @property {React.RefObject<PlayerRef>} playerRef - Reference to the Remotion player instance
 */
interface VideoPlayerProps {
  playerRef: React.RefObject<PlayerRef>;
}

/**
 * VideoPlayer component that renders a responsive video editor with overlay support
 * The player automatically resizes based on its container and maintains the specified aspect ratio
 * Preloads video, image, and audio resources to ensure smooth playback
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ playerRef }) => {
  const {
    overlays,
    setSelectedOverlayId,
    changeOverlay,
    selectedOverlayId,
    aspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
    durationInFrames,
  } = useEditorContext();

  // Lưu trữ tham chiếu đến các tài nguyên đã prefetch để quản lý và giải phóng
  // const prefetchedResources = useRef<Map<string, PrefetchResult>>(new Map());

  // /**
  //  * Type guard to check if an overlay has an src property
  //  */
  // const hasSrc = (
  //   overlay: Overlay
  // ): overlay is ImageOverlay | ClipOverlay | SoundOverlay => {
  //   return (
  //     overlay.type === OverlayType.IMAGE ||
  //     overlay.type === OverlayType.VIDEO ||
  //     overlay.type === OverlayType.SOUND
  //   );
  // };

  /**
   * Preload all media resources (videos, images, audios) from overlays
   */
  // useEffect(() => {
  //   const preloadResources = async () => {
  //     // Lấy danh sách các src duy nhất từ overlays có src
  //     const uniqueSrcs = new Set<string>(
  //       overlays
  //         .filter(hasSrc) // Chỉ lấy overlays có src
  //         .map((overlay) => overlay.src)
  //         .filter((src): src is string => !!src) // Loại bỏ undefined/null
  //     );

  //     // Preload mỗi tài nguyên
  //     for (const src of Array.from(uniqueSrcs)) {
  //       // Convert Set to Array
  //       if (prefetchedResources.current.has(src)) continue;

  //       try {
  //         console.log(`Preloading resource: ${src}`);
  //         const result = prefetch(src);
  //         prefetchedResources.current.set(src, result);

  //         // Theo dõi trạng thái preload
  //         const blobUrl = await result.waitUntilDone();
  //         console.log(
  //           `Resource preloaded successfully: ${src}, Blob URL: ${blobUrl}`
  //         );
  //       } catch (error) {
  //         console.error(`Failed to preload resource ${src}:`, error);
  //       }
  //     }
  //   };

  //   preloadResources();

  //   // Cleanup: Giải phóng tài nguyên khi component unmount hoặc overlays thay đổi
  //   return () => {
  //     prefetchedResources.current.forEach((resource, src) => {
  //       console.log(`Freeing prefetched resource: ${src}`);
  //       resource.free();
  //     });
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //     prefetchedResources.current.clear();
  //   };
  // }, [overlays]);

  /**
   * Updates the player dimensions when the container size or aspect ratio changes
   */
  useEffect(() => {
    const handleDimensionUpdate = () => {
      const videoContainer = document.querySelector(".video-container");
      if (!videoContainer) return;

      const { width, height } = videoContainer.getBoundingClientRect();
      updatePlayerDimensions(width, height);
    };

    handleDimensionUpdate(); // Initial update
    window.addEventListener("resize", handleDimensionUpdate);

    return () => {
      window.removeEventListener("resize", handleDimensionUpdate);
    };
  }, [aspectRatio, updatePlayerDimensions]);

  const { width: compositionWidth, height: compositionHeight } =
    getAspectRatioDimensions();

  // Constants for player configuration
  const PLAYER_CONFIG = {
    durationInFrames: durationInFrames,
    fps: FPS,
  };

  return (
    <div className="w-full lg:h-full">
      {/* Grid background container */}
      <div
        className="z-0 video-container relative w-full h-full
        bg-slate-100/90 dark:bg-gray-800
        bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] 
        dark:bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)]
        bg-[size:16px_16px] 
        shadow-lg"
      >
        {/* Player wrapper with centering */}
        <div className="z-10 absolute inset-4 flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: Math.min(playerDimensions.width, compositionWidth),
              height: Math.min(playerDimensions.height, compositionHeight),
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <Player
              ref={playerRef}
              className="w-full h-full"
              component={Main}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              style={{
                width: "100%",
                height: "100%",
              }}
              durationInFrames={PLAYER_CONFIG.durationInFrames}
              fps={PLAYER_CONFIG.fps}
              inputProps={{
                overlays,
                setSelectedOverlayId,
                changeOverlay,
                selectedOverlayId,
                durationInFrames,
                fps: FPS,
                width: compositionWidth,
                height: compositionHeight,
              }}
              errorFallback={() => <></>}
              overflowVisible
            />
          </div>
        </div>
      </div>
    </div>
  );
};
