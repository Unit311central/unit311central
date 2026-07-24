-- Allow demo@unit311central.com mailbox credentials alongside info/paul/admin

alter table public.email_mailbox_credentials
  drop constraint if exists email_mailbox_credentials_account_id_check;

alter table public.email_mailbox_credentials
  add constraint email_mailbox_credentials_account_id_check
  check (account_id in ('info', 'paul', 'admin', 'demo'));
