/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Existing env vars
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    
    // New env vars for map and chatbot
    NEXT_PUBLIC_MAPTILER_API_KEY?: string;
    GEMINI_API_KEY?: string;
  }
}

