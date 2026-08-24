"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Receipt } from "lucide-react";

import {
  isAccountsPayableSeedExpense,
  type FinancialExpense,
} from "@/lib/expenses-data";
import type { HrEmployee } from "@/lib/hr-data";
import type {
  ExpenseBillingCode,
  ExpenseCategory,
  ExpenseMileageRate,
  ExpenseNotification,
  ExpensePaymentSchedule,
} from "@/lib/expense-management/types";
import { resolveExpenseAccess } from "@/lib/expense-management/permissions";
import {
  buildExpenseWorkflowDashboardCatalog,
  DEFAULT_EXPENSE_WORKFLOW_TILE_LAYOUT,
} from "@/lib/expense-workflow-summary";
import DashboardTopTilesBar from "@/components/testflighthub/DashboardTopTilesBar";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";

import ExpenseDetailDrawer from "./expenses/ExpenseDetailDrawer";
import ExpenseAddForm from "./expenses/ExpenseAddForm";
import ExpenseApprovalsPanel from "./expenses/ExpenseApprovalsPanel";
import ExpenseConfigPanel from "./expenses/ExpenseConfigPanel";
import ExpenseListPanel from "./expenses/ExpenseListPanel";
import ExpenseRunsPanel from "./expenses/ExpenseRunsPanel";
import {
  EXPENSE_SECTION_COPY,
  readApiJson,
  resolveExpenseHubSection,
  SectionTabs,
  type ExpenseHubSection,
} from "./expenses/expense-hub-shared";

type ExpensesHubWorkspaceProps = {
  onBackToFinancials?: () => void;
};

export default function ExpensesHubWorkspace({ onBackToFinancials }: ExpensesHubWorkspaceProps) {
  const searchParams = useSearchParams();
  const [section, setSection] = useState<ExpenseHubSection>(() =>
    resolveExpenseHubSection(searchParams.get("section")),
  );

  useEffect(() => {
    setSection(resolveExpenseHubSection(searchParams.get("section")));
  }, [searchParams]);
  const { allowedViews } = useOperatorEntitlements();
  const [sessionUser, setSessionUser] = useState<{ userId: string; displayName: string }>({
    userId: "",
    displayName: "",
  });

  const access = useMemo(
    () =>
      resolveExpenseAccess({
        session: {
          sub: sessionUser.userId,
          displayName: sessionUser.displayName,
        },
        allowedViews,
      }),
    [allowedViews, sessionUser],
  );

  const [myExpenses, setMyExpenses] = useState<FinancialExpense[]>([]);
  const [allExpenses, setAllExpenses] = useState<FinancialExpense[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [billingCodes, setBillingCodes] = useState<ExpenseBillingCode[]>([]);
  const [mileageRates, setMileageRates] = useState<ExpenseMileageRate[]>([]);
  const [schedule, setSchedule] = useState<ExpensePaymentSchedule | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<FinancialExpense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<FinancialExpense | null>(null);
  const [notifications, setNotifications] = useState<ExpenseNotification[]>([]);

  const claimExpenses = useMemo(
    () => myExpenses.filter((expense) => !isAccountsPayableSeedExpense(expense)),
    [myExpenses],
  );

  const allClaimExpenses = useMemo(
    () => allExpenses.filter((expense) => !isAccountsPayableSeedExpense(expense)),
    [allExpenses],
  );

  const workflowTiles = useMemo(
    () => buildExpenseWorkflowDashboardCatalog(claimExpenses, currency),
    [claimExpenses, currency],
  );

  const defaultEmployeeId = useMemo(() => {
    const match = employees.find(
      (employee) =>
        employee.email &&
        sessionUser.displayName &&
        employee.fullName.toLowerCase() === sessionUser.displayName.toLowerCase(),
    );
    return match?.id ?? employees[0]?.id ?? null;
  }, [employees, sessionUser.displayName]);

  useEffect(() => {
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { userId?: string; displayName?: string }) => {
        setSessionUser({
          userId: String(payload.userId ?? ""),
          displayName: String(payload.displayName ?? ""),
        });
      })
      .catch(() => {
        /* optional */
      });
  }, []);

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myResponse, configResponse, employeesResponse, notificationsResponse] =
        await Promise.all([
          fetch("/api/expenses/my", { cache: "no-store" }),
          fetch("/api/expenses/config", { cache: "no-store" }),
          fetch("/api/hr/employees", { cache: "no-store" }),
          fetch("/api/expenses/notifications", { cache: "no-store" }),
        ]);

      const myData = await readApiJson<{
        expenses?: FinancialExpense[];
        currency?: string;
        error?: string;
      }>(myResponse);
      if (!myResponse.ok) throw new Error(myData.error ?? "Failed to load my expenses");
      setMyExpenses(myData.expenses ?? []);
      setCurrency(myData.currency ?? "USD");

      const configData = await readApiJson<{
        categories?: ExpenseCategory[];
        billingCodes?: ExpenseBillingCode[];
        mileageRates?: ExpenseMileageRate[];
        schedule?: ExpensePaymentSchedule;
      }>(configResponse);
      if (configResponse.ok) {
        setCategories(configData.categories ?? []);
        setBillingCodes(configData.billingCodes ?? []);
        setMileageRates(configData.mileageRates ?? []);
        setSchedule(configData.schedule ?? null);
      }

      const employeesData = await readApiJson<{ employees?: HrEmployee[] }>(employeesResponse);
      if (employeesResponse.ok) {
        setEmployees(
          (employeesData.employees ?? []).filter(
            (employee) => employee.employmentStatus !== "archived",
          ),
        );
      }

      if (notificationsResponse.ok) {
        const notificationsData = await readApiJson<{ notifications?: ExpenseNotification[] }>(
          notificationsResponse,
        );
        setNotifications(notificationsData.notifications ?? []);
      }

      if (access.canViewAll) {
        const allResponse = await fetch("/api/financials/expenses", { cache: "no-store" });
        const allData = await readApiJson<{
          expenses?: FinancialExpense[];
          currency?: string;
        }>(allResponse);
        if (allResponse.ok) {
          setAllExpenses(allData.expenses ?? []);
          if (allData.currency) setCurrency(allData.currency);
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [access.canViewAll]);

  useEffect(() => {
    startTransition(() => {
      void loadCore();
    });
  }, [loadCore]);

  function navigateSection(next: ExpenseHubSection) {
    setSection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "expenses");
    if (next === "my") {
      url.searchParams.delete("section");
    } else {
      url.searchParams.set("section", next);
    }
    window.history.replaceState(null, "", url.toString());
  }

  function handleSaved(expense: FinancialExpense, savedMessage: string) {
    setMyExpenses((current) => {
      const map = new Map(current.map((row) => [row.id, row]));
      map.set(expense.id, expense);
      return [...map.values()];
    });
    setMessage(savedMessage);
    setEditExpense(null);
    navigateSection("my");
    void loadCore();
  }

  const sectionCopy = EXPENSE_SECTION_COPY[section];
  const tabs: Array<{ id: ExpenseHubSection; label: string; hidden?: boolean }> = [
    { id: "my", label: "My Expenses" },
    { id: "add", label: "Add Expense" },
    { id: "all", label: "All Expenses", hidden: !access.canViewAll },
    { id: "approvals", label: "Approvals", hidden: !access.canApprove },
    { id: "runs", label: "Expense Runs", hidden: !access.canManageRuns },
    { id: "config", label: "Configuration", hidden: !access.canConfigure },
  ];

  return (
    <div className="space-y-6">
      <DashboardTopTilesBar
        storageKey={
          isBrowserOnwardAirSurface()
            ? "oa-expenses-workflow-tiles-v1"
            : "unit311-expenses-workflow-tiles-v1"
        }
        catalog={workflowTiles}
        defaultLayout={[...DEFAULT_EXPENSE_WORKFLOW_TILE_LAYOUT]}
        title="Expenses summary"
        showCustomizeHint={false}
      />

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-3">
            {onBackToFinancials && (
              <button
                type="button"
                onClick={onBackToFinancials}
                className="mt-0.5 inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Finances
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{sectionCopy.title}</h3>
              </div>
              <p className="mt-1 text-xs text-white/45">{sectionCopy.description}</p>
            </div>
          </div>
          {section === "my" && (
            <button
              type="button"
              onClick={() => navigateSection("add")}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add expense
            </button>
          )}
        </div>

        <div className="mt-5">
          <SectionTabs
            tabs={tabs}
            active={section}
            onChange={(id) => navigateSection(id as ExpenseHubSection)}
          />
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && section === "my" && (
        <>
          {notifications.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">
                Notifications
              </h4>
              <ul className="mt-2 space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <li key={notification.id} className="text-sm text-white/70">
                    {notification.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ExpenseListPanel
            expenses={claimExpenses}
            onSelect={(expense) => setSelectedExpense(expense)}
            onEdit={(expense) => {
              setEditExpense(expense);
              navigateSection("add");
            }}
            emptyMessage="You have not submitted any expenses yet."
          />
        </>
      )}

      {!loading && section === "add" && sessionUser.userId && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
          <ExpenseAddForm
            currency={currency}
            employees={employees}
            categories={categories}
            billingCodes={billingCodes}
            mileageRates={mileageRates}
            currentUserId={sessionUser.userId}
            currentUserName={sessionUser.displayName || "You"}
            defaultEmployeeId={defaultEmployeeId}
            editExpense={editExpense}
            onSaved={handleSaved}
            onCancel={
              editExpense
                ? () => {
                    setEditExpense(null);
                    navigateSection("my");
                  }
                : undefined
            }
          />
        </section>
      )}

      {!loading && section === "all" && access.canViewAll && (
        <ExpenseListPanel
          expenses={allClaimExpenses}
          showEmployee
          onSelect={(expense) => setSelectedExpense(expense)}
          emptyMessage="No workspace expenses recorded."
        />
      )}

      {!loading && section === "approvals" && access.canApprove && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
          <ExpenseApprovalsPanel
            expenses={allClaimExpenses}
            onActionComplete={() => void loadCore()}
          />
        </section>
      )}

      {!loading && section === "runs" && access.canManageRuns && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
          <ExpenseRunsPanel />
        </section>
      )}

      {!loading && section === "config" && access.canConfigure && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
          <ExpenseConfigPanel />
        </section>
      )}

      {section === "my" && schedule && (
        <p className="text-[11px] text-white/35">
          Workspace currency: <span className="text-white/55">{currency}</span>
          {" "}
          · Schedule: {schedule.frequency === "fortnightly" ? "Every 2 weeks" : "Monthly"}
          · Payment day {schedule.paymentDay} · Cut-off day {schedule.cutoffDay}
        </p>
      )}

      <ExpenseDetailDrawer
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        employees={employees}
        categories={categories}
        billingCodes={billingCodes}
      />
    </div>
  );
}
