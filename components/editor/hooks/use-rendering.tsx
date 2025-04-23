import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import { CompositionProps } from "../types";

import {
  getProgress as getLambdaProgress,
  renderVideo as renderLambdaVideo,
} from "../lambda-helpers/api";

const getProgress = getLambdaProgress;
const renderVideo = renderLambdaVideo;

// Define possible states for the rendering process
export type State =
  | { status: "init" } // Initial state
  | { status: "invoking" } // API call is being made
  | {
      // Video is being rendered
      renderId: string;
      bucketName: string;
      progress: number;
      status: "rendering";
    }
  | {
      // Error occurred during rendering
      renderId: string | null;
      status: "error";
      error: Error;
    }
  | {
      // Rendering completed successfully
      url: string;
      size: number;
      status: "done";
    };

// Utility function to create a delay
const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

// Custom hook to manage video rendering process
export const useRendering = (
  id: string, // Unique identifier for the render
  inputProps: z.infer<typeof CompositionProps> // Video composition properties
) => {
  // Maintain current state of the rendering process
  const [state, setState] = useState<State>({
    status: "init",
  });

  // Main function to handle the rendering process
  const renderMedia = useCallback(async () => {
    console.log("Starting renderMedia process");
    setState({
      status: "invoking",
    });
    try {
      console.log("Calling renderVideo API with inputProps", inputProps);
      const { renderId, bucketName } = await renderVideo({ id, inputProps });
      console.log(
        `Render initiated: renderId=${renderId}, bucketName=${bucketName}`
      );
      setState({
        status: "rendering",
        progress: 0,
        renderId: renderId,
        bucketName: bucketName,
      });

      let pending = true;

      while (pending) {
        console.log(`Checking progress for renderId=${renderId}`);
        const result = await getProgress({
          id: renderId,
          bucketName: bucketName,
        });
        switch (result.type) {
          case "error": {
            console.error(`Render error: ${result.message}`);
            const errorMessage = result.message.includes("Failed to fetch")
              ? `Rendering failed: This might be caused by insufficient disk space in your browser. Try:\n` +
                `1. Clearing browser cache and temporary files\n` +
                `2. Freeing up disk space\n` +
                `3. Using a different browser\n` +
                `Original error: ${result.message}`
              : result.message;

            setState({
              status: "error",
              renderId: renderId,
              error: new Error(errorMessage),
            });
            pending = false;
            break;
          }
          case "done": {
            console.log(
              `Render complete: url=${result.url}, size=${result.size}`
            );
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            console.log(`Render progress: ${result.progress}%`);
            setState({
              status: "rendering",
              bucketName: bucketName ?? "",
              progress: result.progress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error during rendering:", err);
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [id, inputProps]);

  // Reset the rendering state back to initial
  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(
    () => ({
      renderMedia, // Function to start rendering
      state, // Current state of the render
      undo, // Function to reset the state
    }),
    [renderMedia, state, undo]
  );
};
