import { saveCrmDiscoveryNotesDocument } from "@/lib/crm-discovery-document-service";
import { getLeadById, updateLead, type CrmWorkspaceScope } from "@/lib/crm-leads-service";
import { saveExecutiveCallTranscriptsForBookings } from "@/lib/executive-call-transcript-service";
import {
  completeFounderSessionBookingsForCrmLead,
  resolveBookingsForCrmLead,
} from "@/lib/founder-booking/service";
import { completeActionItemsForLead } from "@/lib/internal-action-items-service";

export type CommitCrmDiscoveryResult = {
  leadId: string;
  meetingsCompleted: number;
  alertsCleared: number;
  discoverySaved: boolean;
  transcriptsSaved: number;
  discoveryDocumentSaved: boolean;
  discoveryDocumentFileName: string | null;
  warnings: string[];
};

export async function commitCrmLeadDiscovery(
  leadId: string,
  discoveryNotes?: string,
  scope?: CrmWorkspaceScope,
): Promise<CommitCrmDiscoveryResult> {
  const warnings: string[] = [];
  let discoverySaved = false;

  const lead = await getLeadById(leadId, scope);
  if (!lead) {
    throw new Error("Lead not found.");
  }
  const leadScope: CrmWorkspaceScope = {
    workspaceId: scope?.workspaceId ?? lead.workspaceId,
    businessContext: scope?.businessContext,
  };

  if (discoveryNotes !== undefined) {
    await updateLead(leadId, { discoveryNotes }, leadScope);
    lead.discoveryNotes = discoveryNotes;
    discoverySaved = true;
  }

  const linkedBookings = await resolveBookingsForCrmLead(lead, leadScope);
  const completedMeetings = await completeFounderSessionBookingsForCrmLead(leadId, leadScope);
  const bookingIds = linkedBookings.map((meeting) => meeting.id);

  let alertsCleared = 0;
  try {
    alertsCleared = await completeActionItemsForLead(leadId, bookingIds);
  } catch (error) {
    warnings.push(
      `Home alerts: ${error instanceof Error ? error.message : "Failed to clear alerts"}`,
    );
  }

  let savedTranscripts: Array<{ bookingId: string; fileName: string }> = [];
  if (linkedBookings.length > 0) {
    try {
      savedTranscripts = await saveExecutiveCallTranscriptsForBookings(linkedBookings, {
        folderOrganization: lead.companyName,
        force: true,
      });
    } catch (error) {
      warnings.push(
        `Call notes: ${error instanceof Error ? error.message : "Failed to save call notes"}`,
      );
    }
  } else {
    warnings.push("No linked executive sessions found for this lead.");
  }

  let discoveryDocumentSaved = false;
  let discoveryDocumentFileName: string | null = null;

  if (lead.discoveryNotes.trim()) {
    try {
      const docResult = await saveCrmDiscoveryNotesDocument(lead);
      if (docResult) {
        discoveryDocumentSaved = true;
        discoveryDocumentFileName = docResult.fileName;
      }
    } catch (error) {
      warnings.push(
        `Discovery document: ${error instanceof Error ? error.message : "Failed to save discovery notes"}`,
      );
    }
  }

  return {
    leadId,
    meetingsCompleted: completedMeetings.length,
    alertsCleared,
    discoverySaved,
    transcriptsSaved: savedTranscripts.length,
    discoveryDocumentSaved,
    discoveryDocumentFileName,
    warnings,
  };
}
