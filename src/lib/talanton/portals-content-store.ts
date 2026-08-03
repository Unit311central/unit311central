import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  type TalantonPortalsEditableContent,
  defaultTalantonPortalsContent,
  sanitizePortalsContent,
} from "@/lib/talanton/portals-demo";

const CONTENT_KEY = "default";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __talantonPortalsPageContent: TalantonPortalsEditableContent | undefined;
}

function memoryContent(): TalantonPortalsEditableContent {
  if (!globalThis.__talantonPortalsPageContent) {
    globalThis.__talantonPortalsPageContent = defaultTalantonPortalsContent();
  }
  return globalThis.__talantonPortalsPageContent;
}

export async function readTalantonPortalsContent(): Promise<TalantonPortalsEditableContent> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("talanton_portals_page_content")
        .select("major_modules, custom_modules")
        .eq("id", CONTENT_KEY)
        .maybeSingle();
      if (!error && data) {
        const content = sanitizePortalsContent({
          majorModules: data.major_modules,
          customModules: data.custom_modules,
        });
        globalThis.__talantonPortalsPageContent = content;
        return content;
      }
    } catch {
      // Fall through to memory defaults.
    }
  }
  return sanitizePortalsContent(memoryContent());
}

export async function writeTalantonPortalsContent(
  next: TalantonPortalsEditableContent,
): Promise<TalantonPortalsEditableContent> {
  const content = sanitizePortalsContent(next);
  globalThis.__talantonPortalsPageContent = content;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("talanton_portals_page_content").upsert(
        {
          id: CONTENT_KEY,
          major_modules: content.majorModules,
          custom_modules: content.customModules,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    } catch {
      // Memory still holds the latest edit for this instance.
    }
  }

  return content;
}
