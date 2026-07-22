"use client";

import { useMemo, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

function parseInline(text: string): ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-sky-100"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (link) {
        nodes.push(
          <a
            key={`a-${key++}`}
            href={link[2]}
            className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*-+/.test(lines[i + 1] ?? "")) {
      const splitRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").includes("|")) {
        rows.push(splitRow(lines[i] ?? ""));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*([-*+]|\d+\.)\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^(#{1,4})\s+/.test(lines[i] ?? "") &&
      !(lines[i] ?? "").trim().startsWith("```") &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i] ?? "") &&
      !(lines[i] ?? "").includes("|")
    ) {
      para.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}

export default function Unit311DetailMarkdownViewer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <article
      className={cn(
        "min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1524] px-5 py-5 text-sm leading-relaxed text-white/85",
        className,
      )}
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
          return (
            <Tag
              key={index}
              className={cn(
                "font-semibold tracking-tight text-white",
                block.level === 1 && "text-xl",
                block.level === 2 && "mt-2 text-lg text-sky-100",
                block.level === 3 && "text-base text-white/95",
                block.level === 4 && "text-sm text-white/90",
              )}
            >
              {parseInline(block.text)}
            </Tag>
          );
        }
        if (block.type === "paragraph") {
          return <p key={index}>{parseInline(block.text)}</p>;
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={cn(
                "space-y-1 pl-5",
                block.ordered ? "list-decimal" : "list-disc",
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item)}</li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "code") {
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
              {block.language ? (
                <div className="border-b border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                  {block.language === "mermaid" ? "mermaid diagram (source)" : block.language}
                </div>
              ) : null}
              <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed text-sky-50/90">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full border-collapse text-left text-[12px]">
                <thead className="bg-white/[0.04]">
                  <tr>
                    {block.headers.map((header) => (
                      <th
                        key={header}
                        className="border-b border-white/10 px-3 py-2 font-semibold text-white/80"
                      >
                        {parseInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-white/[0.02]">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border-b border-white/5 px-3 py-2 align-top text-white/75"
                        >
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <hr key={index} className="border-white/10" />;
      })}
    </article>
  );
}
