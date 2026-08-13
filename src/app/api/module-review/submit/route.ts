import { appendFile, access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSV_FILENAME = "modulereviewarjan.csv";
const CSV_HEADER = "submitted_at,module,item\n";

type SubmitBody = {
  selected?: Array<{ module?: string; item?: string; key?: string }>;
};

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function desktopFilePath() {
  const desktopDir =
    process.env.MODULE_REVIEW_DESKTOP_DIR?.trim() ||
    (process.platform === "win32" ? "C:/Users/Usuario/Desktop" : "");
  if (!desktopDir) return null;
  return path.join(desktopDir, CSV_FILENAME);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function buildCsvRows(selected: SubmitBody["selected"]) {
  const timestamp = new Date().toISOString();
  const entries = Array.isArray(selected) ? selected : [];
  const rows: string[] = [];

  if (entries.length === 0) {
    rows.push([escapeCsv(timestamp), escapeCsv("(none selected)"), ""].join(","));
  } else {
    for (const entry of entries) {
      const moduleName = entry.module?.trim() || "";
      const itemName = entry.item?.trim() || "";
      rows.push([escapeCsv(timestamp), escapeCsv(moduleName), escapeCsv(itemName)].join(","));
    }
  }

  return { rows, count: entries.length };
}

async function trySaveToDesktop(rows: string[]) {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return null;

  const desktopFile = desktopFilePath();
  if (!desktopFile) return null;

  try {
    const desktopDir = path.dirname(desktopFile);
    await access(desktopDir, constants.W_OK);

    const exists = await fileExists(desktopFile);
    if (!exists) {
      await writeFile(desktopFile, CSV_HEADER, "utf8");
    }

    await appendFile(desktopFile, `${rows.join("\n")}\n`, "utf8");
    return desktopFile;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody;
    const { rows, count } = buildCsvRows(body.selected);

    const desktopPath = await trySaveToDesktop(rows);
    if (desktopPath) {
      return NextResponse.json({
        ok: true,
        mode: "desktop",
        path: desktopPath,
        count,
      });
    }

    const csv = `${CSV_HEADER}${rows.join("\n")}\n`;
    return NextResponse.json({
      ok: true,
      mode: "download",
      filename: CSV_FILENAME,
      csv,
      count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save module review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
