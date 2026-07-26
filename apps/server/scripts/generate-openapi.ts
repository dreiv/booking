import { writeFileSync } from 'node:fs';
import { generateOpenApiDocument } from '../src/openapi/registry.ts';

writeFileSync(
  new URL('../openapi.json', import.meta.url),
  JSON.stringify(generateOpenApiDocument(), null, 2),
);
