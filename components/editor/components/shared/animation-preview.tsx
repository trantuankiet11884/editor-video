import React, { useState } from "react";
import { AnimationTemplate } from "../../templates/animation-templates";

/**
 * AnimationPreviewProps interface defines the required props for the AnimationPreview component
 */
interface AnimationPreviewProps {
  /** Unique identifier for the animation */
  animationKey: string;
  /** Animation template containing enter/exit animations and configuration */
  animation: AnimationTemplate;
  /** Whether this animation is currently selected */
  isSelected: boolean;
  /** Callback function triggered when the animation is clicked */
  onClick: () => void;
}

/**
 * AnimationPreview component displays an interactive preview of an animation effect.
 * It shows a circular element that demonstrates the animation on hover and provides
 * visual feedback for selection state.
 *
 * @component
 * @param {AnimationTemplate} animation - The animation template to preview
 * @param {boolean} isSelected - Whether this animation is currently selected
 * @param {() => void} onClick - Callback function when the animation is selected
 *
 * @example
 * ```tsx
 * <AnimationPreview
 *   animationKey="fade"
 *   animation={fadeAnimation}
 *   isSelected={false}
 *   onClick={() => handleAnimationSelect('fade')}
 * />
 * ```
 */
export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  animation,
  isSelected,
  onClick,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const getAnimationStyle = () => {
    const styles = animation.enter?.(isHovering ? 40 : 0, 40) || {};
    return {
      ...styles,
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative aspect-square w-full rounded-lg border-2 ${
        isSelected
          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
          : "border-border bg-background hover:border-muted-foreground/50 hover:bg-muted/10 dark:bg-muted/30 dark:hover:bg-muted/50"
      } p-3 transition-all duration-200 group backdrop-blur-sm`}
    >
      <div className="flex h-full flex-col items-center justify-center gap-3">
        {/* Container for animation circles with subtle glow effect */}
        <div className="relative h-6 w-6">
          {/* Static circle with fade out */}
          <div
            className={`absolute inset-0 rounded-full ${
              isSelected
                ? "border-blue-500 border-dashed border-2"
                : "border-foreground/30 dark:border-foreground/50 border-[1.5px]"
            } transition-all duration-500 h-6`}
            style={{
              opacity: isHovering ? 0 : 0.8,
            }}
          />
          {/* Animated circle with fade in */}
          {animation.name !== "None" && (
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-foreground/30 dark:border-foreground/50 transition-all duration-500 h-6"
              style={{
                ...getAnimationStyle(),
                opacity: isHovering ? 0.9 : 0,
                boxShadow: isHovering ? "0 0 10px rgba(0,0,0,0.1)" : "none",
              }}
            />
          )}
        </div>

        <span
          className={`mt-4 text-[10px] tracking-wide transition-all duration-200 ${
            isSelected
              ? "text-blue-500"
              : "text-muted-foreground/80 group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-foreground"
          }`}
        >
          {animation.name}
        </span>
      </div>
    </button>
  );
};
