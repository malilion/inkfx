# Public gallery, private repository

Repository visibility and Pages site visibility are independent. Keep `malilion/inkfx` private. The owner has authorized a public gallery: its runtime JavaScript and staged docs/examples will be downloadable by visitors. Tests, tools, git history, and configuration are not staged.

## Enable and deploy

1. In repository **Settings → General**, confirm the repository is private. Do not change it to public to work around a Pages plan restriction.
2. In **Settings → Pages**, choose **GitHub Actions** as the build source. Enable a public Pages site if a site-visibility setting is offered. GitHub Pages from a private repository requires an eligible paid plan. If the account reports a plan restriction, resolve that restriction with the owner; a workflow cannot bypass it.
3. Push to `main` or run the **Pages** workflow manually. The workflow first verifies the repository is private, reads Pages configuration, ensures the site is public through the Pages API, stages browser assets, uploads the artifact, and deploys it. It updates only the Pages site visibility, never repository visibility. It cannot enable a disabled Pages site with the workflow token; initial enablement requires repository settings.
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

This cloud task can read Git through the platform proxy. Initial GitHub API requests were denied by the cloud network policy; that does not prove the account token is invalid. The environment draft adds `api.github.com` and `malilion.github.io` for API and deployment verification. Save the environment changes to apply them before retrying. Never paste tokens into chat or put them in repository files.

If API access remains denied after the network policy is enforced, inspect the specific API response and available credential binding metadata. Pages settings may require repository administration rights. Do not request a new token merely because `gh auth status` cannot validate proxy-injected authentication.
