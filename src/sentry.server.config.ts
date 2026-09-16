import * as Sentry from "@sentry/nextjs";

import { buildSentryServerOptions } from "@/lib/sentry/config";

Sentry.init(buildSentryServerOptions());
