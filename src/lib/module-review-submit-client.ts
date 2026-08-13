type ModuleReviewSubmitPayload = {
  mode?: string;
  csv?: string;
  filename?: string;
};

export function finishModuleReviewSubmit(payload: ModuleReviewSubmitPayload): string {
  if (payload.mode === "download" && payload.csv) {
    const blob = new Blob([payload.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = payload.filename ?? "modulereviewarjan.csv";
    link.click();
    URL.revokeObjectURL(url);
    return "Selections saved — modulereviewarjan.csv downloaded.";
  }

  return "Saved to modulereviewarjan.csv on your desktop.";
}
