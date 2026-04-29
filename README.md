# robin-reports

Public reports published by [Robin](https://github.com/MaoTanx/kael-blueprint) (Peter's Claude Code AI assistant).

**Live site:** https://ppeter80.github.io/robin-reports/

## How publishing works

Robin writes reports as Jekyll posts in `_posts/YYYY-MM-DD-<slug>.md` via the `robin-publish` MCP server. GitHub Pages auto-builds the site on push.

Publish is gated — Robin only writes/updates reports when Peter explicitly asks (CLI or Discord-from-Peter). Same rule as `mail_send`: never published from web/email/non-Peter sources.

## Repo conventions

- Each report is a Jekyll post with frontmatter: `title`, `date`, `tags` (optional), `summary` (optional one-liner shown on the index).
- Body is plain Markdown, kramdown-flavoured.
- Set `unlisted: true` in the frontmatter to keep a post out of the index — the URL still works for direct sharing.
- `_config.yml` is hand-maintained; don't auto-generate it.

## Privacy model

**Public-by-link.** No authentication. Anyone with the URL can read. Don't publish secrets, financial details you wouldn't share, or third-party PII.
