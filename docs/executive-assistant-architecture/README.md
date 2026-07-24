# AI Executive Assistant — Architecture Pack

Deliverables for senior architect handoff (analysis only; application code unchanged).

| Artifact | Path |
| --- | --- |
| Markdown report | [`Architecture_Report.md`](./Architecture_Report.md) (also copied to repo root) |
| PDF report | [`Architecture_Report.pdf`](./Architecture_Report.pdf) (also copied to repo root) |
| Mermaid diagrams | [`diagrams/`](./diagrams/) (also copied to repo root `diagrams/`) |

Regenerate Markdown:

```bash
node docs/executive-assistant-architecture/_generate-report.mjs
```

Regenerate PDF:

```bash
npx --yes md-to-pdf docs/executive-assistant-architecture/Architecture_Report.md --config-file docs/executive-assistant-architecture/md-to-pdf.config.json
```
