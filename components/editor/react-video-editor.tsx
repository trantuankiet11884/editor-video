"use client";

// UI Components
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/sidebar/app-sidebar";
import { Editor } from "./components/core/editor";
import { SidebarProvider as UISidebarProvider } from "@/components/ui/sidebar";
import { SidebarProvider as EditorSidebarProvider } from "./contexts/sidebar-context";

// Context Providers
import { EditorProvider } from "./contexts/editor-context";

// Custom Hooks
import { useOverlays } from "./hooks/use-overlays";
import { useVideoPlayer } from "./hooks/use-video-player";
import { useTimelineClick } from "./hooks/use-timeline-click";
import { useAspectRatio } from "./hooks/use-aspect-ratio";
import { useCompositionDuration } from "./hooks/use-composition-duration";
import { useHistory } from "./hooks/use-history";

// Types
import { Overlay } from "./types";
import { useRendering } from "./hooks/use-rendering";
import { FPS } from "./constants";
import { TimelineProvider } from "./contexts/timeline-context";

export default function ReactVideoEditor() {
  // Overlay management hooks
  const {
    overlays,
    setOverlays,
    selectedOverlayId,
    setSelectedOverlayId,
    changeOverlay,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    deleteOverlaysByRow,
    updateOverlayStyles,
    resetOverlays,
  } = useOverlays();

  // Video player controls and state
  const { isPlaying, currentFrame, playerRef, togglePlayPause, formatTime } =
    useVideoPlayer();

  // Composition duration calculations
  const { durationInFrames, durationInSeconds } =
    useCompositionDuration(overlays);

  // Aspect ratio and player dimension management
  const {
    aspectRatio,
    setAspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
  } = useAspectRatio();

  // Event handlers
  const handleOverlayChange = (updatedOverlay: Overlay) => {
    changeOverlay(updatedOverlay.id, () => updatedOverlay);
  };

  const { width: compositionWidth, height: compositionHeight } =
    getAspectRatioDimensions();

  const handleTimelineClick = useTimelineClick(playerRef, durationInFrames);

  const inputProps = {
    overlays,
    durationInFrames,
    fps: FPS,
    width: compositionWidth,
    height: compositionHeight,
    src: "",
  };

  const { renderMedia, state } = useRendering("TestComponent", inputProps);

  // Replace history management code with hook
  const { undo, redo, canUndo, canRedo } = useHistory(overlays, setOverlays);

  // Combine all editor context values
  const editorContextValue = {
    // Overlay management
    overlays,
    setOverlays,
    selectedOverlayId,
    setSelectedOverlayId,
    changeOverlay,
    handleOverlayChange,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    resetOverlays,

    // Player controls
    isPlaying,
    currentFrame,
    playerRef,
    togglePlayPause,
    formatTime,
    handleTimelineClick,

    // Dimensions and duration
    aspectRatio,
    setAspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
    durationInFrames,
    durationInSeconds,

    // Add rendering related values
    renderMedia,
    state,

    deleteOverlaysByRow,

    // History management
    undo,
    redo,
    canUndo,
    canRedo,

    // New style management
    updateOverlayStyles,
  };

  return (
    <UISidebarProvider>
      <EditorSidebarProvider>
        <TimelineProvider>
          <EditorProvider value={editorContextValue}>
            <AppSidebar />
            <SidebarInset>
              <Editor />
            </SidebarInset>
          </EditorProvider>
        </TimelineProvider>
      </EditorSidebarProvider>
    </UISidebarProvider>
  );
}
