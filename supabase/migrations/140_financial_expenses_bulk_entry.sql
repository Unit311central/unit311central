-- Bulk expense entry: persisted drafts and reimbursable flag for personally-paid claims.

alter table public.financial_expenses
  add column if not exists record_status text not null default 'finalized'
    check (record_status in ('draft', 'finalized'));

alter table public.financial_expenses
  add column if not exists reimbursable boolean not null default false;

create index if not exists financial_expenses_record_status_idx
  on public.financial_expenses (workspace_id, record_status);

comment on column public.financial_expenses.record_status is
  'draft = in-progress entry (no GL journal); finalized = counted in spend and reports.';

comment on column public.financial_expenses.reimbursable is
  'True when the submitter paid personally and expects reimbursement.';
