import React from "react";
import { Download, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

/**
 * Interface representing a single video render attempt
 * @property {string} url - URL of the rendered video (if successful)
 * @property {Date} timestamp - When the render was completed
 * @property {string} id - Unique identifier for the render
 * @property {'success' | 'error'} status - Result of the render attempt
 * @property {string} error - Error message if render failed
 */
interface RenderItem {
  url?: string;
  timestamp: Date;
  id: string;
  status: "success" | "error";
  error?: string;
}

/**
 * Props for the RenderControls component
 * @property {object} state - Current render state containing status, progress, and URL
 * @property {() => void} handleRender - Function to trigger a new render
 */
interface RenderControlsProps {
  state: any;
  handleRender: () => void;
}

/**
 * RenderControls component provides UI controls for video rendering functionality
 *
 * Features:
 * - Render button that shows progress during rendering
 * - Notification bell showing render history
 * - Download buttons for completed renders
 * - Error display for failed renders
 *
 * The component maintains a history of render attempts, both successful and failed,
 * and provides visual feedback about the current render status.
 */
const RenderControls: React.FC<RenderControlsProps> = ({
  state,
  handleRender,
}) => {
  // Store multiple renders
  const [renders, setRenders] = React.useState<RenderItem[]>([]);
  // Track if there are new renders
  const [hasNewRender, setHasNewRender] = React.useState(false);

  // Add new render to the list when completed
  React.useEffect(() => {
    if (state.status === "done" && state.url) {
      setRenders((prev) => [
        {
          url: state.url!,

          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "success",
        },
        ...prev,
      ]);
      setHasNewRender(true);
    } else if (state.status === "error") {
      setRenders((prev) => [
        {
          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "error",
          error: "Failed to render video. Please try again.",
        },
        ...prev,
      ]);
      setHasNewRender(true);
    }
  }, [state.status, state.url]);

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "rendered-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <Popover onOpenChange={() => setHasNewRender(false)}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative hover:bg-accent"
          >
            <Bell className="w-3.5 h-3.5" />
            {hasNewRender && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium">Recent Renders</h4>
            {renders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No renders yet</p>
            ) : (
              renders.map((render) => (
                <div
                  key={render.id}
                  className={`flex items-center justify-between rounded-md border p-1.5 ${
                    render.status === "error"
                      ? "border-destructive/50 bg-destructive/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="text-xs text-zinc-200">
                      {render.status === "error" ? (
                        <span className="text-red-400 font-medium">
                          Render Failed
                        </span>
                      ) : (
                        new URL(render.url!).pathname.split("/").pop()
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(render.timestamp, {
                        addSuffix: true,
                      })}
                      {render.error && (
                        <div className="text-red-400 mt-0.5">
                          {render.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {render.status === "success" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-zinc-200 hover:text-gray-800 h-6 w-6"
                      onClick={() => handleDownload(render.url!)}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default RenderControls;
