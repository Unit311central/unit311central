/**
 * Emit Demo-only SQL from enterprise graph.
 */

import { sqlStr, sqlUuid } from "./rng.mjs";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function emitSeedSql(demoId, graph) {
  const w = sqlStr(demoId);
  const batches = [];

  // Company details
  batches.push(`
insert into public.company_details (
  id, workspace_id, legal_company_name, trading_name, company_number, vat_tax_number,
  registered_office_address, principal_business_address, country_of_registration,
  company_status, sic_industry_classification, website, primary_email, primary_telephone,
  general_company_description
) values (
  ${sqlStr(sqlUuid("dme-company-details"))},
  ${w}::uuid,
  ${sqlStr(graph.company.legalName)},
  ${sqlStr(graph.company.tradingName)},
  ${sqlStr(graph.company.companyNumber)},
  ${sqlStr(graph.company.vatNumber)},
  ${sqlStr(graph.company.registeredAddress)},
  ${sqlStr(graph.company.principalAddress)},
  ${sqlStr(graph.company.country)},
  'Active',
  ${sqlStr(graph.company.sic)},
  ${sqlStr(graph.company.website)},
  ${sqlStr(graph.company.email)},
  ${sqlStr(graph.company.phone)},
  ${sqlStr(graph.company.description)}
);
`);

  // GL accounts
  const accountValues = graph.glAccounts
    .map(
      (a) =>
        `(${sqlStr(sqlUuid(`dme-acct-${a.code}`))}::uuid, ${sqlStr(a.code)}, ${sqlStr(a.name)}, ${sqlStr(a.type)}, true, ${w}::uuid)`,
    )
    .join(",\n");
  batches.push(`
insert into public.accounts (id, code, name, type, is_active, workspace_id)
values
${accountValues};
`);

  // Clients
  for (const group of chunk(graph.clients, 25)) {
    const values = group
      .map((c) => {
        return `(${sqlStr(c.id)}, ${w}::uuid, ${sqlStr(c.companyName)}, ${sqlStr(c.industry)},
          ${sqlStr(`${c.contactFirst} ${c.contactLast}`)}, ${sqlStr(c.email)}, ${sqlStr(c.phone)},
          ${sqlStr(c.region)}, ${sqlStr(c.accountStatus)}, ${sqlStr(c.contractType)},
          ${sqlStr(c.taxId)}, ${sqlStr(c.address)}, 0, ${sqlStr(c.notes)},
          'Buyer', ${sqlStr(c.address)}, ${sqlStr(c.email)},
          ${sqlStr(c.contactFirst)}, ${sqlStr(c.contactLast)}, ${sqlStr(c.city)}, ${sqlStr(c.postcode)},
          ${sqlStr(c.country)}, true, ${sqlStr(c.subscriptionStatus)}, ${sqlStr(c.billingFrequency)},
          ${sqlStr(c.renewalDate)}::date)`;
      })
      .join(",\n");
    batches.push(`
insert into public.internal_clients (
  id, workspace_id, company_name, industry, primary_contact, email, phone, region,
  account_status, contract_type, tax_id, billing_address, active_projects, notes,
  job_title, company_address, invoice_email, primary_contact_first_name, primary_contact_surname,
  company_city, company_postcode, company_country, billing_same_as_company,
  subscription_status, billing_frequency, renewal_date
) values
${values};
`);
  }

  // Employees
  for (const group of chunk(graph.employees, 20)) {
    const values = group
      .map((e) => {
        const docs = JSON.stringify([
          { type: "contract", name: "Employment contract" },
          ...(e.certifications.length
            ? [{ type: "certificate", name: e.certifications[0] }]
            : []),
        ]);
        return `(${sqlStr(e.id)}, ${sqlStr(e.fullName)}, ${sqlStr(e.email)}, ${sqlStr(e.phone)},
          ${sqlStr(e.dateJoined)}::date, ${e.salary}, ${Math.round(e.salary * 0.92)},
          ${sqlStr(docs)}::jsonb, ${sqlStr(e.location)}, ${sqlStr(e.role)}, ${sqlStr(e.department)},
          ${sqlStr(e.manager)}, 0, 0, 'UK', 25, ${Math.floor(Math.random() * 12)},
          ${w}::uuid, ${sqlStr(e.preferredName)}, ${sqlStr(e.location)},
          ${sqlStr(`EC ${e.preferredName}`)}, ${sqlStr(e.phone)}, 'Partner',
          'British', 'active', ${sqlStr(e.employmentType)}, 'Monthly', 'GBP',
          false, false, ${sqlStr(e.officeId)})`;
      })
      .join(",\n");
    batches.push(`
insert into public.hr_employees (
  id, full_name, email, phone, date_joined, salary_current, salary_previous, documents,
  location, role, department, manager, bonus, salary_increase_amount, holiday_calendar,
  vacation_days_per_year, vacation_days_taken, workspace_id, preferred_name, address,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  nationality, employment_status, employment_type, pay_frequency, currency,
  company_assets_returned, accounts_disabled, office_id
) values
${values};
`);
  }

  // CRM leads
  for (const group of chunk(graph.leads, 25)) {
    const values = group
      .map(
        (l) =>
          `(${sqlStr(l.id)}::uuid, ${sqlStr(l.companyName)}, ${sqlStr(l.contactName)}, ${sqlStr(l.status)},
            ${w}::uuid, ${sqlStr(l.email)}, ${l.value})`,
      )
      .join(",\n");
    batches.push(`
insert into public.crm_leads (id, company_name, contact_name, status, workspace_id, email, estimated_value)
values
${values};
`);
  }

  // Projects
  for (const group of chunk(graph.projects, 15)) {
    const values = group
      .map(
        (p) =>
          `(${sqlStr(p.id)}::uuid, ${sqlStr(p.name)}, ${sqlStr(p.clientName)}, ${sqlStr(p.phase)},
            ${p.progressPct}, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.internal_projects (id, name, client_name, phase, progress_pct, workspace_id)
values
${values};
`);
  }

  // Project tasks
  const allTasks = graph.projects.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, projectId: p.id, startDays: p.startDaysAgo })),
  );
  for (const group of chunk(allTasks, 40)) {
    const values = group
      .map((t) => {
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - t.startDays + t.startOffset);
        const due = new Date(start);
        due.setUTCDate(due.getUTCDate() + (t.dueOffset - t.startOffset));
        return `(${sqlStr(t.id)}::uuid, ${sqlStr(t.projectId)}::uuid, ${w}::uuid, ${sqlStr(t.name)},
          ${sqlStr(start.toISOString().slice(0, 10))}::date,
          ${sqlStr(due.toISOString().slice(0, 10))}::date,
          ${t.progress}, ${sqlStr(t.resource)}, ${t.milestone}, false, 0)`;
      })
      .join(",\n");
    batches.push(`
insert into public.internal_project_tasks (
  id, project_id, workspace_id, name, start_date, due_date, progress, resource, milestone, critical, sort_order
) values
${values};
`);
  }

  // Support tickets
  for (const group of chunk(graph.tickets, 25)) {
    const values = group
      .map(
        (t) =>
          `(${sqlStr(t.id)}, ${sqlStr(t.name)}, ${sqlStr(t.organisation)}, ${sqlStr(t.priority)},
            ${sqlStr(t.description)}, false, ${t.closed}, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.support_tickets (
  id, name, organisation, priority, description, archived, closed, workspace_id
) values
${values};
`);
  }

  // Calendar
  for (const group of chunk(graph.calendar, 30)) {
    const values = group
      .map(
        (e) =>
          `(${sqlStr(e.id)}::uuid, ${sqlStr(e.title)}, ${sqlStr(e.eventType)},
            ${sqlStr(e.startsAt)}::timestamptz, ${sqlStr(e.endsAt)}::timestamptz, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.internal_calendar_events (
  id, title, event_type, starts_at, ends_at, workspace_id
) values
${values};
`);
  }

  // Actions
  {
    const values = graph.actions
      .map(
        (a) =>
          `(${sqlStr(a.id)}::uuid, ${sqlStr(a.priority)}, ${sqlStr(a.task)}, ${sqlStr(a.assignedTo)},
            ${sqlStr(a.dueLabel)}, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.internal_action_items (id, priority, task, assigned_to, due_label, workspace_id)
values
${values};
`);
  }

  // Invoices
  for (const group of chunk(graph.invoices, 30)) {
    const values = group
      .map(
        (inv) =>
          `(${sqlStr(inv.id)}::uuid, ${sqlStr(inv.invoiceNumber)}, ${sqlStr(inv.clientId)},
            ${sqlStr(inv.issueDate)}::date, ${sqlStr(inv.dueDate)}::date,
            ${sqlStr(inv.currency)}, ${inv.amount}, ${sqlStr(inv.status)},
            ${sqlStr(inv.paymentReference)}, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.invoices (
  id, invoice_number, client_id, issue_date, due_date, currency, amount, status, payment_reference, workspace_id
) values
${values};
`);
  }

  // Stamp paid invoices with realistic payment timestamps (used as paidAt fallback).
  const paidWithDates = graph.invoices.filter((inv) => inv.status === "paid" && inv.paidAt);
  for (const group of chunk(paidWithDates, 40)) {
    const cases = group
      .map(
        (inv) =>
          `when id = ${sqlStr(inv.id)}::uuid then ${sqlStr(`${inv.paidAt}T12:00:00.000Z`)}::timestamptz`,
      )
      .join("\n  ");
    const ids = group.map((inv) => `${sqlStr(inv.id)}::uuid`).join(", ");
    batches.push(`
update public.invoices
set updated_at = case
  ${cases}
  else updated_at
end
where workspace_id = ${w}::uuid
  and id in (${ids});
`);
  }

  // Expenses
  for (const group of chunk(graph.expenses, 30)) {
    const values = group
      .map(
        (e) =>
          `(${sqlStr(e.id)}::uuid, ${sqlStr(e.submitterUserId)}, ${sqlStr(e.submitterName)},
            ${sqlStr(e.purpose)}, ${e.amount}, ${sqlStr(e.currency)},
            ${sqlStr(e.dateSubmitted)}::timestamptz, ${e.paid}, ${w}::uuid,
            ${sqlStr(e.supplier)}, ${sqlStr(e.categoryCode)}, ${sqlStr(e.dateSubmitted)}::date)`,
      )
      .join(",\n");
    batches.push(`
insert into public.financial_expenses (
  id, submitter_user_id, submitter_name, purpose_description, amount, currency,
  date_submitted, paid, workspace_id, supplier, category_account_code, expense_date
) values
${values};
`);
  }

  // Monthly journals
  for (const [idx, m] of graph.monthlyFinance.entries()) {
    const entryId = sqlUuid(`dme-je-${m.month}`);
    const ar = sqlUuid("dme-acct-1030");
    const rev = sqlUuid("dme-acct-4010");
    const cash = sqlUuid("dme-acct-1010");
    const opex = sqlUuid("dme-acct-5020");
    batches.push(`
insert into public.journal_entries (
  id, reference, description, status, journal_date, posted_at, workspace_id
) values (
  ${sqlStr(entryId)}::uuid,
  ${sqlStr(`MAG-JE-${m.month}`)},
  ${sqlStr(`Monthly operating close ${m.month}`)},
  'posted',
  ${sqlStr(m.journalDate)}::date,
  ${sqlStr(m.journalDate)}::timestamptz,
  ${w}::uuid
);

insert into public.journal_lines (id, journal_entry_id, account_id, debit, credit, description, workspace_id)
values
  (${sqlStr(sqlUuid(`dme-jl-${idx}-1`))}::uuid, ${sqlStr(entryId)}::uuid, ${sqlStr(ar)}::uuid, ${m.revenue}, 0, 'AR accrual', ${w}::uuid),
  (${sqlStr(sqlUuid(`dme-jl-${idx}-2`))}::uuid, ${sqlStr(entryId)}::uuid, ${sqlStr(rev)}::uuid, 0, ${m.revenue}, 'Professional services revenue', ${w}::uuid),
  (${sqlStr(sqlUuid(`dme-jl-${idx}-3`))}::uuid, ${sqlStr(entryId)}::uuid, ${sqlStr(opex)}::uuid, ${m.opex}, 0, 'Operating expenses', ${w}::uuid),
  (${sqlStr(sqlUuid(`dme-jl-${idx}-4`))}::uuid, ${sqlStr(entryId)}::uuid, ${sqlStr(cash)}::uuid, 0, ${m.opex}, 'Cash for opex', ${w}::uuid);
`);
  }

  // Payroll settings + profiles + runs
  batches.push(`
insert into public.payroll_settings (
  workspace_id, federal_tax_pct, state_tax_pct, social_security_pct, medicare_pct,
  employer_payroll_pct, default_currency, payroll_frequency, pay_day, country_code, default_tax_state
) values (
  ${sqlStr(demoId)}, 20, 2, 8, 1.5, 13.8, 'GBP', 'Monthly', 28, 'GB', 'ENG'
);
`);

  for (const group of chunk(graph.employees, 25)) {
    const values = group
      .map(
        (e) =>
          `(${sqlStr(sqlUuid(`dme-payprof-${e.id}`))}, ${sqlStr(demoId)}, ${sqlStr(e.id)},
            0, 0, 'Monthly', 'GBP', 'ENG', 'active', ${sqlStr(`****${e.id.slice(-4)}`)},
            ${sqlStr("00-00-00")}, ${sqlStr(e.id)}, ${sqlStr(`NI-${e.id}`)},
            ${sqlStr(e.manager)}, ${sqlStr(e.department)}, ${sqlStr(e.department)})`,
      )
      .join(",\n");
    batches.push(`
insert into public.payroll_employee_profiles (
  id, workspace_id, employee_id, bonus, commission, payroll_frequency, currency, tax_state,
  payroll_status, bank_account, routing_number, payroll_employee_id, tax_id, manager, department, cost_centre
) values
${values};
`);
  }

  for (let m = 11; m >= 0; m -= 1) {
    const runId = sqlUuid(`dme-payrun-${m}`);
    const periodStart = graph.monthlyFinance[11 - m]?.journalDate ?? graph.monthlyFinance[0].journalDate;
    const gross = Number((graph.employees.reduce((s, e) => s + e.salary / 12, 0)).toFixed(2));
    const tax = Number((gross * 0.22).toFixed(2));
    const employer = Number((gross * 0.138).toFixed(2));
    const net = Number((gross - tax).toFixed(2));
    batches.push(`
insert into public.payroll_runs (
  id, workspace_id, period_start, period_end, pay_date, status, employee_count,
  gross_payroll, employee_tax, employer_tax, net_payroll, currency, wise_payment_status, notes
) values (
  ${sqlStr(runId)}, ${sqlStr(demoId)}, ${sqlStr(periodStart)}::date, ${sqlStr(periodStart)}::date,
  ${sqlStr(periodStart)}::date, 'paid', ${graph.employees.length},
  ${gross}, ${tax}, ${employer}, ${net}, 'GBP', 'completed', ${sqlStr(`${graph.tag} payroll`)}
);
`);
    // Sample lines for first 20 employees each month (keeps SQL size reasonable)
    const lineValues = graph.employees
      .slice(0, 20)
      .map((e, i) => {
        const g = Number((e.salary / 12).toFixed(2));
        const et = Number((g * 0.22).toFixed(2));
        const er = Number((g * 0.138).toFixed(2));
        return `(${sqlStr(sqlUuid(`dme-payline-${m}-${i}`))}, ${sqlStr(demoId)}, ${sqlStr(runId)},
          ${sqlStr(e.id)}, ${sqlStr(e.fullName)}, ${sqlStr(e.department)}, ${sqlStr(e.department)},
          ${g}, 0, 0, ${et}, 0, 0, 0, ${er}, ${Number((g - et).toFixed(2))}, ${Number((g + er).toFixed(2))}, 'GBP')`;
      })
      .join(",\n");
    batches.push(`
insert into public.payroll_run_lines (
  id, workspace_id, run_id, employee_id, employee_name, department, cost_centre,
  gross, bonus, commission, federal_tax, state_tax, social_security, medicare, employer_tax,
  net, total_employment_cost, currency
) values
${lineValues};
`);
  }

  // Software assets
  {
    const values = graph.software
      .map(
        (s) =>
          `(${sqlStr(s.id)}::uuid, ${w}::uuid, ${sqlStr(s.name)}, ${sqlStr(s.vendor)},
            ${sqlStr(s.category)}, ${sqlStr(s.category)}, '', '', '', 'Active',
            ${s.licences}, ${Math.floor(s.licences * 0.85)}, 'Named',
            ${s.monthly}, ${s.annual}, 'GBP', 'Annually', '12 months', 'Technology',
            'CTO', ${sqlStr(s.vendor)}, '', '5010', 'CTO', 'IT Ops', 'Technology', 'CFO',
            ${sqlStr(s.vendor)}, 'Account Manager', 'support@vendor.example', '', '',
            false, false, '', 'not_connected', 'idle')`,
      )
      .join(",\n");
    batches.push(`
insert into public.software_assets (
  id, workspace_id, name, vendor, purpose, category, website_url, support_url, documentation_url, status,
  licences_purchased, licences_allocated, licence_type, monthly_cost, annual_cost, currency,
  renewal_frequency, contract_length, cost_centre, budget_owner, supplier_name, invoice_reference,
  financial_account_code, business_owner, technical_owner, department, approver, supplier_company,
  account_manager, support_email, support_phone, customer_number, integration_connected,
  integration_api_key_set, integration_webhook_url, integration_oauth_status, integration_sync_status
) values
${values};
`);
  }

  // Messaging presence
  batches.push(`
insert into public.internal_message_channels (
  id, room, name, created_by_operator_id, created_by_operator_name, member_operator_ids,
  channel_type, member_client_usernames, workspace_id
) values (
  ${sqlStr(sqlUuid("dme-chan-ops"))}::uuid,
  'internal-ops',
  'Operations',
  'user-demo-owner',
  'Demo Owner',
  array['user-demo-owner']::text[],
  'internal',
  array[]::text[],
  ${w}::uuid
);

insert into public.internal_messages (
  id, room, operator_id, operator_name, username, content, message_type, workspace_id
) values
  (${sqlStr(sqlUuid("dme-msg-1"))}::uuid, 'internal-ops', 'user-demo-owner', 'Demo Owner', 'demo@unit311central.com',
   ${sqlStr(`${graph.tag} Welcome to Meridian Atlas Operations.`)}, 'text', ${w}::uuid),
  (${sqlStr(sqlUuid("dme-msg-2"))}::uuid, 'internal-ops', 'user-demo-owner', 'Demo Owner', 'demo@unit311central.com',
   'Q3 delivery reviews are scheduled this week — London + Berlin offices.', 'text', ${w}::uuid),
  (${sqlStr(sqlUuid("dme-msg-3"))}::uuid, 'internal-ops', 'user-demo-owner', 'Alex Morgan', 'alex.morgan@meridianatlas.demo',
   'Invoice pack MAG-DME ready for CFO sign-off.', 'text', ${w}::uuid),
  (${sqlStr(sqlUuid("dme-msg-4"))}::uuid, 'internal-ops', 'user-demo-owner', 'Finance Desk', 'finance@meridianatlas.demo',
   'Wise GBP operating balance reconciled this morning.', 'text', ${w}::uuid);
`);

  // Wise payment matches for paid invoices (subset) — matched_at = real paidAt, not seed now().
  const paid = graph.invoices.filter((i) => i.status === "paid" && i.paidAt).slice(0, 50);
  if (paid.length) {
    const values = paid
      .map(
        (inv, i) =>
          `(${sqlStr(sqlUuid(`dme-wpm-${i}`))}::uuid, ${sqlStr(`dme-wise-in-${i + 1}`)},
            ${sqlStr(inv.id)}::uuid, ${sqlStr(`${inv.paidAt}T12:00:00.000Z`)}::timestamptz, ${w}::uuid)`,
      )
      .join(",\n");
    batches.push(`
insert into public.wise_payment_matches (id, wise_transaction_id, invoice_id, matched_at, workspace_id)
values
${values};
`);
  }

  // Treasury settings marker for Demo connected state
  batches.push(`
insert into public.treasury_settings (workspace_id, data)
values (
  ${w}::uuid,
  ${sqlStr(
    JSON.stringify({
      provider: "demo-wise-simulator",
      connected: true,
      lastSuccessfulSyncAt: new Date().toISOString(),
      syncHistory: [{ at: new Date().toISOString(), status: "success" }],
    }),
  )}::jsonb
);
`);

  return batches;
}
