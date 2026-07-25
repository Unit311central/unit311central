export * from "./types";
export * from "./permissions";
export * from "./registry";
export * from "./capability-validation";
export * from "./capability-service";
export * from "./register-all-modules";
export * from "./audit-service";
export * from "./plan-store";
export * from "./execution-pipeline";
export * from "./discovery-tools";

// Domain modules — side-effect registration for Action Framework discovery.
import "./modules/clients/register";
export * from "./modules/clients";
import "./modules/projects/register";
export * from "./modules/projects";
import "./modules/crm/register";
export * from "./modules/crm";
import "./modules/calendar/register";
export * from "./modules/calendar";
import "./modules/finance/register";
export * from "./modules/finance";

// Planning Engine (additive orchestration layer).
export * from "./planning";
