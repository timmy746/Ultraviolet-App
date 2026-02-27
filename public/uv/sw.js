// This is a lightweight wrapper service worker copied from the Ultraviolet
// package.  It allows sites that don't serve the vendor static files to still
// register a service worker without modification.  The real implementation is
// imported from the path configured by `__uv$config.sw` (usually
// "/uv/uv.sw.js").

/*global UVServiceWorker,__uv$config*/

/*
 * Stock service worker script.
 * Users can provide their own sw.js if they need to extend the functionality of
 * the service worker.  Ideally, this will be registered under the scope in
 * uv.config.js so it will not need to be modified.  However, if a user changes
 * the location of uv.bundle.js/uv.config.js or sw.js is not relative to them,
 * they will need to modify this script locally.
 */

importScripts("uv.bundle.js");
importScripts("uv.config.js");
importScripts(__uv$config.sw || "uv.sw.js");

const uv = new UVServiceWorker();

async function handleRequest(event) {
    if (uv.route(event)) {
        return await uv.fetch(event);
    }
    return await fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
