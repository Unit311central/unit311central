export async function downloadExcelWorkbook(
  filename: string,
  sheets: { name: string; rows: Record<string, string | number>[] }[],
): Promise<void> {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    const keys = Object.keys(sheet.rows[0] ?? {});
    worksheet["!cols"] = keys.map((key) => ({
      wch: key.startsWith("Question 5") ? 72 : Math.min(40, Math.max(16, key.length + 2)),
    }));
    XLSX.utils.book_append_sheet(book, worksheet, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(book, filename);
}
