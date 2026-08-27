/**
 * OmniTransit portal origins on the existing customer host omnitransit.unit311central.com.
 * Maps to the `saec` workspace (not a separate tenant).
 */

import { OMNITRANSIT_HOST_ALIAS_SLUG } from "@/lib/saec-surface";

export const OMNITRANSIT_PORTAL_ORIGIN = `https://${OMNITRANSIT_HOST_ALIAS_SLUG}.unit311central.com`;

export const OMNITRANSIT_CLIENT_PORTAL_ORIGIN = OMNITRANSIT_PORTAL_ORIGIN;

export const OMNITRANSIT_BOARD_PORTAL_ORIGIN = OMNITRANSIT_PORTAL_ORIGIN;
