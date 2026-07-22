import { writeFile } from 'node:fs/promises';

const value = process.env.API_URL;
if (!value) throw new Error('API_URL is required for a Render frontend build');

const apiUrl = new URL(value);
if (apiUrl.protocol !== 'https:') {
  throw new Error('API_URL must use HTTPS');
}

const normalized = apiUrl.toString().replace(/\/$/, '');
const source = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(normalized)},
};
`;

await writeFile(
  new URL(
    '../apps/front-end/src/environments/environment.production.ts',
    import.meta.url,
  ),
  source,
);
