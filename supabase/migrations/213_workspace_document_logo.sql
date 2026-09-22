-- Workspace document logo (PDFs / generated documents) — separate from login chrome (logo_url).

alter table public.workspace_settings
  add column if not exists document_logo_storage_path text,
  add column if not exists document_logo_pdf_storage_path text,
  add column if not exists document_logo_filename text,
  add column if not exists document_logo_content_type text;
