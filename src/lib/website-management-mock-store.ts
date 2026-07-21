import {
  createSeedDeployments,
  createSeedWebsiteContent,
  createSeedWebsites,
  type ManagedWebsite,
  type WebsiteCmsType,
  type WebsiteContentItem,
  type WebsiteDeployment,
  type WebsiteEnvironment,
} from "@/lib/website-management-data";

export type WebsiteMockState = {
  websites: ManagedWebsite[];
  content: WebsiteContentItem[];
  deployments: WebsiteDeployment[];
};

const seedWebsites = createSeedWebsites();

let state: WebsiteMockState = {
  websites: seedWebsites,
  content: seedWebsites.flatMap((site) => createSeedWebsiteContent(site.id)),
  deployments: seedWebsites.flatMap((site) => createSeedDeployments(site.id)),
};

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

export function subscribeWebsiteMockStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWebsiteMockSnapshot() {
  return state;
}

export function addManagedWebsite(input: {
  name: string;
  cms: WebsiteCmsType;
  url: string;
  restApiUrl: string;
  environment: WebsiteEnvironment;
  clientName: string;
  providerCode: string;
}) {
  const id = `web-${Date.now()}`;
  const website: ManagedWebsite = {
    id,
    name: input.name,
    cms: input.cms,
    url: input.url,
    restApiUrl: input.restApiUrl,
    environment: input.environment,
    domain: (() => {
      try {
        return new URL(input.url).hostname;
      } catch {
        return input.url;
      }
    })(),
    sslStatus: "Valid",
    lastDeployment: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    pages: 0,
    posts: 0,
    media: 0,
    pluginUpdates: 0,
    themeUpdates: 0,
    backups: 1,
    analyticsVisitors: 0,
    connectionStatus: "connected",
    providerCode: input.providerCode,
    clientName: input.clientName,
  };
  state = {
    ...state,
    websites: [website, ...state.websites],
    content: [...createSeedWebsiteContent(id), ...state.content],
    deployments: [...createSeedDeployments(id), ...state.deployments],
  };
  emit();
  return website;
}

export function updateContentStatus(id: string, status: WebsiteContentItem["status"]) {
  state = {
    ...state,
    content: state.content.map((row) =>
      row.id === id ? { ...row, status, updatedAt: new Date().toISOString().slice(0, 10) } : row,
    ),
  };
  emit();
}

export function deleteContentItem(id: string) {
  state = { ...state, content: state.content.filter((row) => row.id !== id) };
  emit();
}

export function recordDeployment(websiteId: string, environment: WebsiteEnvironment, note: string) {
  const deployment: WebsiteDeployment = {
    id: `dep-${Date.now()}`,
    websiteId,
    environment,
    at: new Date().toISOString(),
    by: "Operations",
    note,
    status: "Succeeded",
  };
  state = {
    ...state,
    deployments: [deployment, ...state.deployments],
    websites: state.websites.map((site) =>
      site.id === websiteId
        ? { ...site, lastDeployment: deployment.at, lastSync: deployment.at }
        : site,
    ),
  };
  emit();
  return deployment;
}
