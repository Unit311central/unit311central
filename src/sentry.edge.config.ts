import * as Sentry from "@sentry/nextjs";

import { buildSentryEdgeOptions } from "@/lib/sentry/config";

Sentry.init(buildSentryEdgeOptions());
