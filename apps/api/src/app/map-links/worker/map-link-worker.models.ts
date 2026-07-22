import type { ResolvedMapLink } from '../resolved-map-link';

export type MapLinkWorkerRequest = { url: string };

export type MapLinkWorkerResponse =
  { ok: true; value: ResolvedMapLink } | { ok: false; error: string };
