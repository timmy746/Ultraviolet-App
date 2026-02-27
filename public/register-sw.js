"use strict";
/**
 * Distributed with Ultraviolet and compatible with most configurations.
 *
 * Earlier versions of this project hardcoded the registration path which
 * occasionally led to 404s when the underlying UV assets were served from a
 * different location.  The service worker that actually handles requests is
 * `sw.js` (a thin wrapper that imports the real implementation from the path
 * stored in `__uv$config.sw`).  The `uv.config.js` file normally sets the
 * latter to "/uv/uv.sw.js" which is **not** the file we register directly.
 *
 * To keep things flexible we derive the registration URL from the global
 * configuration when available, with a sensible fallback.  This makes the
 * registration script compatible with both stock and customised setups.
 */

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Compute the URL that should be passed to `navigator.serviceWorker.register`.
 *
 * - If `__uv$config.sw` is defined we assume it points at the _implementation_
 *   file (usually `/uv/uv.sw.js`).  The wrapper that should be registered sits
 *   next to it with the name `sw.js`, so we replace the final segment.
 * - Otherwise we fall back to the stock path used by the upstream project.
 */
function resolveRegistrationPath() {
	if (typeof self !== "undefined" && self.__uv$config && typeof __uv$config.sw === "string") {
		try {
			const url = new URL(__uv$config.sw, location.href);
			const segments = url.pathname.split("/");
			// drop file name and use sw.js
			segments.pop();
			segments.push("sw.js");
			return segments.join("/");
		} catch {
			// fallback to default if config value is malformed
		}
	}
	return "/uv/sw.js";
}

const stockSW = resolveRegistrationPath();

/**
 * Global util
 * Used in 404.html and index.html
 */
async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	await navigator.serviceWorker.register(stockSW);
}
