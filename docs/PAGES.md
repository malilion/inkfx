# Public gallery, private repository

Repository visibility and Pages site visibility are independent. Keep `malilion/inkfx` private. The approved public gallery serves the browser JavaScript, standalone effects, docs, and examples to any visitor. The site artifact excludes Node tooling, tests, Git history, and repository configuration.

## Enable and deploy

1. In repository **Settings → General**, confirm the repository is private. Do not change it to public to work around a Pages plan restriction.
2. In **Settings → Pages**, choose **GitHub Actions** as the build source. Enable a public Pages site if a site-visibility setting is offered. GitHub Pages from a private repository requires an eligible paid plan. If the account reports a plan restriction, resolve that restriction with the owner; a workflow cannot bypass it.
3. Push to `main` or run the **Pages** workflow manually. The workflow verifies the repository is private and the site is public, installs the pinned development bundler, stages the browser assets and standalone modules, and deploys the artifact. The workflow token was denied permission to change site visibility (403). Configure approved public access in repository settings before deploying.
4. Check the workflow's deployment URL. The expected default is `https://malilion.github.io/inkfx/`; use the returned URL if it differs.

## Verify access

With GitHub API access, inspect metadata without printing credentials:

```sh
gh api repos/malilion/inkfx --jq '{private,visibility,has_pages}'
gh api repos/malilion/inkfx/pages --jq '{status,html_url,public,build_type}'
gh run list --workflow pages.yml --limit 3
```

The repository must report `private: true`; the intended site is public and `build_type` should be `workflow`. Check the exact deployed commit, not merely an older successful run. From a logged-out browser, open the root and gallery, play an effect, change palettes, copy JS, and download PNG/JSON. Also verify requests for `/inkfx/gallery/gallery.js` and `/inkfx/src/index.js` return JavaScript rather than a login or error page. A successful Actions run alone does not establish public access.

## Network and permissions

The latest GitHub API reads returned repository and Pages settings. Earlier cloud runs encountered network and token restrictions, and the workflow token's attempt to update visibility returned HTTP 403. Verify the site visibility in repository settings and use the read-only checks above to confirm it.

## Latest verified deployment status

The [Pages diagnostic run](https://github.com/malilion/inkfx/actions/runs/42328185754) reached site configuration but failed to change visibility with `Resource not accessible by integration`. No browser assets were uploaded by that run. The public URL returned HTTP 404 on 2026-11-07. The repository API reports `private: true`, `visibility: private`, and `has_pages: true`. An earlier successful deployment does not establish public reachability.

The earlier [Pages workflow run](https://github.com/malilion/inkfx/actions/runs/42342978626) stopped at the public visibility check. After approval, the Pages API returned `public: true` with `build_type: workflow` and the repository API still reported `private: true`. Use the checks above for the current deployment.
