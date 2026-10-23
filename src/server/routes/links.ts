import { Router, Request, Response } from 'express';

const router = Router();

interface PreviewData {
  original_url: string;
  title: string;
  description: string;
  domain: string;
  favicon_url?: string;
  image_url?: string;
}

export async function fetchLinkMetadata(rawUrl: string): Promise<PreviewData> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace(/^www\./, '');
  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ComunilandBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        original_url: rawUrl,
        title: domain,
        description: `Enlace externo a ${parsedUrl.hostname}`,
        domain,
        favicon_url: defaultFavicon,
      };
    }

    const html = await response.text();

    // Extract title
    let title = '';
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : domain;
    }

    // Extract description
    let description = '';
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch) {
      description = ogDescMatch[1];
    } else {
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      description = descMatch ? descMatch[1].trim() : `Recurso en ${domain}`;
    }

    // Extract OpenGraph Image
    let imageUrl = '';
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
      if (imageUrl.startsWith('/')) {
        imageUrl = `${parsedUrl.origin}${imageUrl}`;
      }
    }

    return {
      original_url: rawUrl,
      title: title.slice(0, 120),
      description: description.slice(0, 240),
      domain,
      favicon_url: defaultFavicon,
      image_url: imageUrl || undefined,
    };
  } catch (err) {
    return {
      original_url: rawUrl,
      title: domain,
      description: `Enlace web a ${domain}`,
      domain,
      favicon_url: defaultFavicon,
    };
  }
}

router.get('/preview', async (req: Request, res: Response) => {
  const urlParam = req.query.url as string;
  if (!urlParam) {
    res.status(400).json({ error: 'Parámetro URL requerido' });
    return;
  }

  try {
    const metadata = await fetchLinkMetadata(urlParam);
    res.json(metadata);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener la vista previa del enlace' });
  }
});

export default router;
