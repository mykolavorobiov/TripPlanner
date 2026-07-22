import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import type {
  MapLinkWorkerRequest,
  MapLinkWorkerResponse,
} from './worker/map-link-worker.models';
import type { ResolvedMapLink } from './resolved-map-link';

@Injectable()
export class MapLinksService {
  async resolve(value: string): Promise<ResolvedMapLink> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        join(__dirname, 'workers', 'map-links', 'map-link-resolver.worker.js'),
      );
      const request: MapLinkWorkerRequest = { url: value };
      let settled = false;

      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        void worker.terminate();
        reject(
          error instanceof BadRequestException
            ? error
            : new BadRequestException('Map link worker failed'),
        );
      };

      worker.once('message', (response: MapLinkWorkerResponse) => {
        if (settled) return;
        settled = true;
        void worker.terminate();
        if ('value' in response) resolve(response.value);
        else reject(new BadRequestException(response.error));
      });
      worker.once('error', fail);
      worker.once('exit', (code) => {
        if (code !== 0)
          fail(new Error(`Map link worker exited with code ${code}`));
      });
      worker.postMessage(request);
    });
  }
}
