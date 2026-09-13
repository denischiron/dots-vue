# Theme and styling

The application ships a complete look, and expects to be overruled. Nothing in it needs editing for
a deployment to look like itself: a settings repository adds one stylesheet, overrides a handful of
CSS variables, and drops in its logos.

## What the application brings

The application carries its own stylesheets: the shell — navbar, footer, cards, tables, buttons,
layout — and the rendering of documents, whether they arrive as TEI or as HTML. Together they are the
reading experience a deployment inherits without writing a line.

Their internal organisation is the application's business and is being reworked; a deployment should
not depend on it. What follows is the stable surface: one stylesheet of your own, and the variables
it overrides.

## One stylesheet per deployment

A collection names a stylesheet in its configuration:

```json
"collectionCustomCss": "dots_cookbook"
```

which is resolved in the settings repository as
`<name>/assets/css/<name>.customCss.css`, loaded on demand and injected into the page. The name
points at a file, not at the current collection, so several collections can share one livery — and a
deployment can give one project its own without touching the others.

!!! tip "The three-part template"
    The demo settings organise every custom stylesheet the same way — colours first, application
    elements second, document markup third. It is a convention worth keeping, and it is described in
    [Styling and assets](https://dots-suite.github.io/dots-vue-demo-settings/styling/).

## Recolouring by variable

The application reads its colours, fonts and metrics from CSS custom properties declared at the root,
so a deployment recolours by redeclaring a handful rather than by restating rules:

```css
:root {
  --fill-color: #8f0e21;
}
```

`--fill-color` alone changes buttons, active states and accents together. Three families are exposed
this way — colours, typography and metrics — and the stylesheets of the
[demo settings](https://github.com/dots-suite/dots-vue-demo-settings) show which ones a deployment
usually touches.

Some are redeclared inside media queries for narrow screens, so overriding the base value keeps the
responsive behaviour rather than defeating it.

## Logos, images and favicon

Logos, collection images, banners and the favicon are files in the settings repository, referenced by
name in the configuration. The favicon is applied at runtime from the merged settings, so a
deployment serving several projects can show a different one per project.

Images referenced by a custom component are resolved through the `confs` alias like everything else,
which means they are versioned with the settings, not with the application.

Details and file naming: [Styling and assets](https://dots-suite.github.io/dots-vue-demo-settings/styling/).

## Where the boundary lies

Styling a deployment should never require a change here. If something cannot be reached from a
custom stylesheet or a setting, that is a gap in the application worth
[reporting](https://github.com/dots-suite/dots-vue/issues) rather than a reason to fork it.
