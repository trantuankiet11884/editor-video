import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, UploadCloud, Music } from "lucide-react";
import { LocalSound, OverlayType, SoundOverlay } from "../../../types";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { localSounds } from "../../../templates/sound-templates";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { SoundDetails } from "./sound-details";
import { FileUpload } from "../../shared/file-upload";
import {
  useFileUpload,
  getAcceptedFileTypes,
  formatFileSize,
} from "../../../hooks/use-file-upload";

/**
 * SoundsPanel Component
 *
 * A panel component that manages sound overlays in the editor. It provides functionality for:
 * - Displaying a list of available sound tracks
 * - Uploading custom audio files from the user's device
 * - Playing/pausing sound previews
 * - Adding sounds to the timeline
 * - Managing selected sound overlays and their properties
 *
 * The component switches between views:
 * 1. Sound library view: Shows available sounds and upload option
 * 2. Sound details view: Shows controls for the currently selected sound overlay
 *
 * @component
 */
const SoundsPanel: React.FC = () => {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
  } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<SoundOverlay | null>(null);
  const { uploadFile, isLoading: isUploading } = useFileUpload();
  const [uploadedAudios, setUploadedAudios] = useState<LocalSound[]>([]);
  const [currentAudioPreview, setCurrentAudioPreview] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.SOUND) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  /**
   * Updates the local overlay state and propagates changes to the editor context
   * @param {SoundOverlay} updatedOverlay - The modified sound overlay
   */
  const handleUpdateOverlay = (updatedOverlay: SoundOverlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  /**
   * Initialize audio elements for each sound and handle cleanup
   */
  useEffect(() => {
    const allSounds = [...localSounds, ...uploadedAudios];

    allSounds.forEach((sound) => {
      if (!audioRefs.current[sound.id]) {
        audioRefs.current[sound.id] = new Audio(sound.file);

        // Setup ended event to reset playing state
        audioRefs.current[sound.id].addEventListener("ended", () => {
          if (playingTrack === sound.id) {
            setPlayingTrack(null);
          }
        });
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [localSounds, uploadedAudios, playingTrack]);

  /**
   * Toggles play/pause state for a sound track
   * Ensures only one track plays at a time
   *
   * @param soundId - Unique identifier of the sound to toggle
   */
  const togglePlay = (soundId: string) => {
    const audio = audioRefs.current[soundId];
    if (!audio) return;

    if (playingTrack === soundId) {
      audio.pause();
      setPlayingTrack(null);
    } else {
      if (playingTrack && audioRefs.current[playingTrack]) {
        audioRefs.current[playingTrack].pause();
      }
      audio
        .play()
        .catch((error) => console.error("Error playing audio:", error));
      setPlayingTrack(soundId);
    }
  };

  /**
   * Creates a sound overlay from the given sound data
   * @param {LocalSound} sound - The sound data to create an overlay from
   */
  const createSoundOverlay = (sound: LocalSound) => {
    // Find the next available position on the timeline
    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    // Create the sound overlay configuration
    const newSoundOverlay: SoundOverlay = {
      id: Date.now(),
      type: OverlayType.SOUND,
      content: sound.title,
      src: sound.file,
      from,
      row,
      // Layout properties
      left: 0,
      top: 0,
      width: 1920,
      height: 100,
      rotation: 0,
      isDragging: false,
      durationInFrames: sound.duration * 30, // 30fps
      styles: {
        opacity: 1,
      },
    };

    addOverlay(newSoundOverlay);
  };

  /**
   * Handles file upload from the user's device
   * Creates a new audio track from the uploaded file
   * @param file - The uploaded audio file
   */
  const handleFileUpload = async (file: File) => {
    try {
      const audioUrl = await uploadFile(file);
      setCurrentAudioPreview(audioUrl);

      // Create an audio element to get duration
      const audio = new Audio(audioUrl);

      audio.addEventListener("loadedmetadata", () => {
        const newSound: LocalSound = {
          id: `upload-${Date.now()}`,
          title: file.name.split(".")[0] || "Uploaded Audio",
          artist: "Uploaded by User",
          file: audioUrl,
          duration: audio.duration || 10, // Default to 10 seconds if can't determine
        };

        setUploadedAudios((prev) => [...prev, newSound]);

        // Add reference for playback
        audioRefs.current[newSound.id] = audio;

        // Automatically add to timeline if desired
        createSoundOverlay(newSound);
      });

      audio.addEventListener("error", () => {
        console.error("Error loading audio metadata");
        // Still create the sound with estimated duration
        const newSound: LocalSound = {
          id: `upload-${Date.now()}`,
          title: file.name.split(".")[0] || "Uploaded Audio",
          artist: "Uploaded by User",
          file: audioUrl,
          duration: 10, // Default duration
        };

        setUploadedAudios((prev) => [...prev, newSound]);
        createSoundOverlay(newSound);
      });
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  /**
   * Renders an individual sound card with play controls and metadata
   * Clicking the card adds the sound to the timeline
   * Clicking the play button toggles sound preview
   *
   * @param {LocalSound} sound - The sound track data to render
   * @returns {JSX.Element} A sound card component
   */
  const renderSoundCard = (sound: LocalSound) => (
    <div
      key={sound.id}
      onClick={() => createSoundOverlay(sound)}
      className="group flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-md 
        border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900
        transition-all duration-150 cursor-pointer"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay(sound.id);
        }}
        className="h-8 w-8 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900 
          text-gray-700 dark:text-gray-300"
      >
        {playingTrack === sound.id ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {sound.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {sound.artist || "Unknown"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/40 h-full">
      {!localOverlay ? (
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>Sound Library</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Library Sounds
            </h3>
            {localSounds.map(renderSoundCard)}

            {uploadedAudios.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2">
                  Your Uploads
                </h3>
                {uploadedAudios.map(renderSoundCard)}
              </>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="rounded-md overflow-hidden">
              <FileUpload
                acceptedFileTypes={getAcceptedFileTypes("audio")}
                onFileSelected={handleFileUpload}
                buttonText="Upload Audio"
                maxSizeMB={20}
              />
            </div>

            {currentAudioPreview && (
              <div className="mt-4 p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Preview
                </h4>
                <audio src={currentAudioPreview} className="w-full" controls />
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <h4 className="font-medium mb-1">Supported formats:</h4>
              <p>MP3, WAV, OGG</p>
              <h4 className="font-medium mt-3 mb-1">Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>MP3 files are recommended for smaller file sizes</li>
                <li>
                  For higher quality, use WAV files (will be larger in size)
                </li>
                <li>Keep audio files under 20MB for better performance</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <SoundDetails
          localOverlay={localOverlay}
          setLocalOverlay={handleUpdateOverlay}
        />
      )}
    </div>
  );
};

export default SoundsPanel;
