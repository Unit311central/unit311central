import { appendFile, access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DESKTOP_FILE = path.join(
  process.env.MODULE_REVIEW_DESKTOP_DIR?.trim() || "C:/Users/Usuario/Desktop",
  "modulereviewarjan.csv",
);

type SubmitBody = {
  selected?: Array<{ module?: string; item?: string; key?: string }>;
};

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody;
    const selected = Array.isArray(body.selected) ? body.selected : [];

    const timestamp = new Date().toISOString();
    const rows: string[] = [];

    if (selected.length === 0) {
      rows.push([escapeCsv(timestamp), escapeCsv("(none selected)"), ""].join(","));
    } else {
      for (const entry of selected) {
        const moduleName = entry.module?.trim() || "";
        const itemName = entry.item?.trim() || "";
        rows.push([escapeCsv(timestamp), escapeCsv(moduleName), escapeCsv(itemName)].join(","));
      }
    }

    const exists = await fileExists(DESKTOP_FILE);
    if (!exists) {
      await writeFile(DESKTOP_FILE, "submitted_at,module,item\n", "utf8");
    }

    await appendFile(DESKTOP_FILE, `${rows.join("\n")}\n`, "utf8");

    return NextResponse.json({
      ok: true,
      path: DESKTOP_FILE,
      count: selected.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save module review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
