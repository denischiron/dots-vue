# Installation

DoTS-vue is a [Vue 3](https://vuejs.org/) application built with [Vite](https://vite.dev/). Installing
it means cloning two repositories side by side — the application, and the settings it will serve.

## Requirements

| | |
|---|---|
| **Node.js** | 22 or 24 — the lines the CI builds against |
| **Yarn** | any recent version |
| **A DoTS endpoint** | reachable over HTTP, see [The DoTS suite](suite.md) |
| **A search endpoint** | optional, only for the search page |

No database, no server-side runtime: the build produces static files.

## Laying out the folders

The settings repository is referenced by a **relative path** at build time, so the two repositories
are expected to sit next to each other:

```
projects/
├── dots-vue/                     # this repository
└── dots-vue-my-settings/         # the settings of one deployment
    ├── custom.conf.json
    ├── <collection>.conf.json
    └── …
```

Any layout works as long as the path resolves, but keeping them siblings makes
`CUSTOM_SETTINGS_PATH=../dots-vue-my-settings` the only thing anyone has to remember.

!!! info "Starting from the demo settings"
    Cloning [dots-vue-demo-settings](https://github.com/dots-suite/dots-vue-demo-settings) as the
    second folder gives a working deployment immediately, and a reference to copy from. Its
    [documentation](https://dots-suite.github.io/dots-vue-demo-settings/) walks through creating your
    own.

## Installing

```bash
git clone https://github.com/dots-suite/dots-vue.git
cd dots-vue
yarn
```

That is the whole installation. The next step is to tell the application which endpoints it talks
to: see [Configuration](configuration.md).

## Without a settings repository

`CUSTOM_SETTINGS_PATH` may be left unset. The application then falls back to its own
`src/settings/default.conf.json` and renders a generic site — useful to check that an endpoint
answers, but not what you would publish. Everything that makes a deployment recognisable comes from
the settings.
