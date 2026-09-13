# Configuration

Everything the application needs to know about its environment lives in three `.env` files at the
root of the repository, one per build mode. Everything editorial lives elsewhere, in the
[settings repository](https://dots-suite.github.io/dots-vue-demo-settings/).

| File | Read by |
|---|---|
| `.env.development` | `yarn serve` |
| `.env.staging` | `yarn build:staging`, `yarn preview --mode=staging` |
| `.env.production` | `yarn build:prod`, `yarn preview` |

All variables are prefixed `VITE_APP_`, which is what makes Vite expose them to the client bundle.

## The variables

### `VITE_APP_DTS_ENDPOINT_URL`

The DoTS endpoint, up to and including the DTS base path.

```
VITE_APP_DTS_ENDPOINT_URL=https://dev.chartes.psl.eu/dots/api/dts
```

Every collection, document, navigation and metadata request is built on top of it. It is the one
variable without which nothing renders.

### `VITE_APP_ROOT_DTS_COLLECTION_ID`

The identifier of the collection that acts as the site's root. Leave it empty to use the endpoint's
own root collection, which is what a deployment serving a whole DoTS instance wants.

Setting it scopes the deployment to one branch of the corpus: the home page, the breadcrumb and the
project resolution all stop there.

!!! warning "Collection identifiers are case-sensitive"
    They are matched against the endpoint as written. A settings file named `encpos.conf.json` can
    perfectly well describe a collection whose DTS identifier is `ENCPOS` — the settings lookup is
    case-insensitive — but the URL a reader visits, and this variable, must use the endpoint's
    spelling.

### `VITE_APP_APP_ROOT_URL`

The base path the site is served from, which becomes the router's base and the prefix of every
generated link.

```
VITE_APP_APP_ROOT_URL=/            # served at the root of a domain
VITE_APP_APP_ROOT_URL=/cookbook    # served in a sub-directory
```

It must match what the web server actually serves; see [Deployment](deployment.md).

### `VITE_APP_DOCUMENT_ROUTE_INCLUDE_PROJECT_ID`

Whether a document URL carries the identifier of its project.

```
VITE_APP_DOCUMENT_ROUTE_INCLUDE_PROJECT_ID=true    # /ENCPOS/document/ENCPOS_1972_18
VITE_APP_DOCUMENT_ROUTE_INCLUDE_PROJECT_ID=false   # /document/ENCPOS_1972_18
```

`true` is what a deployment serving several unrelated projects wants: the routes stay unambiguous
and each project keeps its own home page. `false` suits a deployment dedicated to a single corpus.

This also changes the shape of the other routes — with the project id included, the home page is
`/:collId?` and custom pages are `/:collId/:customPage`.

!!! info "`card` is the multi-project display mode"
    By design, a card stands for a **project** and leads to that project's home page. The two
    settings therefore go together: with the project id in the routes, cards navigate; without it
    there are no per-project home pages, and the application renders the cards inert rather than
    pointing them at the root.

    A single-project deployment uses `toc`, `list` or `mixed` on its root collection — the modes that
    navigate inside the tree rather than across projects. Display modes are set per collection in
    the settings, and are documented in the
    [settings reference](https://dots-suite.github.io/dots-vue-demo-settings/reference/).

### `VITE_APP_CUSTOM_SETTINGS_PATH`

The path to the settings repository, resolved at build time into the `confs` alias. It is written to
read an environment variable rather than a literal:

```
VITE_APP_CUSTOM_SETTINGS_PATH=${CUSTOM_SETTINGS_PATH}
```

so that the path stays out of the repository and is given on the command line instead:

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn serve
```

Everything the settings hold — configuration files, custom components, stylesheets, images — is
resolved through this alias.

### `VITE_APP_ELASTICSEARCH_URL`

The `dots-api` search endpoint, up to and including its version path.

```
VITE_APP_ELASTICSEARCH_URL=https://dev.chartes.psl.eu/dots_search/api/1.0
```

Optional. Without it there is no search page, and collection lists fall back to walking the DTS tree.

### `VITE_APP_SEARCH_RESULT_PER_PAGE`

How many results a search page holds.

```
VITE_APP_SEARCH_RESULT_PER_PAGE=25
```

The value feeds the search store, which is the single source for both the query sent to the API and
the page count displayed, so the two can never disagree. It is capped at **200** on both sides,
whatever is written here.

## Validation stops the build

The variables are declared as a [zod](https://zod.dev/) schema in `src/schema.js`, and `vite.config.js`
checks the loaded `.env` against it **before doing anything else**. A missing or malformed value
prints a report naming the file and the offending keys, and exits:

```
Errors are found in .env.production file:

✖ Invalid URL, must be a valid URL
  → at VITE_APP_DTS_ENDPOINT_URL
```

Nothing is built and nothing is served, so a deployment cannot start with a half-valid environment.
The schema is strict: an unexpected `VITE_APP_*` key is an error too, which catches a typo in a
variable name instead of ignoring it.

## What is *not* configured here

Labels, colours, logos, metadata selection, home page layout, about pages, search facets, document
rendering: none of it belongs in `.env`. All of it lives in the settings repository and is documented
on its [own site](https://dots-suite.github.io/dots-vue-demo-settings/).
