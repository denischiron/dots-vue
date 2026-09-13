# DoTS-vue

**DoTS-vue** is the reading front-end of the [DoTS suite](suite.md): a single-page application that
turns a [DoTS](https://github.com/dots-suite/dots) endpoint into a publication site for TEI editions
— collections to browse, documents to read, metadata to inspect, facsimiles to look at, and a search
page when the corpus has been indexed.

It is deliberately small. The application holds no editorial choice of its own: what a site looks
like, what it calls things, which metadata it shows, how its documents are cut up and rendered, all
of it comes from a **settings repository** kept outside the code and plugged in at build time. One
codebase therefore serves many sites, and no site inherits another's decisions.

!!! tip "SEE IT RUNNING"
    The [DoTS Cookbook](https://dots.chartes.psl.eu/cookbook/) is a DoTS-vue deployment. Its settings
    are public — [dots-vue-demo-settings](https://github.com/dots-suite/dots-vue-demo-settings) — and
    documented on their [own site](https://dots-suite.github.io/dots-vue-demo-settings/).

## Where it sits

The components of the suite are **independent of one another**, and each is a separate deployment
decision. DoTS-vue plugs straight into a DoTS endpoint: that single connection is all it requires.

ThunderDots, dots-cli-es and its search API form a **branch a corpus may never take**. Skip it and
the site still browses the collections, reads the documents, shows the metadata and displays the
facsimiles — it simply has no search page, and says so rather than failing.

```
       TEI corpus
            │
            ▼
    ┌───────────────┐
    │     DoTS      │   DTS API: collections, resources, navigation, documents
    └───────┬───────┘
            │
            ├───────────────────────────────┐
            │                               │
            │  optional: indexing           │  DTS over HTTP
            ▼                               │  (always)
    ┌───────────────┐                       │
    │  ThunderDots  │                       │
    └───────┬───────┘                       │
            ▼                               │
    ┌───────────────┐                       │
    │  dots-cli-es  │                       │
    └───────┬───────┘                       │
            ▼                               │
    ┌───────────────┐                       │
    │    dots-api   │                       │
    └───────┬───────┘                       │
            │  only for the search page     │
            └───────────────┬───────────────┘
                            ▼
                    ┌───────────────┐
                    │   DoTS-vue    │   ← this project
                    └───────┬───────┘
                            │  static build
                            ▼
                     the published site
                            ▲
                            │  build-time alias `confs`
                 ┌──────────────────────┐
                 │  your-settings-repo  │
                 └──────────────────────┘
```

!!! info "Two shapes of deployment"
    **Reading only** — a DoTS endpoint, DoTS-vue, and a settings repository. Nothing to index,
    nothing to keep in sync, no Elasticsearch to run.

    **Reading and searching** — the same, plus a corpus indexed by `dots-es-cli` and a `dots-api`
    served next to it. Adding it later changes nothing on the reading side: a search endpoint in the
    environment and a route in the settings are enough.

Two services, then, and one repository:

| | Role | Required |
|---|---|---|
| **DoTS** endpoint | collections, navigation, documents, metadata | yes |
| **dots-api** search endpoint | the search page and, where available, the collection lists | no |
| **settings repository** | everything editorial | yes |

## Your collection website made easy

**A browsable corpus.** Collections are rendered as a table of contents, as a table, as cards or as a
mix, each collection choosing for itself. Sub-collections open in place, and the breadcrumb follows
the DTS tree however deep it goes. Cards are the mode for moving **between projects**, so a
deployment serving a single corpus browses with the other three — see
[Configuration](configuration.md#vite_app_document_route_include_project_id).

**A reader.** A document arrives from the endpoint either as TEI or as HTML, and is laid out in three
parts — the navigation, the text, the apparatus — each of which a deployment can style or replace.
See [Reading a document](documents.md).

**A facsimile viewer.** When a resource carries a IIIF manifest, [Mirador](https://projectmirador.org/)
is embedded beside the text, and the page breaks of the transcription drive it: turning to a page in
the text turns the image.

**Metadata on demand.** The metadata panel is built from the JSON-LD the endpoint returns, expanded
against the declared namespaces, then filtered, ordered and relabelled by the settings.

**A search page**, if the collection has been indexed by [dots-cli-es](https://dots-suite.github.io/dots-cli-es/)
and declares it in its settings: full text, facets, temporal sliders, and a results table whose
columns the settings choose.

**A theme.** Colours, fonts, logos, favicon and the whole TEI stylesheet are settings, not code, and
a deployment can add its own CSS on top. See [Theme and styling](styling.md).

## Getting started

1. [Install](installation.md) the application and its dependencies.
2. [Configure](configuration.md) the endpoints it talks to.
3. [Run or build](running.md) it against a settings repository.
4. [Deploy](deployment.md) the static output.

To write the settings themselves, follow the
[DoTS-vue settings documentation](https://dots-suite.github.io/dots-vue-demo-settings/) — this site
documents the application, that one documents what you feed it.
