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

## Encrypted share viewer

Deploy order across repos (details in `docs/release_process.md` in the `crewradr` repo):

1. `supabase db push --linked` (migration `20261011000200_encrypted_location_shares.sql`).
2. `supabase functions deploy dispatch-crew-alert` and `supabase functions deploy api_gateway`.
3. Merge this repo's PR (the viewer). Until then new encrypted links show nothing useful.
4. Ship the app build last.

Notes:

- `/assets/share-viewer-core.js` is a static file and must be served same-origin; the
  viewer page depends on it.
- Tests: `npm test` (runs `node --test test/*.test.mjs`).
- Rollback: the viewer still renders legacy plaintext shares. Encrypted shares created
  before a revert will not render in an old viewer.
- `share-redirect-worker.js` is an older duplicate of the viewer, believed not to be
  deployed. Confirm in the Cloudflare dashboard / `wrangler`, then remove it (and the
  `package.json` `main` entry) in a separate PR.
