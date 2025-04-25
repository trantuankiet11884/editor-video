import { DataExplorerModal } from "@/components/editor/components/overlays/images/api-data-modal";
import { Button } from "@/components/ui/button";
import { getApi, Project } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Cache to store fetched projects (persists across component mounts)
const projectCache: { projects: Project[] | null } = { projects: null };

export const ApiOverlayPanel: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(
    projectCache.projects || []
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projectsData = await getApi.getProjects();
      setProjects(projectsData);
      projectCache.projects = projectsData;
      setError(null);
    } catch (err) {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current && !projectCache.projects) {
      hasFetched.current = true;
      fetchProjects();
    }
  }, [fetchProjects]);

  return (
    <div className="p-4">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={fetchProjects}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          "Sync Project API"
        )}
      </Button>

      <div>
        {error && <p className="text-red-500">{error}</p>}
        {loading && !projects.length ? (
          <p className="flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </p>
        ) : (
          <div className="mt-4">
            {projects.length ? (
              projects.map((project) => (
                <p
                  key={project._id}
                  className="w-full justify-start mb-2 text-wrap cursor-pointer line-clamp-2 hover:bg-accent hover:text-accent-foreground hover:rounded-sm p-2 duration-300"
                  onClick={() => {
                    setSelectedProject(project);
                  }}
                >
                  {project.title}
                </p>
              ))
            ) : (
              <p>No projects available.</p>
            )}
          </div>
        )}
      </div>

      {selectedProject && (
        <DataExplorerModal
          selectedProject={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};
