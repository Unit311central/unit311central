import type { MarketingResource } from "@/lib/marketing/client/marketing-api";
import type {
  MailingCampaign,
  MailingContact,
  PortfolioStory,
  StoriesNewsletter,
} from "@/lib/talanton/marketing-stories-store";
import type { JourneyStory } from "@/lib/talanton/journey-stories-store";

function sync(
  resource: MarketingResource,
  payload: Record<string, unknown>,
  rehydrate: () => Promise<boolean>,
) {
  if (typeof window === "undefined") return;
  void import("@/lib/marketing/client/store-write-through").then(({ writeThroughMarketingResource }) =>
    writeThroughMarketingResource(resource, payload, rehydrate),
  );
}

function remove(resource: MarketingResource, id: string, rehydrate: () => Promise<boolean>) {
  if (typeof window === "undefined") return;
  void import("@/lib/marketing/client/store-write-through").then(({ deleteThroughMarketingResource }) =>
    deleteThroughMarketingResource(resource, id, rehydrate),
  );
}

async function rehydrateMarketingStories() {
  const { hydrateTalantonMarketingStoriesFromCentralApi } = await import(
    "@/lib/talanton/marketing-stories-store"
  );
  return hydrateTalantonMarketingStoriesFromCentralApi();
}

async function rehydrateJourneyStories() {
  const { hydrateTalantonJourneyStoriesFromCentralApi } = await import(
    "@/lib/talanton/journey-stories-store"
  );
  return hydrateTalantonJourneyStoriesFromCentralApi();
}

export function portfolioStoryCentralPayload(story: PortfolioStory) {
  return {
    id: story.id,
    storyKind: "portfolio",
    title: story.title,
    summary: story.summary,
    body: story.fullStory,
    status: story.status,
    extensionData: {
      companyId: story.companyId,
      companyName: story.companyName,
      country: story.country,
      submissionDate: story.submissionDate,
      impactCategory: story.impactCategory,
      photos: story.photos,
      videos: story.videos,
      attachments: story.attachments,
      submittedBy: story.submittedBy,
    },
  };
}

export function journeyStoryCentralPayload(story: JourneyStory) {
  return {
    id: story.id,
    storyKind: "journey",
    title: story.title,
    summary: story.purpose || story.title,
    body: story.generated?.investorUpdate ?? "",
    status: story.status,
    extensionData: story,
  };
}

function newsletterCentralPayload(newsletter: StoriesNewsletter) {
  return {
    id: newsletter.id,
    title: newsletter.title,
    subject: newsletter.subject,
    htmlBody: newsletter.htmlBody,
    status: newsletter.status,
    recipientMode: newsletter.recipientMode,
    recipientIds: newsletter.recipientContactIds,
    manualEmails: newsletter.manualEmails,
    scheduledAt: newsletter.scheduledAt,
    sentAt: newsletter.sentAt,
    contentSources: {
      portfolioStoryIds: newsletter.selectedStoryIds,
      journeyStoryIds: newsletter.selectedJourneyStoryIds ?? [],
    },
  };
}

function contactCentralPayload(contact: MailingContact) {
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    organisation: contact.organisation,
    segment: contact.segment,
    status: "active",
  };
}

function campaignCentralPayload(campaign: MailingCampaign) {
  return {
    id: campaign.id,
    subject: campaign.subject,
    body: campaign.body,
    status: campaign.status,
    recipientMode: campaign.recipientMode,
    recipientIds: campaign.recipientContactIds,
    manualEmails: campaign.manualEmails,
    scheduledAt: campaign.scheduledAt,
    sentAt: campaign.sentAt,
  };
}

export function syncTalantonPortfolioStory(story: PortfolioStory) {
  sync("stories", portfolioStoryCentralPayload(story), rehydrateMarketingStories);
}

export function syncTalantonJourneyStory(story: JourneyStory) {
  sync("stories", journeyStoryCentralPayload(story), rehydrateJourneyStories);
}

export function syncTalantonNewsletter(newsletter: StoriesNewsletter) {
  sync("newsletters", newsletterCentralPayload(newsletter), rehydrateMarketingStories);
}

export function deleteTalantonNewsletter(id: string) {
  remove("newsletters", id, rehydrateMarketingStories);
}

export function syncTalantonMailingContact(contact: MailingContact) {
  sync("contacts", contactCentralPayload(contact), rehydrateMarketingStories);
}

export function deleteTalantonMailingContact(id: string) {
  remove("contacts", id, rehydrateMarketingStories);
}

export function syncTalantonMailingCampaign(campaign: MailingCampaign) {
  sync("campaigns", campaignCentralPayload(campaign), rehydrateMarketingStories);
}

export function deleteTalantonMailingCampaign(id: string) {
  remove("campaigns", id, rehydrateMarketingStories);
}
