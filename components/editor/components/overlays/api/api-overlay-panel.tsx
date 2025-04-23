import { DataExplorerModal } from "@/components/editor/components/overlays/images/api-data-modal";
import { Button } from "@/components/ui/button";
import { getApi, Project } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const ApiOverlayPanel: React.FC = () => {
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isProjectListOpen && projects.length === 0) {
      const fetchProjects = async () => {
        setLoading(true);
        try {
          const projectsData = await getApi.getProjects();
          setProjects(projectsData);
        } catch (err) {
          setError("Failed to load projects.");
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [isProjectListOpen, projects.length]);

  return (
    <div className="p-4">
      {/* Nút Sync Project API */}
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsProjectListOpen(!isProjectListOpen)}
      >
        Sync Project API
      </Button>

      <div>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <div className="mt-4">
            {projects.map((project) => (
              <p
                key={project._id}
                className="w-full justify-start mb-2 text-wrap cursor-pointer line-clamp-2 hover:bg-accent hover:text-accent-foreground hover:rounded-sm p-2 duration-300"
                onClick={() => {
                  setSelectedProject(project);
                }}
              >
                {project.title}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Hiển thị DataExplorerModal khi chọn project */}
      {selectedProject && (
        <DataExplorerModal
          selectedProject={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};
