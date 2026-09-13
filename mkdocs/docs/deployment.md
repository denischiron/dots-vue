# Deployment

A build produces static files. There is no Node process to keep alive, no database, no session: a web
server and a directory are enough.

## What a build produces

```bash
CUSTOM_SETTINGS_PATH=../dots-vue-my-settings yarn build:prod
```

writes `dist/` — an `index.html`, hashed JavaScript and CSS bundles, and the assets pulled in from
the settings repository. Everything editorial has already been baked in at this point: the deployed
files carry the configuration of the settings repository that was passed on the command line.

!!! warning "A build belongs to one deployment"
    Two sites mean two builds. Copying `dist/` from one host to another carries the first site's
    settings, its endpoints and its base path with it.

## Serving it

The application uses the HTML5 history mode, so **every path must return `index.html`** and let the
router decide. A server that returns 404 for `/document/ENCPOS_1972_18` breaks every link that is not
the home page — and, worse, only breaks them on reload, which makes it easy to miss in testing.

=== "nginx"

    ```nginx
    server {
        listen 80;
        server_name example.org;
        root /var/www/dots-vue;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

=== "nginx, in a sub-directory"

    ```nginx
    location /cookbook/ {
        alias /var/www/dots-vue/;
        try_files $uri $uri/ /cookbook/index.html;
    }
    ```

    The build must have been made with `VITE_APP_APP_ROOT_URL=/cookbook`.

=== "Apache"

    ```apache
    <Directory /var/www/dots-vue>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    ```

## The base path

`VITE_APP_APP_ROOT_URL` is baked into the bundle: it becomes the router's base and the prefix of
every asset URL. It must match what the server actually serves, and changing it means rebuilding.

| Served at | Value |
|---|---|
| `https://example.org/` | `/` |
| `https://example.org/cookbook` | `/cookbook` |

`yarn preview` serves the build the way a real server would, and is the only reliable way to catch a
mismatch before deploying.

## Cross-origin

The browser calls the DTS endpoint and, where configured, the search endpoint **directly**. Both must
accept the site's origin:

```nginx
add_header Access-Control-Allow-Origin https://example.org always;
```

A deployment whose endpoints sit behind the same domain avoids the question entirely, and is worth
preferring when the infrastructure allows it.

## Caching

The bundles are content-hashed and can be cached indefinitely; `index.html` must not be, or readers
keep the previous build after an update.

```nginx
location ~* \.(js|css|woff2?|png|jpg|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location = /index.html {
    add_header Cache-Control "no-cache";
}
```

The application keeps its own in-memory cache of DTS responses while a reader browses. It is bounded,
lives in the page, and is emptied by any reload — it is not a substitute for, nor affected by, HTTP
caching.

## Updating a deployment

1. Pull the application, pull the settings.
2. Rebuild with the same `CUSTOM_SETTINGS_PATH` and the right mode.
3. Replace `dist/` on the server.

Check the `.env` files against [Configuration](configuration.md) when upgrading: a renamed variable
does not fail loudly at runtime, it falls back. The build itself does fail loudly — a missing or
malformed variable stops it before anything is written.
