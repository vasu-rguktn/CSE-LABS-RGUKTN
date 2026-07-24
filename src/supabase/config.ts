import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string, fallback: string): string => {
  const val = import.meta.env[key];
  if (!val || val === "undefined" || val === "null" || val === "") {
    return fallback;
  }
  return val as string;
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL", "https://cybnisojxwdhjldzmvzl.supabase.co");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_MIebymPunpolAgJd-1Uy7w_2u_wnwn9");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


