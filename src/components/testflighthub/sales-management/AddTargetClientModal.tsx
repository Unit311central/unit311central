"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { CLIENT_INDUSTRY_OPTIONS } from "@/lib/client-management-data";
import {
  validateAddTargetClientForm,
  type AddTargetClientFormValues,
  type TargetClientFieldErrors,
} from "@/lib/target-clients";
import { cn } from "@/lib/utils";

const EMPTY_FORM: AddTargetClientFormValues = {
  companyName: "",
  website: "",
  sector: "",
  contactName: "",
  contactPosition: "",
  email: "",
};

function fieldClass(hasError: boolean) {
  return cn(
    "mt-1.5 w-full rounded-lg border bg-[#0b1524] px-3 py-2 text-[13px] text-white outline-none focus:border-violet-400/50",
    hasError ? "border-red-400/50" : "border-white/10",
  );
}

export type AddTargetClientModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export default function AddTargetClientModal({ open, onClose, onSaved }: AddTargetClientModalProps) {
  const [values, setValues] = useState<AddTargetClientFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<TargetClientFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setSaving(false);
  }, [open]);

  const updateField = useCallback(
    (key: keyof AddTargetClientFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setFormError(null);
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const errors = validateAddTargetClientForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/sales-management/target-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as {
        error?: string;
        fieldErrors?: TargetClientFieldErrors;
        code?: string;
      };

      if (!response.ok) {
        if (body.fieldErrors) setFieldErrors(body.fieldErrors);
        setFormError(body.error ?? `Save failed (${response.status})`);
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setFormError("Network error — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-target-client-title"
        className="my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1220] shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="add-target-client-title" className="text-base font-semibold text-white">
            Add Target Client
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {formError ? (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <label className="text-xs font-medium text-white/70">
              Company Name <span className="text-violet-300">*</span>
            </label>
            <input
              type="text"
              value={values.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className={fieldClass(Boolean(fieldErrors.companyName))}
              autoComplete="organization"
              disabled={saving}
            />
            {fieldErrors.companyName ? (
              <p className="mt-1 text-xs text-red-300">{fieldErrors.companyName}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">Website</label>
            <input
              type="url"
              value={values.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://example.com"
              className={fieldClass(Boolean(fieldErrors.website))}
              disabled={saving}
            />
            {fieldErrors.website ? (
              <p className="mt-1 text-xs text-red-300">{fieldErrors.website}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">Sector</label>
            <select
              value={values.sector}
              onChange={(e) => updateField("sector", e.target.value)}
              className={fieldClass(false)}
              disabled={saving}
            >
              <option value="">Select sector (optional)</option>
              {CLIENT_INDUSTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">Contact Name</label>
            <input
              type="text"
              value={values.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
              className={fieldClass(false)}
              autoComplete="name"
              disabled={saving}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">Contact Position</label>
            <input
              type="text"
              value={values.contactPosition}
              onChange={(e) => updateField("contactPosition", e.target.value)}
              className={fieldClass(false)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/70">Email Address</label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={fieldClass(Boolean(fieldErrors.email))}
              autoComplete="email"
              disabled={saving}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.05] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-400/35 bg-violet-500/25 px-4 py-2.5 text-sm font-semibold text-violet-50 hover:bg-violet-500/35 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save Target Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
