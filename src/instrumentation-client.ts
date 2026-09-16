import * as Sentry from "@sentry/nextjs";

import { buildSentryClientOptions } from "@/lib/sentry/config";
import { applySentryBrowserRequestContext } from "@/lib/sentry/request-context";

Sentry.init(buildSentryClientOptions());

applySentryBrowserRequestContext();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
