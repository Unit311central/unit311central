import fixturesJson from "./fixtures.generated.json";

export type DemoEnterpriseFixtures = typeof fixturesJson;

export const demoEnterpriseFixtures = fixturesJson as DemoEnterpriseFixtures;

export function getDemoEnterpriseFixtures(): DemoEnterpriseFixtures {
  return demoEnterpriseFixtures;
}

export { isBrowserDemoSurface } from "./surface";
