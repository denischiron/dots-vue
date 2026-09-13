# dots-vue

Frontend application to browse a DoTS endpoint ([DoTS](https://github.com/dots-suite/dots)).

>:warning: Install / Launch first the DTS API (or ensure to point to deployed service):  
> See the [API Readme](https://github.com/dots-suite/dots)

**Master dependencies**:

[![Node](https://img.shields.io/badge/node-22_to_24-blue?style=for-the-badge&logo=Node.js)](https://nodejs.org)

[![package - vue](https://img.shields.io/github/package-json/dependency-version/dots-suite/dots-vue/vue/dev?logo=vue.js&logoColor=white)](https://www.npmjs.com/package/vue)
[![package - vite](https://img.shields.io/github/package-json/dependency-version/dots-suite/dots-vue/dev/vite/dev?logo=vite&logoColor=white)](https://www.npmjs.com/package/vite)
[![package - eslint](https://img.shields.io/github/package-json/dependency-version/dots-suite/dots-vue/dev/eslint/dev?logo=eslint&logoColor=white)](https://www.npmjs.com/package/eslint)


[![package - Bulma](https://img.shields.io/github/package-json/dependency-version/dots-suite/dots-vue/bulma/dev?logo=bulma&logoColor=white)](https://www.npmjs.com/package/bulma)
[![package - Mirador](https://img.shields.io/github/package-json/dependency-version/dots-suite/dots-vue/mirador/dev)](https://www.npmjs.com/package/mirador)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.md)

## Documentation

The documentation site (MkDocs Material) lives in [`mkdocs/`](./mkdocs/) and is published to GitHub
Pages by [`.github/workflows/docs.yml`](./.github/workflows/docs.yml) on every push to `dev`. Pushes
to `master` build the site as a check, without publishing it.

📖 **https://dots-suite.github.io/dots-vue/**

It covers installing, configuring, building and deploying the application, and situates it within the
DoTS suite. To write the settings a deployment runs on, see
[dots-vue-demo-settings](https://dots-suite.github.io/dots-vue-demo-settings/).

Everyday commands:

```bash
make docs.install    # install the toolchain (once)
make docs.serve      # live-reload server on http://127.0.0.1:8000
make docs.build      # build in strict mode — exactly what the CI runs
```

## Project setup
### Clone the GitHub repository:  
in a local folder dedicated to the project
  ```bash
  git clone https://github.com/dots-suite/dots-vue.git
  ```

From the app folder (`cd path/to/dots-vue`)
### Install
```
yarn
```

### Compiles and hot-reloads for development

>:warning: if collections'settings have been defined, a relative path `CUSTOM_SETTINGS_PATH` environment variable has to be set as below :
```
projects_folder/					# Folder where your apps are deployed
	dots-vue/						# This cloned project
	dots-vue-my-custom-settings/	# OPTIONAL. Configuration files for a given deployed dots-vue
		configurations_files    	# See an example at [dots-vue-demo-settings](https://github.com/dots-suite/dots-vue-demo-settings)
```
> in this case CUSTOM_SETTINGS_PATH=../dots-vue-my-custom-settings

For a local development server, reads `.env.development` variables:
```
(CUSTOM_SETTINGS_PATH=../relative/path/to/custom/settings/folder) yarn serve
```

### Compiles and minifies for staging

For a staging server (preproduction), reads `.env.staging` variables:

```
(CUSTOM_SETTINGS_PATH=../relative/path/to/custom/settings/folder) yarn build:staging
```

### Compiles and minifies for production

For a production server, reads `.env.production` variables:

```
(CUSTOM_SETTINGS_PATH=../relative/path/to/custom/settings/folder) yarn build:prod
```

### Run preview server

After a `yarn build:prod` or `yarn build:staging` you can run a server to serve the produced `dist` folder with:

```
yarn preview
```

for production or

```
yarn preview --mode=staging
```

for staging.


### Lints and fixes files
```
yarn lint
```

---

## License

dots-vue is distributed under the [MIT License](./LICENSE.md).

## Citation

If you use dots-vue in academic work, please cite it as:

```
@software{boby_dots_vue_2026,
  author       = {Boby, Jean-Victor},
  title        = {dots-vue},
  year         = {2026},
  publisher    = {GitHub},
  institution  = {{École nationale des chartes}},
  url          = {https://github.com/dots-suite/dots-vue},
  note         = {Vue 3 front-end to browse and search TEI corpora published with DoTS}
}
```

You can also use the repository metadata from [CITATION.cff](./CITATION.cff).

