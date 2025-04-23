import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ltxApi, Project, Arc, Scene, Shot, Character } from "@/lib/api";

// Define the store state type
interface ApiState {
  // Data caches
  projects: Record<string, Project>;
  projectsList: Project[] | null;
  arcs: Record<string, Arc>;
  arcsByProject: Record<string, Arc[]>;
  scenes: Record<string, Scene>;
  scenesByArc: Record<string, Scene[]>;
  shots: Record<string, Shot>;
  shotsByScene: Record<string, Shot[]>;
  characters: Record<string, Character>;
  charactersByProject: Record<string, Character[]>;

  // Loading states
  isLoadingProjects: boolean;
  isLoadingProject: Record<string, boolean>;
  isLoadingArcs: Record<string, boolean>;
  isLoadingScenes: Record<string, boolean>;
  isLoadingShots: Record<string, boolean>;
  isLoadingCharacters: Record<string, boolean>;

  // Error states
  errors: Record<string, string | null>;

  // Action methods
  fetchProjects: () => Promise<Project[]>;
  fetchProject: (id: string) => Promise<Project>;
  fetchArcs: (projectId: string) => Promise<Arc[]>;
  fetchScenes: (arcId: string) => Promise<Scene[]>;
  fetchShots: (sceneId: string) => Promise<Shot[]>;
  fetchCharacters: (projectId: string) => Promise<Character[]>;

  // Clear cache methods
  clearProjectsCache: () => void;
  clearArcsCache: (projectId?: string) => void;
  clearScenesCache: (arcId?: string) => void;
  clearShotsCache: (sceneId?: string) => void;
  clearCharactersCache: (projectId?: string) => void;
  clearAllCache: () => void;
}

// Create the store
export const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: {},
      projectsList: null,
      arcs: {},
      arcsByProject: {},
      scenes: {},
      scenesByArc: {},
      shots: {},
      shotsByScene: {},
      characters: {},
      charactersByProject: {},

      isLoadingProjects: false,
      isLoadingProject: {},
      isLoadingArcs: {},
      isLoadingScenes: {},
      isLoadingShots: {},
      isLoadingCharacters: {},

      errors: {},

      // Fetch all projects
      fetchProjects: async () => {
        const { projectsList } = get();

        // Return cached data if available
        if (projectsList) {
          return projectsList;
        }

        set({
          isLoadingProjects: true,
          errors: { ...get().errors, projects: null },
        });

        try {
          const response = await ltxApi.projects.getAll();
          const projects = response.data;

          // Update cache with individual projects
          const projectsMap: Record<string, Project> = {};
          projects.forEach((project) => {
            projectsMap[project.id] = project;
          });

          set({
            projectsList: projects,
            projects: { ...get().projects, ...projectsMap },
            isLoadingProjects: false,
          });

          return projects;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch projects";
          set({
            isLoadingProjects: false,
            errors: { ...get().errors, projects: errorMessage },
          });
          throw error;
        }
      },

      // Fetch a single project by ID
      fetchProject: async (id: string) => {
        const { projects } = get();

        // Return cached data if available
        if (projects[id]) {
          return projects[id];
        }

        set({
          isLoadingProject: { ...get().isLoadingProject, [id]: true },
          errors: { ...get().errors, [`project_${id}`]: null },
        });

        try {
          const response = await ltxApi.projects.getById(id);
          const project = response.data;

          set({
            projects: { ...get().projects, [id]: project },
            isLoadingProject: { ...get().isLoadingProject, [id]: false },
          });

          return project;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to fetch project ${id}`;
          set({
            isLoadingProject: { ...get().isLoadingProject, [id]: false },
            errors: { ...get().errors, [`project_${id}`]: errorMessage },
          });
          throw error;
        }
      },

      // Fetch arcs by project ID
      fetchArcs: async (projectId: string) => {
        const { arcsByProject } = get();

        // Return cached data if available
        if (arcsByProject[projectId]) {
          return arcsByProject[projectId];
        }

        set({
          isLoadingArcs: { ...get().isLoadingArcs, [projectId]: true },
          errors: { ...get().errors, [`arcs_${projectId}`]: null },
        });

        try {
          const response = await ltxApi.arcs.getAll(projectId);
          const arcs = response.data;

          // Update cache with individual arcs
          const arcsMap: Record<string, Arc> = {};
          arcs.forEach((arc) => {
            arcsMap[arc._id] = arc;
          });

          set({
            arcs: { ...get().arcs, ...arcsMap },
            arcsByProject: { ...get().arcsByProject, [projectId]: arcs },
            isLoadingArcs: { ...get().isLoadingArcs, [projectId]: false },
          });

          return arcs;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to fetch arcs for project ${projectId}`;
          set({
            isLoadingArcs: { ...get().isLoadingArcs, [projectId]: false },
            errors: { ...get().errors, [`arcs_${projectId}`]: errorMessage },
          });
          throw error;
        }
      },

      // Fetch scenes by arc ID
      fetchScenes: async (arcId: string) => {
        const { scenesByArc } = get();

        // Return cached data if available
        if (scenesByArc[arcId]) {
          return scenesByArc[arcId];
        }

        set({
          isLoadingScenes: { ...get().isLoadingScenes, [arcId]: true },
          errors: { ...get().errors, [`scenes_${arcId}`]: null },
        });

        try {
          const response = await ltxApi.scenes.getAll(arcId);
          const scenes = response.data;

          // Update cache with individual scenes
          const scenesMap: Record<string, Scene> = {};
          scenes.forEach((scene) => {
            scenesMap[scene.id] = scene;
          });

          set({
            scenes: { ...get().scenes, ...scenesMap },
            scenesByArc: { ...get().scenesByArc, [arcId]: scenes },
            isLoadingScenes: { ...get().isLoadingScenes, [arcId]: false },
          });

          return scenes;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to fetch scenes for arc ${arcId}`;
          set({
            isLoadingScenes: { ...get().isLoadingScenes, [arcId]: false },
            errors: { ...get().errors, [`scenes_${arcId}`]: errorMessage },
          });
          throw error;
        }
      },

      // Fetch shots by scene ID
      fetchShots: async (sceneId: string) => {
        const { shotsByScene } = get();

        // Return cached data if available
        if (shotsByScene[sceneId]) {
          return shotsByScene[sceneId];
        }

        set({
          isLoadingShots: { ...get().isLoadingShots, [sceneId]: true },
          errors: { ...get().errors, [`shots_${sceneId}`]: null },
        });

        try {
          const response = await ltxApi.shots.getAll(sceneId);
          const shots = response.data;

          // Update cache with individual shots
          const shotsMap: Record<string, Shot> = {};
          shots.forEach((shot) => {
            shotsMap[shot.id] = shot;
          });

          set({
            shots: { ...get().shots, ...shotsMap },
            shotsByScene: { ...get().shotsByScene, [sceneId]: shots },
            isLoadingShots: { ...get().isLoadingShots, [sceneId]: false },
          });

          return shots;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to fetch shots for scene ${sceneId}`;
          set({
            isLoadingShots: { ...get().isLoadingShots, [sceneId]: false },
            errors: { ...get().errors, [`shots_${sceneId}`]: errorMessage },
          });
          throw error;
        }
      },

      // Fetch characters by project ID
      fetchCharacters: async (projectId: string) => {
        const { charactersByProject } = get();

        // Return cached data if available
        if (charactersByProject[projectId]) {
          return charactersByProject[projectId];
        }

        set({
          isLoadingCharacters: {
            ...get().isLoadingCharacters,
            [projectId]: true,
          },
          errors: { ...get().errors, [`characters_${projectId}`]: null },
        });

        try {
          const response = await ltxApi.characters.getAll(projectId);
          const characters = response.data;

          // Update cache with individual characters
          const charactersMap: Record<string, Character> = {};
          characters.forEach((character) => {
            charactersMap[character.id] = character;
          });

          set({
            characters: { ...get().characters, ...charactersMap },
            charactersByProject: {
              ...get().charactersByProject,
              [projectId]: characters,
            },
            isLoadingCharacters: {
              ...get().isLoadingCharacters,
              [projectId]: false,
            },
          });

          return characters;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to fetch characters for project ${projectId}`;
          set({
            isLoadingCharacters: {
              ...get().isLoadingCharacters,
              [projectId]: false,
            },
            errors: {
              ...get().errors,
              [`characters_${projectId}`]: errorMessage,
            },
          });
          throw error;
        }
      },

      // Clear cache methods
      clearProjectsCache: () => {
        set({ projectsList: null });
      },

      clearArcsCache: (projectId?: string) => {
        if (projectId) {
          const { arcsByProject } = get();
          const newArcsByProject = { ...arcsByProject };
          delete newArcsByProject[projectId];
          set({ arcsByProject: newArcsByProject });
        } else {
          set({ arcsByProject: {}, arcs: {} });
        }
      },

      clearScenesCache: (arcId?: string) => {
        if (arcId) {
          const { scenesByArc } = get();
          const newScenesByArc = { ...scenesByArc };
          delete newScenesByArc[arcId];
          set({ scenesByArc: newScenesByArc });
        } else {
          set({ scenesByArc: {}, scenes: {} });
        }
      },

      clearShotsCache: (sceneId?: string) => {
        if (sceneId) {
          const { shotsByScene } = get();
          const newShotsByScene = { ...shotsByScene };
          delete newShotsByScene[sceneId];
          set({ shotsByScene: newShotsByScene });
        } else {
          set({ shotsByScene: {}, shots: {} });
        }
      },

      clearCharactersCache: (projectId?: string) => {
        if (projectId) {
          const { charactersByProject } = get();
          const newCharactersByProject = { ...charactersByProject };
          delete newCharactersByProject[projectId];
          set({ charactersByProject: newCharactersByProject });
        } else {
          set({ charactersByProject: {}, characters: {} });
        }
      },

      clearAllCache: () => {
        set({
          projects: {},
          projectsList: null,
          arcs: {},
          arcsByProject: {},
          scenes: {},
          scenesByArc: {},
          shots: {},
          shotsByScene: {},
          characters: {},
          charactersByProject: {},
          errors: {},
        });
      },
    }),
    {
      name: "ltx-api-cache",
      partialize: (state) => ({
        // Only persist the data, not the loading states or error messages
        projects: state.projects,
        projectsList: state.projectsList,
        arcs: state.arcs,
        arcsByProject: state.arcsByProject,
        scenes: state.scenes,
        scenesByArc: state.scenesByArc,
        shots: state.shots,
        shotsByScene: state.shotsByScene,
        characters: state.characters,
        charactersByProject: state.charactersByProject,
      }),
    }
  )
);
