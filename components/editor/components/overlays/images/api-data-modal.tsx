/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ImageIcon, Loader2, Plus, RefreshCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getApi,
  Project,
  Arc,
  Scene,
  Shot,
  Character,
  ltxApi,
} from "@/lib/api";
import Image from "next/image";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import {
  Caption,
  CaptionOverlay,
  Overlay,
  OverlayType,
  SoundOverlay,
} from "../../../types";
import { useTimeline } from "../../../contexts/timeline-context";

// Define cache type
interface ProjectDataCache {
  arcs: Arc[];
  scenes: Scene[];
  shots: Shot[];
  characters: Character[];
}

// Extend Shot interface to match provided data
interface ExtendedShot extends Shot {
  duration: number; // Duration in seconds
  audioUrl: string; // Audio URL for voice-over or sound
  imageUrl: string;
  videoUrl: string;
  content: string;
}

// Global cache to persist data across modal instances
const globalCache: Record<string, ProjectDataCache> = {};

interface DataExplorerModalProps {
  selectedProject: Project;
  onClose: () => void;
}

const FIXED_ROWS = {
  captions: 1,
  images: 2,
  videos: 3,
  sounds: 4,
};

export const DataExplorerModal: React.FC<DataExplorerModalProps> = ({
  selectedProject,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [cache, setCache] =
    useState<Record<string, ProjectDataCache>>(globalCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMedia, setVisibleMedia] = useState<Set<string>>(new Set());
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null);
  const [addingScenes, setAddingScenes] = useState<Set<string>>(new Set());
  const [fetchedScenes, setFetchedScenes] = useState<Set<string>>(new Set()); // Track fetched scenes
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { addOverlay, overlays, durationInFrames } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();

  const FRAMERATE = 30; // Frames per second
  const DEFAULT_IMAGE_DURATION = 4; // 4 seconds
  const DEFAULT_VIDEO_SOUND_DURATION = 6.67; // ~6.67 seconds

  // Fetch project data only if not cached
  useEffect(() => {
    if (!cache[selectedProject._id]) {
      const fetchProjectData = async () => {
        setLoading(true);
        setError(null);
        try {
          const arcsData = await getApi.getArcs(selectedProject._id);
          const charactersData = await getApi.getCharacters(
            selectedProject._id
          );
          const allScenes: Scene[] = [];
          for (const arc of arcsData) {
            const scenesData = await ltxApi.scenes.getAll(arc._id);
            allScenes.push(...scenesData.data);
          }
          const newCacheEntry: ProjectDataCache = {
            arcs: arcsData,
            scenes: allScenes,
            shots: [],
            characters: charactersData,
          };
          setCache((prev) => {
            const updatedCache = {
              ...prev,
              [selectedProject._id]: newCacheEntry,
            };
            globalCache[selectedProject._id] = newCacheEntry;
            return updatedCache;
          });
        } catch (err) {
          setError("Failed to load project data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProjectData();
    }
  }, [selectedProject._id]);

  // Select the first arc by default when arcs are available
  useEffect(() => {
    const arcs = cache[selectedProject._id]?.arcs || [];
    if (arcs.length > 0 && !selectedArc) {
      setSelectedArc(arcs[0]);
    }
  }, [cache, selectedProject._id, selectedArc]);

  // Setup IntersectionObserver for lazy loading media
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const mediaId = entry.target.getAttribute("data-media-id");
            if (mediaId) {
              setVisibleMedia((prev) => new Set(prev).add(mediaId));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  // Handle data refresh
  const handleRefreshData = async () => {
    setLoading(true);
    setError(null);
    setSelectedArc(null);
    setVisibleMedia(new Set());
    setAddingScenes(new Set());
    setFetchedScenes(new Set());

    // Clear cache for the current project
    setCache((prev) => {
      const updatedCache = { ...prev };
      delete updatedCache[selectedProject._id];
      delete globalCache[selectedProject._id];
      return updatedCache;
    });
  };

  // Fetch shots for a scene only if not cached or fetched
  const fetchShotsForScene = async (sceneId: string) => {
    if (fetchedScenes.has(sceneId)) {
      return;
    }

    const existingShots = cache[selectedProject._id]?.shots || [];
    if (existingShots.some((shot) => shot.sceneId === sceneId)) {
      return;
    }

    try {
      const shotsData = await ltxApi.shots.getAll(sceneId);
      setCache((prev) => {
        const currentProjectCache = prev[selectedProject._id] || {
          arcs: [],
          scenes: [],
          shots: [],
          characters: [],
        };
        const updatedCache = {
          ...prev,
          [selectedProject._id]: {
            ...currentProjectCache,
            shots: [
              ...currentProjectCache.shots.filter((s) => s.sceneId !== sceneId),
              ...shotsData.data,
            ],
          },
        };
        globalCache[selectedProject._id] = updatedCache[selectedProject._id];
        return updatedCache;
      });
      setFetchedScenes((prev) => new Set(prev).add(sceneId));
    } catch (err) {
      console.error(`Failed to fetch shots for scene ${sceneId}:`, err);
      setError(`Failed to load shots for scene: ${sceneId}`);
      setFetchedScenes((prev) => new Set(prev).add(sceneId));
    }
  };

  // Create image overlay
  const createImageOverlay = (
    src: string,
    position: { from: number; row: number },
    durationInFrames: number
  ) => {
    const { width, height } = getAspectRatioDimensions();
    const newOverlay: Overlay = {
      left: 0,
      top: 0,
      width,
      height,
      durationInFrames,
      from: position.from,
      id: Date.now() + Math.floor(Math.random() * 1000),
      rotation: 0,
      row: position.row,
      isDragging: false,
      type: OverlayType.IMAGE,
      src,
      styles: {
        objectFit: "cover",
        animation: {
          enter: "fade",
          exit: "fade",
        },
      },
    };
    addOverlay(newOverlay);
  };

  // Create video overlay
  const createVideoOverlay = (
    src: string,
    thumbnailSrc: string = "",
    position: { from: number; row: number },
    durationInFrames: number
  ) => {
    const { width, height } = getAspectRatioDimensions();
    const newOverlay: Overlay = {
      left: 0,
      top: 0,
      width,
      height,
      durationInFrames,
      from: position.from,
      id: Date.now() + Math.floor(Math.random() * 1000),
      rotation: 0,
      row: position.row,
      isDragging: false,
      type: OverlayType.VIDEO,
      content: thumbnailSrc || "",
      src,
      videoStartTime: 0,
      styles: {
        opacity: 1,
        zIndex: 100,
        transform: "none",
        objectFit: "cover",
        animation: {
          enter: "fade",
          exit: "fade",
        },
      },
    };
    addOverlay(newOverlay);
  };

  // Create sound overlay
  const createSoundOverlay = (
    src: string,
    title: string = "Shot Sound",
    position: { from: number; row: number },
    durationInFrames: number
  ) => {
    const newSoundOverlay: SoundOverlay = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: OverlayType.SOUND,
      content: title,
      src,
      from: position.from,
      row: position.row,
      left: 0,
      top: 0,
      width: 1920,
      height: 100,
      rotation: 0,
      isDragging: false,
      durationInFrames,
      styles: {
        opacity: 1,
      },
    };
    addOverlay(newSoundOverlay);
  };

  // Create caption overlay (new)
  const createCaptionOverlay = (
    captions: Caption[],
    position: { from: number; row: number },
    durationInFrames: number
  ) => {
    const newCaptionOverlay: CaptionOverlay = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: OverlayType.CAPTION,
      from: position.from,
      durationInFrames,
      captions,
      left: 230, // Default position from CaptionsPanel
      top: 414,
      width: 833,
      height: 269,
      rotation: 0,
      isDragging: false,
      row: FIXED_ROWS.videos, // Use single row
    };
    addOverlay(newCaptionOverlay);
  };

  const handleAddAllCaptionsForScene = async (
    sceneId: string,
    shots: ExtendedShot[]
  ) => {
    const key = `${sceneId}:captions`;
    if (addingScenes.has(key) || shots.length === 0) return;

    setAddingScenes((prev) => new Set(prev).add(key));

    try {
      // Filter shots with a description (or adjust to another field if needed)
      const validCaptions = shots.filter((shot) => shot.voice_over);
      if (validCaptions.length === 0) return;

      // Find the last overlay's end time in the target row
      const targetOverlays = overlays.filter(
        (overlay) => overlay.row === FIXED_ROWS.captions
      );
      const lastEndFrame = targetOverlays.length
        ? Math.max(...targetOverlays.map((o) => o.from + o.durationInFrames))
        : 0;

      // eslint-disable-next-line prefer-const
      let currentFrom = lastEndFrame;
      const captions: Caption[] = [];
      let totalDurationMs = 0;

      for (let i = 0; i < validCaptions.length; i++) {
        const shot = validCaptions[i];
        const durationSec =
          shot.duration && shot.duration > 0
            ? shot.duration
            : DEFAULT_IMAGE_DURATION; // Use same default as images
        const durationMs = durationSec * 1000;

        // Split description into words for timing (mimicking CaptionsPanel)
        const words = shot.voice_over.trim().split(/\s+/);
        const wordsPerMinute = 160; // From CaptionsPanel
        const msPerWord = (60 * 1000) / wordsPerMinute;

        const processedWords = words.map((word, index) => ({
          word,
          startMs: totalDurationMs + index * msPerWord,
          endMs: totalDurationMs + (index + 1) * msPerWord,
          confidence: 0.99,
        }));

        const caption: Caption = {
          text: shot.voice_over,
          startMs: totalDurationMs,
          endMs: totalDurationMs + durationMs,
          timestampMs: null,
          confidence: 0.99,
          words: processedWords,
        };

        captions.push(caption);
        totalDurationMs += durationMs;

        if (i % 5 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Calculate total duration in frames
      const calculatedDurationInFrames = Math.ceil(
        (totalDurationMs / 1000) * FRAMERATE
      );

      const position = {
        from: currentFrom,
        row: FIXED_ROWS.captions,
      };

      createCaptionOverlay(captions, position, calculatedDurationInFrames);
    } finally {
      setAddingScenes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Add all images for a specific scene
  const handleAddAllImagesForScene = async (
    sceneId: string,
    shots: ExtendedShot[]
  ) => {
    const key = `${sceneId}:images`;
    if (addingScenes.has(key) || shots.length === 0) return;

    setAddingScenes((prev) => new Set(prev).add(key));

    try {
      const validImages = shots.filter((shot) => shot.imageUrl);
      if (validImages.length === 0) return;

      // Find the last overlay's end time in the target row
      const targetOverlays = overlays.filter(
        (overlay) => overlay.row === FIXED_ROWS.images
      );
      const lastEndFrame = targetOverlays.length
        ? Math.max(...targetOverlays.map((o) => o.from + o.durationInFrames))
        : 0;

      let currentFrom = lastEndFrame;
      for (let i = 0; i < validImages.length; i++) {
        const shot = validImages[i];
        const durationSec =
          shot.duration && shot.duration > 0
            ? shot.duration
            : DEFAULT_IMAGE_DURATION;
        const durationInFrames = Math.round(durationSec * FRAMERATE);
        const position = {
          from: currentFrom,
          row: FIXED_ROWS.images,
        };
        createImageOverlay(shot.imageUrl!, position, durationInFrames);
        currentFrom += durationInFrames;

        if (i % 5 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    } finally {
      setAddingScenes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Add all videos for a specific scene
  const handleAddAllVideosForScene = async (
    sceneId: string,
    shots: ExtendedShot[]
  ) => {
    const key = `${sceneId}:videos`;
    if (addingScenes.has(key) || shots.length === 0) return;

    setAddingScenes((prev) => new Set(prev).add(key));

    try {
      const validVideos = shots.filter((shot) => shot.videoUrl);
      if (validVideos.length === 0) return;

      // Find the last overlay's end time in the target row
      const targetOverlays = overlays.filter(
        (overlay) => overlay.row === FIXED_ROWS.videos
      );
      const lastEndFrame = targetOverlays.length
        ? Math.max(...targetOverlays.map((o) => o.from + o.durationInFrames))
        : 0;

      let currentFrom = lastEndFrame;
      for (let i = 0; i < validVideos.length; i++) {
        const shot = validVideos[i];
        const durationSec =
          shot.duration && shot.duration > 0
            ? shot.duration
            : DEFAULT_VIDEO_SOUND_DURATION;
        const durationInFrames = Math.round(durationSec * FRAMERATE);
        const position = {
          from: currentFrom,
          row: FIXED_ROWS.videos,
        };
        createVideoOverlay(
          shot.videoUrl!,
          shot.imageUrl || "",
          position,
          durationInFrames
        );
        currentFrom += durationInFrames;

        if (i % 5 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    } finally {
      setAddingScenes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Add all sounds for a specific scene
  const handleAddAllSoundsForScene = async (
    sceneId: string,
    shots: ExtendedShot[]
  ) => {
    const key = `${sceneId}:sounds`;
    if (addingScenes.has(key) || shots.length === 0) return;

    setAddingScenes((prev) => new Set(prev).add(key));

    try {
      const validSounds = shots.filter((shot) => shot.audioUrl);
      if (validSounds.length === 0) return;

      // Find the last overlay's end time in the target row
      const targetOverlays = overlays.filter(
        (overlay) => overlay.row === FIXED_ROWS.sounds
      );
      const lastEndFrame = targetOverlays.length
        ? Math.max(...targetOverlays.map((o) => o.from + o.durationInFrames))
        : 0;

      let currentFrom = lastEndFrame;
      for (let i = 0; i < validSounds.length; i++) {
        const shot = validSounds[i];
        const durationSec =
          shot.duration && shot.duration > 0
            ? shot.duration
            : DEFAULT_VIDEO_SOUND_DURATION;
        const durationInFrames = Math.round(durationSec * FRAMERATE);
        const position = {
          from: currentFrom,
          row: FIXED_ROWS.sounds,
        };
        createSoundOverlay(
          shot.audioUrl!,
          `Shot Sound ${shot._id}`,
          position,
          durationInFrames
        );
        currentFrom += durationInFrames;

        if (i % 5 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    } finally {
      setAddingScenes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };
  // Get data from cache or use empty arrays
  const arcs = cache[selectedProject._id]?.arcs || [];
  const scenes = cache[selectedProject._id]?.scenes || [];
  const shots = cache[selectedProject._id]?.shots || [];
  const characters = cache[selectedProject._id]?.characters || [];

  // Filter scenes and shots by selected arc
  const filteredScenes = selectedArc
    ? scenes.filter((scene) => scene.arcId === selectedArc._id)
    : scenes;
  const filteredShots = selectedArc
    ? shots.filter((shot) => shot.arcId === selectedArc._id)
    : shots;

  // Group shots by arc and scene
  const groupedShots = filteredShots.reduce((acc, shot) => {
    const key = `${shot.arcId}-${shot.sceneId}`;
    if (!acc[key]) {
      acc[key] = { arcId: shot.arcId, sceneId: shot.sceneId, shots: [] };
    }
    acc[key].shots.push(shot);
    return acc;
  }, {} as Record<string, { arcId: string; sceneId: string; shots: ExtendedShot[] }>);

  // Group characters by arc
  const groupedCharacters = characters.reduce((acc, char) => {
    const arcId = char.arcId || "no-arc";
    if (!acc[arcId]) {
      acc[arcId] = [];
    }
    acc[arcId].push(char);
    return acc;
  }, {} as Record<string, Character[]>);

  // Helper functions
  const getArcTitle = (arcId: string) => {
    const arc = arcs.find((a) => a._id === arcId);
    return arc ? arc.title : "Unknown Arc";
  };

  const getSceneName = (sceneId: string) => {
    const scene = scenes.find((s) => s._id === sceneId);
    return scene ? scene.name : "Unknown Scene";
  };

  // Attach IntersectionObserver to cards
  const observeCard = (element: HTMLElement | null, mediaId: string) => {
    if (element && observerRef.current) {
      element.setAttribute("data-media-id", mediaId);
      observerRef.current.observe(element);
    }
  };

  // Fetch shots for scenes that are not cached or fetched
  useEffect(() => {
    filteredScenes.forEach((scene) => {
      if (
        !fetchedScenes.has(scene._id) &&
        !groupedShots[`${scene.arcId}-${scene._id}`]
      ) {
        fetchShotsForScene(scene._id);
      }
    });
  }, [filteredScenes, fetchedScenes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArc(null);
      setVisibleMedia(new Set());
      setAddingScenes(new Set());
      setFetchedScenes(new Set());
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-6xl h-[90vh] flex flex-col overflow-hidden p-4"
        aria-describedby="api-data-modal"
      >
        <div className="flex justify-between items-center">
          <DialogTitle>{selectedProject.title}</DialogTitle>
          <Button
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
            {loading && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
          </Button>
        </div>
        <div className="flex h-full overflow-hidden">
          {/* Sidebar for Arcs */}
          <div className="w-1/4 border-r p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Arcs</h2>
            {error && <p className="text-red-500">{error}</p>}
            <ScrollArea className="flex-1">
              <div className="flex flex-col space-y-2">
                {arcs.map((arc) => (
                  <p
                    key={arc._id}
                    className={`cursor-pointer rounded-md p-2 line-clamp-2 ${
                      selectedArc?._id === arc._id
                        ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setSelectedArc(arc)}
                  >
                    {arc.title}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="w-3/4 p-4">
            <Tabs defaultValue="shots" className="h-full">
              <TabsList>
                <TabsTrigger value="shots">Shots</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
              </TabsList>

              {/* Shots Tab */}
              <TabsContent value="shots" className="h-[80vh] overflow-auto">
                <h3 className="text-lg font-semibold mb-4">
                  Shots for {selectedArc?.title || "All Arcs"}
                </h3>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : filteredScenes.length === 0 ? (
                  <p>No shots available.</p>
                ) : (
                  <div className="space-y-6">
                    {filteredScenes.map((scene) => {
                      const group = groupedShots[`${scene.arcId}-${scene._id}`];
                      return (
                        <div key={scene._id}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-md font-medium">
                              {getArcTitle(scene.arcId)} - {scene.name}
                            </h4>
                            {group && group.shots.length > 0 && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleAddAllImagesForScene(
                                      scene._id,
                                      group.shots
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    addingScenes.has(`${scene._id}:images`) ||
                                    !group.shots.some((shot) => shot.imageUrl)
                                  }
                                  className="text-sm flex items-center gap-1.5"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add All Images
                                  {addingScenes.has(`${scene._id}:images`) && (
                                    <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleAddAllVideosForScene(
                                      scene._id,
                                      group.shots
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    addingScenes.has(`${scene._id}:videos`) ||
                                    !group.shots.some((shot) => shot.videoUrl)
                                  }
                                  className="text-sm flex items-center gap-1.5"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add All Videos
                                  {addingScenes.has(`${scene._id}:videos`) && (
                                    <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleAddAllSoundsForScene(
                                      scene._id,
                                      group.shots
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    addingScenes.has(`${scene._id}:sounds`) ||
                                    !group.shots.some((shot) => shot.audioUrl)
                                  }
                                  className="text-sm flex items-center gap-1.5"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add All Sounds
                                  {addingScenes.has(`${scene._id}:sounds`) && (
                                    <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleAddAllCaptionsForScene(
                                      scene._id,
                                      group.shots
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    addingScenes.has(`${scene._id}:captions`) ||
                                    !group.shots.some((shot) => shot.voice_over)
                                  }
                                  className="text-sm flex items-center gap-1.5"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add All Captions
                                  {addingScenes.has(
                                    `${scene._id}:captions`
                                  ) && (
                                    <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                          {group ? (
                            <ScrollArea className="w-full whitespace-nowrap">
                              <div className="flex space-x-4 py-4 overflow-x-auto max-w-3xl">
                                {group.shots.map((shot) => (
                                  <Card
                                    key={shot._id}
                                    className="w-[250px] flex-shrink-0"
                                    ref={(el) => observeCard(el, shot._id)}
                                  >
                                    <CardContent className="p-4">
                                      {shot.imageUrl ? (
                                        <Image
                                          src={shot.imageUrl}
                                          alt="Shot thumbnail"
                                          width={250}
                                          height={128}
                                          className="w-full h-32 object-cover mb-2"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-full h-32 bg-gray-200 mb-2 flex items-center justify-center">
                                          <ImageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                      )}
                                      {shot.audioUrl &&
                                        visibleMedia.has(shot._id) && (
                                          <audio
                                            src={shot.audioUrl}
                                            controls
                                            preload="none"
                                            className="w-full mb-2"
                                          />
                                        )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <p>No shots available.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Characters Tab */}
              <TabsContent
                value="characters"
                className="h-[80vh] overflow-auto"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Characters for {selectedArc?.title || "All Arcs"}
                </h3>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : Object.values(groupedCharacters).length === 0 ? (
                  <p>No characters available.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedCharacters)
                      .filter(([arcId]) =>
                        selectedArc ? arcId === selectedArc._id : true
                      )
                      .map(([arcId, chars]) => (
                        <div key={arcId}>
                          <h4 className="text-md font-medium">
                            {arcId === "no-arc"
                              ? "Multiple Arcs"
                              : getArcTitle(arcId)}
                          </h4>
                          <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex space-x-4 py-4 overflow-x-auto max-w-3xl">
                              {chars
                                .filter((char) => char.imageUrl)
                                .map((char) => (
                                  <Card
                                    key={char._id}
                                    className="w-[250px] flex-shrink-0"
                                    ref={(el) => observeCard(el, char._id)}
                                  >
                                    <CardHeader>
                                      <CardTitle className="text-sm">
                                        {char.name}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {char.imageUrl &&
                                      visibleMedia.has(char._id) ? (
                                        <Image
                                          src={char.imageUrl}
                                          alt={char.name}
                                          width={100}
                                          height={100}
                                          className="w-full h-32 object-cover mb-2"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-full h-32 bg-gray-200 mb-2 flex items-center justify-center">
                                          <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const position =
                                            findNextAvailablePosition(
                                              overlays,
                                              visibleRows,
                                              durationInFrames
                                            );
                                          createImageOverlay(
                                            char.imageUrl || "",
                                            position,
                                            120
                                          );
                                        }}
                                        disabled={!char.imageUrl}
                                      >
                                        Add Image
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </ScrollArea>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
