import axios, { AxiosInstance, AxiosResponse } from "axios";

const API_URL =
  process.env.NEXT_API_URL_PUBLIC || "https://ai-video.truyen.audio/api";

// Create axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for handling tokens, etc. if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // You can modify config here (add auth tokens, etc.)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling common responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here (e.g., unauthorized, server errors)
    return Promise.reject(error);
  }
);

export const api = {
  // GET requests
  get: async <T>(url: string, params = {}): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.get(url, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("API GET error:", error);
      throw error;
    }
  },

  // POST requests
  post: async <T>(url: string, data = {}): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error("API POST error:", error);
      throw error;
    }
  },

  // PUT requests
  put: async <T>(url: string, data = {}): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      console.error("API PUT error:", error);
      throw error;
    }
  },

  // DELETE requests
  delete: async <T>(url: string): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      console.error("API DELETE error:", error);
      throw error;
    }
  },
};

// API Response Types
export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    startIndex: number;
    endIndex: number;
    limit: number;
    total: number;
  };
}

// Character Appearance Type
export interface CharacterAppearance {
  gender?: string;
  body_type?: string;
  skin_tone?: string;
  eye_color?: string;
  hair_color?: string;
  hair_style?: string;
  face_features?: string;
  expression: string; // Required field as seen in all character appearances
  posture?: string;
  notable_features?: string;
}

// Artifact Asset Type for imageArtifact and videoArtifact
export interface ArtifactAsset {
  type: string; // e.g., "image"
  fileId: string; // e.g., "a4ae433a-db50-4281-8ed1-77dff0a11883.png"
  mimeType: string; // e.g., "image/jpeg"
}

export interface Artifact {
  assetUrl: string; // e.g., "https://storage.googleapis.com/..."
  expirationDateString: string; // e.g., "1745052462409"
  asset: ArtifactAsset;
}

// Define entity types with updated fields based on the response
export interface Project {
  _id: string;
  id: string;
  title: string;
  ratio: string; // e.g., "16:9"
  style: string; // e.g., "#A002-Anime"
  styleAddons?: string[]; // Array of strings to match response
  voice_narrator?: string; // e.g., "ash"
  novelId?: string; // e.g., "67c30ae0e7e3f64e3c6461ab"
  backgroundMusic?: {
    uploadedAsset: Record<string, any>;
  };
  referenceImageParameters?: Record<string, any>;
  scenes?: Scene[]; // Array of scenes, empty in some responses
  characters?: Character[]; // Array of characters, empty in some responses
  arcs?: Arc[]; // Included in detailed project response
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  imageUrl?: string;
  __v?: number; // Version key from Mongoose
}

export interface Arc {
  _id: string;
  projectId: string;
  index: number;
  title: string;
  summary: string;
  content: string; // Detailed narrative content
  status: string; // e.g., "planned1", "completed", "draft"
  chapter_indexes: number[]; // e.g., [0, 1, 2, 3, 4]
  suggested_plot_template_chapters: any[]; // Empty in the provided response
  character_tags: string[]; // e.g., ["@chae_eun_woo", "@vanitas_astrea"]
  location_tags: string[]; // Empty in the provided response
  isCreatedCharacterVariant: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Scene {
  _id: string;
  id: string;
  projectId: string;
  arcId: string;
  name: string; // Renamed from title to match response
  content: string; // Renamed from description to match response
  location: string; // e.g., "A dimly lit, sparse chamber"
  lighting: string; // e.g., "Cold, flickering bluish light"
  weather: string | null; // Can be null
  essence_tags: string; // e.g., "awakening, identity, tension"
  character_tags: string[]; // e.g., ["@vanitas_astrea"]
  scene_summary: string; // e.g., "@vanitas_astrea wakes up"
  index: number;
  shots: Shot[]; // Array of shots, empty in some responses
  musicBackgroundUrl: string; // e.g., "https://..."
  status: string; // e.g., "video_merged"
  isEnhanced: boolean;
  music_background: string; // e.g., "ambient electronic, suspenseful"
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Shot {
  _id: string;
  id: string;
  sceneId: string;
  projectId: string;
  arcId: string;
  content: string;
  type: string; // Renamed from title, e.g., "close-up, tight framing on face"
  prompt_i2v: string; // Renamed from description, e.g., "@vanitas_astrea’s face tightens..."
  prompt_t2i: string; // e.g., "@vanitas_astrea's face tense and conflicted..."
  order: number; // Renamed from index
  character_focus: string[]; // e.g., ["@vanitas_astrea"]
  sound_effect: string; // e.g., "heartbeat sound"
  camera_movement: string; // e.g., "static"
  emotional_tone: string; // e.g., "fearful"
  speed: string; // e.g., "normal"
  voice_over: string; // e.g., "False allegations threaten..."
  voice_character: string; // e.g., "@vanitas_astrea"
  voice_speed: string; // e.g., "slow"
  status: string; // e.g., "draft"
  seed: number; // e.g., 732273
  imageId: string | null; // e.g., null
  imageUrl: string; // e.g., "https://cdn.leonardo.ai/..."
  videoId: string; // e.g., "01964859-926e-74b6-91fa-3ae2a98f2f48"
  videoUrl: string; // e.g., "https://storage.googleapis.com/..."
  imageArtifact: Artifact; // Nested artifact object
  videoArtifact: Artifact | null; // Can be null
  audioUrl: string; // e.g., "https://ai-video.sgp1.digitaloceanspaces.com/..."
  duration: number; // e.g., 4.675875
  isUpscaled: boolean; // e.g., false
  whisper_mode: boolean; // e.g., false
  voice_emphasis: string; // e.g., "middle"
  pitch_variation: string; // e.g., "low"
  voice_overs: any[]; // Empty array in response, could be objects
  soundEffectUrl: string; // e.g., "https://ai-video.sgp1.digitaloceanspaces.com/..."
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Character {
  _id: string;
  id: string;
  projectId: string;
  arcId?: string;
  chapterId?: string | null;
  name: string;
  alias?: string[];
  age?: string;
  essence?: string;
  clothing?: string;
  clothing_style?: string;
  appearance: CharacterAppearance;
  imageUrl?: string;
  prompt?: string;
  tag?: string;
  seed?: number;
  isVariation: boolean;
  createdAt?: string;
  updatedAt?: string;
  voice_gpt?: string; // e.g., "echo", "gravelly"
  voice_name?: string; // e.g., "Soft, nervous voice with a slight tremor"
  __v?: number;
}

// Specific API endpoints
export const ltxApi = {
  // Projects
  projects: {
    getAll: async (): Promise<ApiResponse<Project[]>> => {
      return api.get<ApiResponse<Project[]>>("/projects");
    },

    getById: async (id: string): Promise<ApiResponse<Project>> => {
      return api.get<ApiResponse<Project>>(`/projects/${id}`);
    },
  },

  // Arcs
  arcs: {
    getAll: async (projectId: string): Promise<PaginatedResponse<Arc[]>> => {
      return api.get<PaginatedResponse<Arc[]>>("/arcs", {
        projectId,
      });
    },

    getById: async (id: string): Promise<ApiResponse<Arc>> => {
      return api.get<ApiResponse<Arc>>(`/arcs/${id}`);
    },
  },

  // Scenes
  scenes: {
    getAll: async (arcId: string): Promise<ApiResponse<Scene[]>> => {
      return api.get<ApiResponse<Scene[]>>("/sences", { arcId });
    },

    getById: async (id: string): Promise<ApiResponse<Scene>> => {
      return api.get<ApiResponse<Scene>>(`/sences/${id}`);
    },
  },

  // Shots
  shots: {
    getAll: async (sceneId: string): Promise<ApiResponse<Shot[]>> => {
      return api.get<ApiResponse<Shot[]>>("/shots", { sceneId });
    },

    getById: async (id: string): Promise<ApiResponse<Shot>> => {
      return api.get<ApiResponse<Shot>>(`/shots/${id}`);
    },
  },

  // Characters
  characters: {
    getAll: async (projectId: string): Promise<ApiResponse<Character[]>> => {
      return api.get<ApiResponse<Character[]>>("/characters", { projectId });
    },

    getById: async (id: string): Promise<ApiResponse<Character>> => {
      return api.get<ApiResponse<Character>>(`/characters/${id}`);
    },
  },
};

// Legacy API (for backward compatibility)
export const getApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await ltxApi.projects.getAll();
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await ltxApi.projects.getById(id);
    return response.data;
  },

  getArcs: async (projectId: string): Promise<Arc[]> => {
    const response = await ltxApi.arcs.getAll(projectId);
    return response.data;
  },

  // Get characters helper
  getCharacters: async (projectId: string): Promise<Character[]> => {
    const response = await ltxApi.characters.getAll(projectId);
    return response.data;
  },
};
