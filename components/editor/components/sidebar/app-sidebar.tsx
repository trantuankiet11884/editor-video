"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Database,
  Film,
  ImageIcon,
  Music,
  Subtitles,
  Type,
} from "lucide-react";
import * as React from "react";
import { useSidebar } from "../../contexts/sidebar-context";
import { OverlayType } from "../../types";
import { ApiOverlayPanel } from "../overlays/api/api-overlay-panel";
import { CaptionsPanel } from "../overlays/captions/captions-panel";
import { ImageOverlayPanel } from "../overlays/images/image-overlay-panel";
import SoundsPanel from "../overlays/sounds/sounds-panel";
import { TextOverlaysPanel } from "../overlays/text/text-overlays-panel";
import { VideoOverlayPanel } from "../overlays/video/video-overlay-panel";
/**
 * AppSidebar Component
 *
 * A dual-sidebar layout component for the video editor application.
 * Consists of two parts:
 * 1. A narrow icon-based sidebar on the left for main navigation
 * 2. A wider content sidebar that displays the active panel's content
 *
 * @component
 * @param props - Props extending from the base Sidebar component
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activePanel, setActivePanel, setIsOpen } = useSidebar();

  const getPanelTitle = (type: OverlayType): string => {
    switch (type) {
      case OverlayType.VIDEO:
        return "Video";
      case OverlayType.TEXT:
        return "Text";
      case OverlayType.SOUND:
        return "Audio";
      case OverlayType.CAPTION:
        return "Caption";
      case OverlayType.IMAGE:
        return "Image";
      case OverlayType.API:
        return "API";
      default:
        return "Unknown";
    }
  };

  const navigationItems = [
    {
      title: getPanelTitle(OverlayType.VIDEO),
      url: "#",
      icon: Film,
      panel: OverlayType.VIDEO,
      type: OverlayType.VIDEO,
    },
    {
      title: getPanelTitle(OverlayType.TEXT),
      url: "#",
      icon: Type,
      panel: OverlayType.TEXT,
      type: OverlayType.TEXT,
    },
    {
      title: getPanelTitle(OverlayType.SOUND),
      url: "#",
      icon: Music,
      panel: OverlayType.SOUND,
      type: OverlayType.SOUND,
    },
    {
      title: getPanelTitle(OverlayType.CAPTION),
      url: "#",
      icon: Subtitles,
      panel: OverlayType.CAPTION,
      type: OverlayType.CAPTION,
    },
    {
      title: getPanelTitle(OverlayType.IMAGE),
      url: "#",
      icon: ImageIcon,
      panel: OverlayType.IMAGE,
      type: OverlayType.IMAGE,
    },
    {
      title: getPanelTitle(OverlayType.API),
      url: "#",
      icon: Database,
      panel: OverlayType.API,
    },
  ];

  /**
   * Renders the appropriate panel component based on the active panel selection
   * @returns {React.ReactNode} The component corresponding to the active panel
   */
  const renderActivePanel = () => {
    switch (activePanel) {
      case OverlayType.TEXT:
        return <TextOverlaysPanel />;
      case OverlayType.SOUND:
        return <SoundsPanel />;
      case OverlayType.VIDEO:
        return <VideoOverlayPanel />;
      case OverlayType.CAPTION:
        return <CaptionsPanel />;
      case OverlayType.IMAGE:
        return <ImageOverlayPanel />;
      case OverlayType.API:
        return <ApiOverlayPanel />;
      default:
        return null;
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row border-r border-1 bg-background"
      {...props}
    >
      {/* First sidebar */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)]  bg-background border-r "
      >
        <SidebarHeader className="">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="md:h-8 md:p-0 "
              ></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            {navigationItems.map((item) => (
              <TooltipProvider key={item.title} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => {
                        setActivePanel(item.panel);
                        setIsOpen(true);
                      }}
                      size="lg"
                      className={`flex flex-col items-center gap-2 p-1.5 ${
                        activePanel === item.panel
                          ? "bg-primary/10 text-primary hover:bg-primary/10"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-gray-700 dark:text-white font-light" />
                      <span className="text-[7px] font-medium leading-none">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="border bg-background text-foreground"
                  >
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Second sidebar */}
      <Sidebar
        collapsible="none"
        className="hidden flex-1 md:flex bg-background border-r"
      >
        <SidebarHeader className="gap-3.5 border-b p-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activePanel ? getPanelTitle(activePanel as OverlayType) : ""}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="text-foreground bg-background">
          {renderActivePanel()}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
