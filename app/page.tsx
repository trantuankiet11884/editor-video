import ReactVideoEditor from "@/components/editor/react-video-editor";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      {" "}
      <ReactVideoEditor />
    </SidebarProvider>
  );
}
