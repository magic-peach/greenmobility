/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Client-side public environment variables (embedded in browser bundle)
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_MAPTILER_API_KEY?: string;
    
    // NOTE: GEMINI_API_KEY is server-only and must NOT be in this type definition.
    // It is only used in API routes (app/api/chat/route.ts) and should never appear in client bundles.
  }
}

