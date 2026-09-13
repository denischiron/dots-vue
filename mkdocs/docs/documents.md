# Reading a document

The document page is where a deployment spends most of its reader's attention, and where most of its
configurable behaviour shows. This page describes what the application does with a resource; what a
deployment can decide is documented in the
[settings reference](https://dots-suite.github.io/dots-vue-demo-settings/reference/).

## Asking the endpoint for a shape

A resource is fetched from `GET /document`, and the media type asked for is a setting, not a
constant: a collection declares the one its endpoint serves best.

| Media type | What arrives | Typical use |
|---|---|---|
| `tei` | the TEI markup itself | the publisher's own encoding is styled in the browser |
| `html` | HTML produced by the endpoint | the transformation is done server-side, once |

Both go through the same layout and the same stylesheets; the difference is who performs the
transformation. TEI keeps the encoding visible and lets a deployment restyle any element down to a
`<speaker>` or a `<stage>`; HTML costs the browser nothing and suits corpora whose transformation is
already settled.

!!! info "Whatever the endpoint offers"
    The media types available are those the DoTS deployment exposes, so a collection can only ask
    for what its endpoint serves. Check the `mediaTypes` a DTS resource declares before setting one.

## Cutting the text up

DTS describes a resource as a **citation tree**: a hierarchy of addressable passages. The application
uses it twice.

To **navigate**: the tree becomes the table of contents, shown above the text and in the left-hand
panel, and each of its nodes is a real URL — a reader can link to a chapter or a paragraph, not only
to a document.

To **load only what is needed**: rather than pulling a whole edition at once, the page requests the
fragment the reader asked for, and its descendants. Deep, heavily encoded documents open in the same
time as shallow ones.

A collection decides how deep the tree is browsable and which level is the unit of reading, which is
what lets one corpus be read chapter by chapter and another page by page.

## The page

```
    ┌────────────────────────────────────────────────────────┐
    │  breadcrumb: root › project › collection › resource     │
    ├──────────────┬─────────────────────────┬───────────────┤
    │  table of    │   the text              │   facsimile   │
    │  contents    │   (TEI or HTML)         │   (Mirador)   │
    │              │                         │               │
    │              │   notes in the margin   │               │
    └──────────────┴─────────────────────────┴───────────────┘
```

The three columns are not fixed: a reading-tools control switches between text only, images only and
both side by side, and the layout collapses to a single column on a narrow screen.

**The metadata panel** opens from the breadcrumb rather than taking room in the page. It is built
from the JSON-LD the endpoint returns, expanded against the namespaces the collection declares, then
filtered, ordered and relabelled by the settings — a corpus shows its own vocabulary, not the DTS
one.

**Notes** encoded in the text are lifted into the margin beside the passage they belong to, and fall
back into the flow when there is no room for a margin.

## Facsimiles

When a resource carries a IIIF manifest, [Mirador](https://projectmirador.org/) is embedded in the
third column, and the two halves stay in step: the page breaks of the transcription drive the viewer,
so scrolling the text turns the image.

The manifest is read from the resource's metadata, which means a deployment adds facsimiles by
encoding them in its corpus, not by configuring the front-end.

## Custom pages

A collection may declare **custom routes** pointing at components it ships itself, for anything the
application does not know about: an introduction, an editorial note, a bespoke index. The search page
is one of these routes, which is why a collection without it simply has no search.

```json
"customRoutes": [
  { "name": "Search", "path": "search", "compName": "SearchPage" }
]
```

See [Collection pages](https://dots-suite.github.io/dots-vue-demo-settings/pages/) in the settings
documentation.
