import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { chaseOverdueInvoiceAction } from "./chase-overdue-invoice";
import { createExpenseAction } from "./create-expense";

const FINANCE_ACTIONS = [createExpenseAction, chaseOverdueInvoiceAction] as const;

let registered = false;

export function registerFinanceActions() {
  for (const action of FINANCE_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return FINANCE_ACTIONS.length;
}

export function listRegisteredFinanceActionIds() {
  return FINANCE_ACTIONS.map((a) => a.id);
}

registerFinanceActions();
