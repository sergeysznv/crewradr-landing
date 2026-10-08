# Releasing the landing site

Merging a pull request into `main` deploys to production via Cloudflare Pages
(project `crewradr-landing`). Full process, rules and rollback: see
`docs/release_process.md` in the `crewradr` repo.

- Branch -> PR (Conventional Commit title) -> CI green -> squash-merge.
- Bump `package.json` `version` in the PR that should count as a new release; a merge
  with a new version is tagged `release-X.Y.Z` automatically.
- Verify a deploy: `curl https://crewradr.app/version.json` -> `sha` equals the merge
  commit, `version` equals `package.json`.
- The share-link function (`functions/share`) needs the `SUPABASE_ANON_KEY` and
  `SUPABASE_URL` variables set in the Cloudflare Pages project; it never uses the
  service-role key.
