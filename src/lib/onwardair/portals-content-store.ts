import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  type OnwardAirPortalsEditableContent,
  defaultOnwardAirPortalsContent,
  sanitizePortalsContent,
} from "@/lib/onwardair/portals-demo";

const CONTENT_KEY = "default";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __onwardAirPortalsPageContent: OnwardAirPortalsEditableContent | undefined;
}

function memoryContent(): OnwardAirPortalsEditableContent {
  if (!globalThis.__onwardAirPortalsPageContent) {
    globalThis.__onwardAirPortalsPageContent = defaultOnwardAirPortalsContent();
  }
  return globalThis.__onwardAirPortalsPageContent;
}

export async function readOnwardAirPortalsContent(): Promise<OnwardAirPortalsEditableContent> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("onwardair_portals_page_content")
        .select("major_modules, custom_modules")
        .eq("id", CONTENT_KEY)
        .maybeSingle();
      if (!error && data) {
        const content = sanitizePortalsContent({
          majorModules: data.major_modules,
          customModules: data.custom_modules,
        });
        globalThis.__onwardAirPortalsPageContent = content;
        return content;
      }
    } catch {
      // Fall through to memory defaults.
    }
  }
  return sanitizePortalsContent(memoryContent());
}

export async function writeOnwardAirPortalsContent(
  next: OnwardAirPortalsEditableContent,
): Promise<OnwardAirPortalsEditableContent> {
  const content = sanitizePortalsContent(next);
  globalThis.__onwardAirPortalsPageContent = content;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("onwardair_portals_page_content").upsert(
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
