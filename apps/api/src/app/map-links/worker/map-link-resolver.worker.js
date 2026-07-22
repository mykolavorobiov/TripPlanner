const { parentPort } = require('node:worker_threads');

if (!parentPort) {
  throw new Error('Map link resolver must run inside a worker thread');
}

parentPort.once('message', async ({ url: value }) => {
  try {
    const originalUrl = value.trim();
    const parsed = parseGoogleUrl(originalUrl);
    let finalUrl = parsed.toString();

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      finalUrl = response.url || finalUrl;
    } catch {
      throw new Error('Could not resolve the Google Maps URL');
    }

    const coordinates = extractCoordinates(finalUrl);
    parentPort.postMessage({
      ok: true,
      value: {
        originalUrl,
        finalUrl,
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
      },
    });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'Map link worker failed',
    });
  }
});

function parseGoogleUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('A valid URL is required');
  }

  const host = url.hostname.toLowerCase();
  const allowed =
    host === 'maps.app.goo.gl' ||
    host === 'goo.gl' ||
    host === 'google.com' ||
    host.endsWith('.google.com');
  if (!allowed || url.protocol !== 'https:') {
    throw new Error('Only HTTPS Google Maps URLs are supported');
  }
  return url;
}

function extractCoordinates(value) {
  const pathMatch = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (pathMatch) {
    return { lat: Number(pathMatch[1]), lng: Number(pathMatch[2]) };
  }

  const url = new URL(value);
  const query = url.searchParams.get('q') ?? url.searchParams.get('query');
  const queryMatch = query?.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  return queryMatch
    ? { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) }
    : null;
}
