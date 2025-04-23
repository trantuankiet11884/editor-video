import React from "react";
import { Input } from "@/components/ui/input";
import { TextOverlay } from "../../../types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Available font options for text overlays
 */
const fonts = [
  { value: "font-sans", label: "Inter (Sans-serif)" },
  { value: "font-serif", label: "Merriweather (Serif)" },
  { value: "font-mono", label: "Roboto Mono (Monospace)" },
  { value: "font-retro", label: "VT323" },
];

/**
 * Props for the TextStylePanel component
 * @interface TextStylePanelProps
 * @property {TextOverlay} localOverlay - The current text overlay object containing styles and content
 * @property {Function} handleInputChange - Callback function to handle changes to overlay text content
 * @property {Function} handleStyleChange - Callback function to handle style changes for the text overlay
 */
interface TextStylePanelProps {
  localOverlay: TextOverlay;
  handleInputChange: (field: keyof TextOverlay, value: string) => void;
  handleStyleChange: (field: keyof TextOverlay["styles"], value: any) => void;
}

/**
 * Panel component for managing text overlay styling options
 * Provides controls for typography settings (font family, alignment) and colors (text color, highlight)
 *
 * @component
 * @param {TextStylePanelProps} props - Component props
 * @returns {JSX.Element} A panel with text styling controls
 */
export const TextStylePanel: React.FC<TextStylePanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Typography Settings */}
      <div className="space-y-4 rounded-md bg-background/50 p-4 border">
        <h3 className="text-sm font-medium">Typography</h3>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Family</label>
          <Select
            value={localOverlay.styles.fontFamily}
            onValueChange={(value) => handleStyleChange("fontFamily", value)}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem
                  key={font.value}
                  value={font.value}
                  className={`${font.value} text-xs`}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Alignment</label>
            <ToggleGroup
              type="single"
              className="justify-start gap-1"
              value={localOverlay.styles.textAlign}
              onValueChange={(value) => {
                if (value) handleStyleChange("textAlign", value);
              }}
            >
              <ToggleGroupItem
                value="left"
                aria-label="Align left"
                className="h-10 w-10"
              >
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="center"
                aria-label="Align center"
                className="h-10 w-10"
              >
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="right"
                aria-label="Align right"
                className="h-10 w-10"
              >
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4 rounded-md bg-background/50 p-4 border">
        <h3 className="text-sm font-medium">Colors</h3>

        <div className="grid grid-cols-3 gap-4">
          {!localOverlay.styles.WebkitBackgroundClip ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Text Color
                </label>
                <Input
                  type="color"
                  value={localOverlay.styles.color}
                  className="h-8 w-8 !p-0.5 rounded-md"
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Highlight
                </label>
                <Input
                  type="color"
                  value={localOverlay.styles.backgroundColor}
                  className="h-8 w-8 !p-0.5 rounded-md"
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                />
              </div>
            </>
          ) : (
            <div className="col-span-3">
              <p className="text-xs text-muted-foreground">
                Color settings are not available for gradient text styles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
