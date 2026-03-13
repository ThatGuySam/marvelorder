import {
  PhotonImage,
  SamplingFilter,
  crop as cropImage,
  resize as resizeImage,
} from '@cf-wasm/photon/workerd';
import { processImageBytes, type RouteKind } from './image-transform';

const MAX_RESPONSE_SIZE = 6 * 1024 * 1024;
const DEFAULT_WIDTH = 750;
const WEBP_CONTENT_TYPE = 'image/webp';
const CACHE_CONTROL = 'public, max-age=365000000, immutable';
const TMDB_BASE_URL = 'https://image.tmdb.org/t/p/original';
const FANART_BASE_URL = 'https://assets.fanart.tv/fanart/movies/0/hdmovielogo';
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

interface RouteMatch {
  kind: RouteKind;
  imagePath: string;
}

interface RequestOptions {
  width: number;
  cropTop: number;
  cropBottom: number;
  transparent: boolean;
  requestExtension: string;
  contentUrl: string;
  contentPath: string;
}

const ROUTE_PREFIXES: Record<RouteKind, string[]> = {
  tmdb: [
    '/.netlify/functions/tmdb-image/',
    '/api/tmdb-image/',
    '/tmdb-image/',
  ],
  fanart: [
    '/.netlify/functions/fanart/',
    '/api/fanart/',
    '/fanart/',
  ],
};

const OUTPUT_EXTENSION_FALLBACKS: Record<RouteKind, string[]> = {
  tmdb: ['jpg', 'png', 'webp', 'svg', 'gif'],
  fanart: ['png', 'jpg', 'webp', 'svg', 'gif'],
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/healthz') {
      return new Response('ok');
    }

    const route = matchRoute(url.pathname);

    if (!route) {
      return new Response('Not found', { status: 404 });
    }

    try {
      const options = getOptions(url, route);
      const source = await fetchSourceImage(options, route.kind);

      if (!source.response.ok) {
        return new Response(source.response.statusText || 'Upstream error', {
          status: source.response.status,
        });
      }

      const inputBytes = new Uint8Array(await source.response.arrayBuffer());
      const sourceFormat = sniffImageFormat(
        source.response.headers.get('content-type'),
        inputBytes,
      );

      if (sourceFormat === 'svg' || sourceFormat === 'gif') {
        return Response.redirect(source.url, 302);
      }

      const outputBytes = processImageBytes(
        {
          PhotonImage,
          SamplingFilter,
          crop: cropImage,
          resize: resizeImage,
        },
        route.kind,
        options,
        inputBytes,
      );

      if (outputBytes.byteLength > MAX_RESPONSE_SIZE) {
        return new Response('Requested image is too large. Maximum size is 6MB.', {
          status: 400,
        });
      }

      const headers = new Headers({
        'Content-Type': WEBP_CONTENT_TYPE,
        'Cache-Control': CACHE_CONTROL,
        ETag: await createEtag(outputBytes),
      });

      return new Response(
        request.method === 'HEAD' ? null : outputBytes,
        {
          status: 200,
          headers,
        },
      );
    } catch (error) {
      console.error('Worker image spike failed', error);
      return new Response('Error', { status: 500 });
    }
  },
};

function matchRoute(pathname: string): RouteMatch | null {
  for (const kind of Object.keys(ROUTE_PREFIXES) as RouteKind[]) {
    for (const prefix of ROUTE_PREFIXES[kind]) {
      if (pathname.startsWith(prefix)) {
        const imagePath = pathname.slice(prefix.length);
        if (imagePath) {
          return { kind, imagePath };
        }
      }
    }
  }

  return null;
}

function getOptions(url: URL, route: RouteMatch): RequestOptions {
  const width = parsePositiveInt(url.searchParams.get('width'), DEFAULT_WIDTH);
  const cropTop = normalizeFraction(url.searchParams.get('crop.top'));
  const cropBottom = normalizeFraction(url.searchParams.get('crop.bottom'));
  const transparent = route.kind === 'tmdb'
    ? parseBoolean(url.searchParams.get('transparent'), true)
    : false;
  const requestExtension = getRequestExtension(route.imagePath);
  const baseUrl = route.kind === 'tmdb' ? TMDB_BASE_URL : FANART_BASE_URL;
  const contentPath = route.imagePath;
  const contentUrl = `${baseUrl}/${contentPath}`;

  return {
    width,
    cropTop,
    cropBottom,
    transparent,
    requestExtension,
    contentUrl,
    contentPath,
  };
}

async function fetchSourceImage(
  options: RequestOptions,
  kind: RouteKind,
): Promise<{ response: Response; url: string }> {
  const candidateExtensions = new Set<string>([
    ...OUTPUT_EXTENSION_FALLBACKS[kind],
    options.requestExtension,
  ]);

  let lastResponse = new Response('Not found', { status: 404 });
  let lastUrl = options.contentUrl;

  for (const extension of candidateExtensions) {
    const candidateUrl = replaceExtension(options.contentUrl, extension);
    const response = await fetch(candidateUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    lastResponse = response;
    lastUrl = candidateUrl;

    if (response.ok) {
      return { response, url: candidateUrl };
    }
  }

  return { response: lastResponse, url: lastUrl };
}

function replaceExtension(url: string, extension: string): string {
  return url.replace(/\.[^./?#]+(?=([?#]|$))/, `.${extension}`);
}

function getRequestExtension(imagePath: string): string {
  const match = imagePath.match(/\.([^./?#]+)(?:[?#].*)?$/);
  return match?.[1]?.toLowerCase() || 'jpg';
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  throw new Error(`Invalid width: ${value}`);
}

function normalizeFraction(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid crop value: ${value}`);
  }

  return Math.min(Math.max(parsed, 0), 0.99);
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return TRUE_VALUES.has(value.toLowerCase());
}

function sniffImageFormat(
  contentTypeHeader: string | null,
  bytes: Uint8Array,
): 'jpeg' | 'png' | 'webp' | 'gif' | 'svg' | 'unknown' {
  const contentType = contentTypeHeader?.toLowerCase() || '';

  if (contentType.includes('image/svg')) {
    return 'svg';
  }

  if (contentType.includes('image/gif')) {
    return 'gif';
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'png';
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'gif';
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  const snippet = new TextDecoder().decode(bytes.slice(0, 512)).toLowerCase();

  if (snippet.includes('<svg')) {
    return 'svg';
  }

  return 'unknown';
}

async function createEtag(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  const hash = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

  return `"${hash}"`;
}
