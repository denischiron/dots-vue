# The DoTS suite

DoTS-vue is one component among several, each doing one thing and talking to the others over HTTP.
This page says what the others are, what they contribute, and where their documentation lives.

## DoTS — the endpoint

[github.com/dots-suite/dots](https://github.com/dots-suite/dots)

The publication server. It exposes a corpus through the
[DTS API](https://distributed-text-services.github.io/specifications/) — collections, navigation,
documents, metadata — and is the only service DoTS-vue cannot do without. Everything the reader sees
when browsing and reading comes from it.

DoTS serves a document in whichever media types the deployment has configured on the endpoint, and
DoTS-vue asks for one of them per collection; see [Reading a document](documents.md).

## ThunderDots — the crawler

[github.com/dots-suite/ThunderDots](https://github.com/dots-suite/ThunderDots) ·
[documentation](https://dots-suite.github.io/ThunderDots/)

A Python client that walks a DTS tree and brings back the whole corpus graph: collections, resources,
their fragments and their normalised metadata. DoTS-vue never calls it — it is the engine of the
indexing step, used in-process as a library rather than as a producer of files.

## dots-cli-es — indexing and search

[github.com/dots-suite/dots-cli-es](https://github.com/dots-suite/dots-cli-es) ·
[documentation](https://dots-suite.github.io/dots-cli-es/)

Two console scripts around Elasticsearch:

- **`dots-es-cli`** indexes a corpus, resource by resource and passage by passage;
- **`dots-api`** serves `GET /api/1.0/search` on top of that index.

This is what turns a readable corpus into a searchable one. DoTS-vue points at `dots-api` through
`VITE_APP_ELASTICSEARCH_URL` and uses it for the search page — and, when a collection is indexed,
to source its list view in one request instead of walking the DTS tree.

A collection that has never been indexed simply has no search page: the front-end checks, and says
so rather than returning nothing.

## The settings repository — the editorial layer

[dots-vue-demo-settings](https://github.com/dots-suite/dots-vue-demo-settings) ·
[documentation](https://dots-suite.github.io/dots-vue-demo-settings/)

Not a service but a repository, plugged into the build through the `confs` alias. It holds one
configuration file per collection, the custom components a deployment writes, its stylesheets, its
images and its favicon. It is where every editorial decision lives.

The demo repository above is the worked example used throughout its documentation, and it is the
one behind the Cookbook.

## The Cookbook — a deployment to look at

[dots.chartes.psl.eu/cookbook](https://dots.chartes.psl.eu/cookbook/)

A DoTS-vue site whose settings are public. It serves several unrelated projects from one deployment
— a thesis abstract collection, a theatre corpus — each with its own home page, metadata panel and,
for one of them, a search page. Reading its settings alongside the site is the shortest way to see
how a configuration choice turns into something on screen.

## How they depend on one another

```
    dots           ──► source of your DoTS-vue website
    ThunderDots    ──► used by dots-cli-es only, never by DoTS-vue
    dots-cli-es    ──► optional, and only for the search page
    settings repo  ──► required by DoTS-vue at build time
```

They are independent pieces, not a stack to install as a whole. Each can live on its own host, and a
deployment may run only the two it needs — DoTS-vue reaches at most two URLs, both configurable, and
its build output is static files.
