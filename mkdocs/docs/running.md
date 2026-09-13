# Running and building

Every command takes the same shape: the settings path on the left, the script on the right.

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn serve
```

The variable is read by `.env.<mode>`, which passes it on as `VITE_APP_CUSTOM_SETTINGS_PATH`, which
becomes the `confs` alias. Forget it and the build falls back to the application's own default
settings — it will run, but it will not be your site.

## Development

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn serve
```

Reads `.env.development` and starts Vite with hot reload. Editing a configuration file or a custom
component in the settings repository refreshes the page like editing the application itself would.

## Staging

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn build:staging
```

Reads `.env.staging` and writes the static site to `dist/`.

## Production

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn build:prod
```

Reads `.env.production`, same output directory.

## Previewing a build

```bash
yarn preview                    # serves the production build
yarn preview --mode=staging     # serves the staging build
```

Serves `dist/` as a real web server would, which is the only way to check the base path, the router
in history mode and the asset URLs before deploying. The development server is more forgiving than
the real thing on all three.

## Linting

```bash
yarn lint        # reports
yarn lint:fix    # reports and fixes what it can
```

## Serving several sites from one checkout

Nothing in the application ties a build to a particular deployment, so the same checkout produces as
many sites as there are settings repositories:

```bash
CUSTOM_SETTINGS_PATH=../settings-corpus-a yarn build:prod && mv dist dist-a
CUSTOM_SETTINGS_PATH=../settings-corpus-b yarn build:prod && mv dist dist-b
```

Each build is self-contained. This is also the quickest way to check that a change to the application
has not broken another deployment: build it against both settings repositories and compare.

!!! warning "`dist/` is overwritten, not merged"
    Each build empties the output directory first. Move or rename it between builds.
