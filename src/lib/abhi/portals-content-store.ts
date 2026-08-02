import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  type AbhiPortalsEditableContent,
  defaultAbhiPortalsContent,
  sanitizePortalsContent,
} from "@/lib/abhi/portals-demo";

const CONTENT_KEY = "default";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __abhiPortalsPageContent: AbhiPortalsEditableContent | undefined;
}

function memoryContent(): AbhiPortalsEditableContent {
  if (!globalThis.__abhiPortalsPageContent) {
    globalThis.__abhiPortalsPageContent = defaultAbhiPortalsContent();
  }
  return globalThis.__abhiPortalsPageContent;
}

export async function readAbhiPortalsContent(): Promise<AbhiPortalsEditableContent> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("abhi_portals_page_content")
        .select("major_modules, custom_modules")
        .eq("id", CONTENT_KEY)
        .maybeSingle();
      if (!error && data) {
        const content = sanitizePortalsContent({
          majorModules: data.major_modules,
          customModules: data.custom_modules,
        });
        globalThis.__abhiPortalsPageContent = content;
        return content;
      }
    } catch {
      // Fall through to memory defaults.
    }
  }
  return sanitizePortalsContent(memoryContent());
}

export async function writeAbhiPortalsContent(
  next: AbhiPortalsEditableContent,
): Promise<AbhiPortalsEditableContent> {
  const content = sanitizePortalsContent(next);
  globalThis.__abhiPortalsPageContent = content;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("abhi_portals_page_content").upsert(
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
