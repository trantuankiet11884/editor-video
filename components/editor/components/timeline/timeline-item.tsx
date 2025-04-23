import React, { useCallback, useMemo, memo, useRef } from "react";
import { CaptionOverlay, Overlay, OverlayType } from "../../types";
import { useWaveformProcessor } from "../../hooks/use-waveform-processor";
import WaveformVisualizer from "../overlays/sounds/waveform-visualizer";
import { TimelineKeyframes } from "./timeline-keyframes";
import { useSidebar } from "../../contexts/sidebar-context";
import { TimelineItemHandle } from "./timeline-item-handle";
import { TimelineItemContextMenu } from "./timeline-item-context-menu";
import { TimelineItemLabel } from "./timeline-item-label";
import TimelineCaptionBlocks from "./timeline-caption-blocks";

/**
 * TimelineItem Component
 *
 * A draggable, resizable item displayed on the video editor timeline. Each item represents
 * a clip, text overlay, or sound element in the video composition.
 *
 * Features:
 * - Draggable positioning
 * - Resizable handles on both ends
 * - Context menu for quick actions
 * - Touch support for mobile devices
 * - Visual feedback for selection and dragging states
 * - Color-coded by content type (text, clip, sound)
 *
 * @component
 */

// Add new interface for waveform data
interface WaveformData {
  peaks: number[];
  length: number;
}

interface TimelineItemProps {
  /** The overlay item data to be rendered */
  item: Overlay;
  /** Whether any item is currently being dragged */
  isDragging: boolean;
  /** Reference to the item currently being dragged, if any */
  draggedItem: Overlay | null;
  /** Currently selected item in the timeline */
  selectedItem: { id: number } | null;
  /** Callback to update the selected item */
  setSelectedItem: (item: { id: number }) => void;
  /** Handler for mouse-based drag and resize operations */
  handleMouseDown: (
    action: "move" | "resize-start" | "resize-end",
    e: React.MouseEvent<HTMLDivElement>
  ) => void;
  /** Handler for touch-based drag and resize operations */
  handleTouchStart: (
    action: "move" | "resize-start" | "resize-end",
    e: React.TouchEvent<HTMLDivElement>
  ) => void;
  /** Total duration of the timeline in frames */
  totalDuration: number;
  /** Callback to delete an item */
  onDeleteItem: (id: number) => void;
  /** Callback to duplicate an item */
  onDuplicateItem: (id: number) => void;
  /** Callback to split an item at the current position */
  onSplitItem: (id: number) => void;
  /** Callback fired when hovering over an item */
  onHover: (itemId: number, position: number) => void;
  /** Callback fired when context menu state changes */
  onContextMenuChange: (open: boolean) => void;
  /** Waveform data for audio items */
  waveformData?: WaveformData;
  /** Current Frame of the video */
  currentFrame?: number;
  /** Zoom scale of the timeline */
  zoomScale: number;
}

/** Height of each timeline item in pixels */
export const TIMELINE_ITEM_HEIGHT = 40;

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  isDragging,
  draggedItem,
  selectedItem,
  setSelectedItem,
  handleMouseDown,
  handleTouchStart,
  totalDuration,
  onDeleteItem,
  onDuplicateItem,
  onSplitItem,
  onHover,
  onContextMenuChange,
  currentFrame,
  zoomScale,
}) => {
  const waveformData = useWaveformProcessor(
    item.type === OverlayType.SOUND ? item.src : undefined,
    item.type === OverlayType.SOUND ? item.startFromSound : undefined,
    item.durationInFrames
  );

  const isSelected = selectedItem?.id === item.id;
  const itemRef = useRef<HTMLDivElement>(null);
  const { setActivePanel, setIsOpen } = useSidebar();

  /**
   * Handles mouse and touch interactions with the timeline item
   * Prevents event bubbling and triggers appropriate handlers based on the action
   */
  const handleItemInteraction = (
    e: React.MouseEvent | React.TouchEvent,
    action: "click" | "mousedown" | "touchstart"
  ) => {
    e.stopPropagation();
    if (action === "click") {
      setSelectedItem({ id: item.id });
    } else if (action === "mousedown") {
      handleMouseDown("move", e as React.MouseEvent<HTMLDivElement>);
    } else if (action === "touchstart") {
      handleTouchStart("move", e as React.TouchEvent<HTMLDivElement>);
    }
  };

  /**
   * Calculates and reports the hover position within the item
   * Used for showing precise position indicators while hovering
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!e.currentTarget) {
        console.warn("Current target is null or undefined");
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      if (!rect) {
        console.warn("getBoundingClientRect returned null or undefined");
        return;
      }
      const relativeX = e.clientX - rect.left;
      const hoverPosition =
        item.from + (relativeX / rect.width) * item.durationInFrames;
      onHover(item.id, Math.round(hoverPosition));
    },
    [item, onHover]
  );

  /**
   * Returns Tailwind CSS classes for styling based on content type
   */
  const getItemClasses = (
    type: OverlayType,
    isHandle: boolean = false
  ): string => {
    switch (type) {
      case OverlayType.TEXT:
        return isHandle
          ? "bg-[#9E53E6] dark:bg-[#9E53E6]"
          : "bg-[#9E53E6] hover:bg-[#9E53E6] border-[#9E53E6] text-[#9E53E6]";
      case OverlayType.VIDEO:
        return isHandle
          ? "bg-white dark:bg-black"
          : "bg-white hover:bg-white border-slate-900 dark:border-white text-white dark:text-black";
      case OverlayType.SOUND:
        return isHandle
          ? "bg-[#E49723] dark:bg-[#E49723]"
          : "bg-[#E49723] hover:bg-[#E49723] border-[#E49723] text-[#E49723]";
      case OverlayType.CAPTION:
        return isHandle
          ? "bg-blue-500"
          : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500 text-blue-700";
      case OverlayType.IMAGE:
        return isHandle
          ? "bg-emerald-500 dark:bg-emerald-500"
          : "bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-500 border-emerald-500 dark:border-emerald-500 text-emerald-500 dark:text-white";
      default:
        return isHandle
          ? "bg-gray-200 dark:bg-gray-700"
          : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border-gray-300 dark:border-gray-400 text-gray-950 dark:text-white";
    }
  };

  const itemClasses = useMemo(() => getItemClasses(item.type), [item.type]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem({ id: item.id });

    if (
      item.type === OverlayType.VIDEO ||
      item.type === OverlayType.TEXT ||
      item.type === OverlayType.SOUND ||
      item.type === OverlayType.CAPTION ||
      item.type === OverlayType.IMAGE
    ) {
      setActivePanel(item.type);
      setIsOpen(true);
    }
  };

  const renderContent = () => {
    return (
      <>
        {item.type === OverlayType.IMAGE ? (
          <div className="h-full w-full flex items-center">
            <img
              src={item.src}
              alt=""
              draggable="false"
              onDragStart={(e) => e.preventDefault()}
              className="h-7 rounded-xs ml-6 w-full object-cover "
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center px-2">
            <TimelineItemLabel item={item} isSelected={isSelected} />
          </div>
        )}
        {item.type === OverlayType.CAPTION && (
          <div className="relative h-full">
            <TimelineCaptionBlocks
              captions={(item as CaptionOverlay).captions}
              durationInFrames={item.durationInFrames}
              currentFrame={currentFrame ?? 0}
              startFrame={item.from}
              totalDuration={totalDuration}
            />
          </div>
        )}
        {item.type === OverlayType.SOUND && waveformData && (
          <div className="absolute inset-0">
            <WaveformVisualizer
              waveformData={waveformData}
              totalDuration={totalDuration}
              durationInFrames={item.durationInFrames}
            />
          </div>
        )}
        {item.type === OverlayType.VIDEO && (
          <TimelineKeyframes
            overlay={item}
            currentFrame={currentFrame ?? 0}
            zoomScale={zoomScale}
          />
        )}
      </>
    );
  };

  return (
    <TimelineItemContextMenu
      onOpenChange={onContextMenuChange}
      onDeleteItem={onDeleteItem}
      onDuplicateItem={onDuplicateItem}
      onSplitItem={onSplitItem}
      itemId={item.id}
    >
      <div
        ref={itemRef}
        className={`absolute inset-y-[0.9px] rounded-md shadow-md cursor-grab group 
        ${itemClasses} 
        ${isDragging && draggedItem?.id === item.id ? "opacity-50" : ""} 
        ${
          isSelected
            ? "border-2 border-black dark:border-white"
            : "border-[0px]"
        } 
        select-none pointer-events-auto overflow-hidden`}
        style={{
          left: `${(item.from / totalDuration) * 100}%`,
          width: `${(item.durationInFrames / totalDuration) * 100}%`,
          zIndex: isDragging ? 1 : 30,
        }}
        onMouseDown={(e) => handleItemInteraction(e, "mousedown")}
        onTouchStart={(e) => handleItemInteraction(e, "touchstart")}
        onClick={handleSelect}
        onMouseMove={handleMouseMove}
      >
        {renderContent()}
        <TimelineItemHandle
          position="left"
          isSelected={isSelected}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown("resize-start", e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart("resize-start", e);
          }}
        />
        <TimelineItemHandle
          position="right"
          isSelected={isSelected}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown("resize-end", e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart("resize-end", e);
          }}
        />
      </div>
    </TimelineItemContextMenu>
  );
};

export default memo(TimelineItem);
