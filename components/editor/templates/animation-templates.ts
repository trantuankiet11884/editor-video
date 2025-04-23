import { interpolate } from "remotion";

export type AnimationTemplate = {
  name: string;
  preview: string;
  isPro?: boolean;
  enter: (
    frame: number,
    durationInFrames: number
  ) => {
    transform?: string;
    opacity?: number;
  };
  exit: (
    frame: number,
    durationInFrames: number
  ) => {
    transform?: string;
    opacity?: number;
  };
};

export const animationTemplates: Record<string, AnimationTemplate> = {
  fade: {
    name: "Fade",
    preview: "Simple fade in/out",
    enter: (frame) => ({
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration) => ({
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
    }),
  },
  slideRight: {
    name: "Slide",
    preview: "Slide in from left",
    isPro: true,
    enter: (frame) => ({
      transform: `translateX(${interpolate(frame, [0, 15], [-100, 0], {
        extrapolateRight: "clamp",
      })}%)`,
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration) => ({
      transform: `translateX(${interpolate(
        frame,
        [duration - 15, duration],
        [0, 100],
        { extrapolateLeft: "clamp" }
      )}%)`,
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
    }),
  },
  scale: {
    name: "Scale",
    preview: "Scale in/out",
    enter: (frame) => ({
      transform: `scale(${interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      })})`,
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration) => ({
      transform: `scale(${interpolate(
        frame,
        [duration - 15, duration],
        [1, 0],
        { extrapolateLeft: "clamp" }
      )})`,
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
    }),
  },
};
