import { useEffect } from "react";
import { useApiStore } from "@/lib/store/api-store";

/**
 * Hook to fetch and access projects data
 */
export function useProjects() {
  const { projectsList, isLoadingProjects, errors, fetchProjects } =
    useApiStore((state) => ({
      projectsList: state.projectsList,
      isLoadingProjects: state.isLoadingProjects,
      errors: state.errors,
      fetchProjects: state.fetchProjects,
    }));

  // Fetch projects on component mount if not already cached
  useEffect(() => {
    if (!projectsList && !isLoadingProjects) {
      fetchProjects().catch((err) =>
        console.error("Error fetching projects:", err)
      );
    }
  }, [projectsList, isLoadingProjects, fetchProjects]);

  return {
    projects: projectsList || [],
    isLoading: isLoadingProjects,
    error: errors.projects || null,
    refetch: fetchProjects,
  };
}

/**
 * Hook to fetch and access a specific project by ID
 */
export function useProject(id: string) {
  const { projects, isLoadingProject, errors, fetchProject } = useApiStore(
    (state) => ({
      projects: state.projects,
      isLoadingProject: state.isLoadingProject,
      errors: state.errors,
      fetchProject: state.fetchProject,
    })
  );

  // Fetch project on component mount or id change if not already cached
  useEffect(() => {
    if (id && !projects[id] && !isLoadingProject[id]) {
      fetchProject(id).catch((err) =>
        console.error(`Error fetching project ${id}:`, err)
      );
    }
  }, [id, projects, isLoadingProject, fetchProject]);

  return {
    project: id ? projects[id] : undefined,
    isLoading: id ? isLoadingProject[id] || false : false,
    error: id ? errors[`project_${id}`] || null : null,
    refetch: () => (id ? fetchProject(id) : Promise.resolve(undefined)),
  };
}

/**
 * Hook to fetch and access arcs for a specific project
 */
export function useArcs(projectId: string) {
  const { arcsByProject, isLoadingArcs, errors, fetchArcs } = useApiStore(
    (state) => ({
      arcsByProject: state.arcsByProject,
      isLoadingArcs: state.isLoadingArcs,
      errors: state.errors,
      fetchArcs: state.fetchArcs,
    })
  );

  // Fetch arcs on component mount or projectId change if not already cached
  useEffect(() => {
    if (projectId && !arcsByProject[projectId] && !isLoadingArcs[projectId]) {
      fetchArcs(projectId).catch((err) =>
        console.error(`Error fetching arcs for project ${projectId}:`, err)
      );
    }
  }, [projectId, arcsByProject, isLoadingArcs, fetchArcs]);

  return {
    arcs: projectId ? arcsByProject[projectId] || [] : [],
    isLoading: projectId ? isLoadingArcs[projectId] || false : false,
    error: projectId ? errors[`arcs_${projectId}`] || null : null,
    refetch: () => (projectId ? fetchArcs(projectId) : Promise.resolve([])),
  };
}

/**
 * Hook to fetch and access scenes for a specific arc
 */
export function useScenes(arcId: string) {
  const { scenesByArc, isLoadingScenes, errors, fetchScenes } = useApiStore(
    (state) => ({
      scenesByArc: state.scenesByArc,
      isLoadingScenes: state.isLoadingScenes,
      errors: state.errors,
      fetchScenes: state.fetchScenes,
    })
  );

  // Fetch scenes on component mount or arcId change if not already cached
  useEffect(() => {
    if (arcId && !scenesByArc[arcId] && !isLoadingScenes[arcId]) {
      fetchScenes(arcId).catch((err) =>
        console.error(`Error fetching scenes for arc ${arcId}:`, err)
      );
    }
  }, [arcId, scenesByArc, isLoadingScenes, fetchScenes]);

  return {
    scenes: arcId ? scenesByArc[arcId] || [] : [],
    isLoading: arcId ? isLoadingScenes[arcId] || false : false,
    error: arcId ? errors[`scenes_${arcId}`] || null : null,
    refetch: () => (arcId ? fetchScenes(arcId) : Promise.resolve([])),
  };
}

/**
 * Hook to fetch and access shots for a specific scene
 */
export function useShots(sceneId: string) {
  const { shotsByScene, isLoadingShots, errors, fetchShots } = useApiStore(
    (state) => ({
      shotsByScene: state.shotsByScene,
      isLoadingShots: state.isLoadingShots,
      errors: state.errors,
      fetchShots: state.fetchShots,
    })
  );

  // Fetch shots on component mount or sceneId change if not already cached
  useEffect(() => {
    if (sceneId && !shotsByScene[sceneId] && !isLoadingShots[sceneId]) {
      fetchShots(sceneId).catch((err) =>
        console.error(`Error fetching shots for scene ${sceneId}:`, err)
      );
    }
  }, [sceneId, shotsByScene, isLoadingShots, fetchShots]);

  return {
    shots: sceneId ? shotsByScene[sceneId] || [] : [],
    isLoading: sceneId ? isLoadingShots[sceneId] || false : false,
    error: sceneId ? errors[`shots_${sceneId}`] || null : null,
    refetch: () => (sceneId ? fetchShots(sceneId) : Promise.resolve([])),
  };
}

/**
 * Hook to fetch and access characters for a specific project
 */
export function useCharacters(projectId: string) {
  const { charactersByProject, isLoadingCharacters, errors, fetchCharacters } =
    useApiStore((state) => ({
      charactersByProject: state.charactersByProject,
      isLoadingCharacters: state.isLoadingCharacters,
      errors: state.errors,
      fetchCharacters: state.fetchCharacters,
    }));

  // Fetch characters on component mount or projectId change if not already cached
  useEffect(() => {
    if (
      projectId &&
      !charactersByProject[projectId] &&
      !isLoadingCharacters[projectId]
    ) {
      fetchCharacters(projectId).catch((err) =>
        console.error(
          `Error fetching characters for project ${projectId}:`,
          err
        )
      );
    }
  }, [projectId, charactersByProject, isLoadingCharacters, fetchCharacters]);

  return {
    characters: projectId ? charactersByProject[projectId] || [] : [],
    isLoading: projectId ? isLoadingCharacters[projectId] || false : false,
    error: projectId ? errors[`characters_${projectId}`] || null : null,
    refetch: () =>
      projectId ? fetchCharacters(projectId) : Promise.resolve([]),
  };
}

/**
 * Hook to access all cache clearing functions
 */
export function useCacheControl() {
  return useApiStore((state) => ({
    clearProjectsCache: state.clearProjectsCache,
    clearArcsCache: state.clearArcsCache,
    clearScenesCache: state.clearScenesCache,
    clearShotsCache: state.clearShotsCache,
    clearCharactersCache: state.clearCharactersCache,
    clearAllCache: state.clearAllCache,
  }));
}
