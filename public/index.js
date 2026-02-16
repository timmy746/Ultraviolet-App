"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

async function loadUrl(rawUrl) {
	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = rawUrl;
	const frame = document.getElementById("uv-frame");
	frame.style.display = "block";

	const wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [
			{ wisp: wispUrl },
		]);
	}
	// load the local wrapper page which displays the header and an inner proxied iframe
	frame.src = '/uv/proxy.html?url=' + encodeURIComponent(url);
	// remember last raw URL for toolbar actions
	window.__uv_last_loaded = url;
	// show the parent proxy toolbar (hidden on homepage)
	try {
		const tb = document.getElementById('proxy-toolbar');
		if (tb) tb.style.display = 'flex';
	} catch (e) {
		console.warn('Failed to show proxy toolbar', e);
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const url = search(address.value, searchEngine.value);
	await loadUrl(url);
});

// Toolbar bindings
const toolbarInput = document.getElementById("proxy-url-input");
const toolbarLoad = document.getElementById("proxy-load-btn");
const toolbarNew = document.getElementById("proxy-newtab-btn");

// Click load: build URL using same search() helper and load into frame
toolbarLoad.addEventListener("click", async () => {
	const q = toolbarInput.value || address.value || "";
	if (!q) return;
	const url = search(q, searchEngine.value);
	await loadUrl(url);
});

// Open current frame URL in a new tab (decodes encoded path)
toolbarNew.addEventListener("click", () => {
	const url = window.__uv_last_loaded || toolbarInput.value || address.value || "";
	if (!url) return;
	try {
		const target = (typeof __uv$config !== 'undefined' && __uv$config.prefix && __uv$config.encodeUrl)
			? __uv$config.prefix + __uv$config.encodeUrl(url)
			: '/uv/service/' + encodeURIComponent(url);
		window.open(target, '_blank');
	} catch (e) {
		console.error(e);
	}
});

// Optional: populate toolbar input from main address input
toolbarInput.value = address.value || "";
