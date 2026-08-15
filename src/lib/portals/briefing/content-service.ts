import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PortalsEditableContent } from "@/lib/portals/types";
import { getPortalPackBySlug } from "@/lib/portals/registry";

const CONTENT_KEY = "default";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __portalsBriefingContentCache: Record<string, PortalsEditableContent> | undefined;
}

function memoryCache(): Record<string, PortalsEditableContent> {
  if (!globalThis.__portalsBriefingContentCache) {
    globalThis.__portalsBriefingContentCache = {};
  }
  return globalThis.__portalsBriefingContentCache;
}

export async function readPortalsBriefingContent(
  workspaceSlug: string,
): Promise<PortalsEditableContent> {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack?.briefing) {
    throw new Error(`No portals briefing configured for workspace: ${workspaceSlug}`);
  }

  const { briefing } = pack;
  const cache = memoryCache();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from(briefing.contentTable)
        .select("major_modules, custom_modules")
        .eq("id", CONTENT_KEY)
        .maybeSingle();
      if (!error && data) {
        const content = briefing.sanitizeContent({
          majorModules: data.major_modules,
          customModules: data.custom_modules,
        });
        cache[pack.slug] = content;
        return content;
      }
    } catch {
      // Fall through to memory defaults.
    }
  }

  if (cache[pack.slug]) {
    return briefing.sanitizeContent(cache[pack.slug]);
  }

  const defaults = briefing.defaultContent();
  cache[pack.slug] = defaults;
  return defaults;
}

export async function writePortalsBriefingContent(
  workspaceSlug: string,
  next: PortalsEditableContent,
): Promise<PortalsEditableContent> {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack?.briefing) {
    throw new Error(`No portals briefing configured for workspace: ${workspaceSlug}`);
  }

  const { briefing } = pack;
  const content = briefing.sanitizeContent(next);
  memoryCache()[pack.slug] = content;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from(briefing.contentTable).upsert(
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
