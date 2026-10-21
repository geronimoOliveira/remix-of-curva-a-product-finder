import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { normalizeApify, type MLItem } from './apify';
export type { MLItem } from './apify';
export type SearchResult = { ok: boolean; error?: string; total: number; items: MLItem[]; collectedAt: string };
const schema = z.object({
  q: z.string().trim().min(1).max(200), apiKey: z.string().trim().max(512).optional(),
  freeShipping: z.boolean().optional(), fullOnly: z.boolean().optional(), official: z.boolean().optional(),
  minPrice: z.number().finite().nonnegative().optional(), maxPrice: z.number().finite().nonnegative().optional(),
}).refine(d => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice, 'Faixa de preço inválida');
export const searchML = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof schema>) => schema.parse(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    const collectedAt = new Date().toISOString();
    const fail = (error: string): SearchResult => ({ ok: false, error, total: 0, items: [], collectedAt });
    // A manually entered visitor token is session-only BYOK, never a connector key.
    // Workspace connector credentials always go through the gateway.
    const manual = data.apiKey;
    const projectKey = process.env['LOVABLE_API_KEY'];
    const connectionKey = process.env['APIFY_API_KEY'];
    if (!manual && (!projectKey || !connectionKey)) return fail('Conecte a Apify ou informe sua chave de API.');
    const base = manual ? 'https://api.apify.com/v2' : 'https://connector-gateway.lovable.dev/apify';
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${manual || projectKey}` };
    if (!manual && connectionKey) headers['X-Connection-Api-Key'] = connectionKey;
    try {
      const response = await fetch(`${base}/acts/karamelo~mercadolivre-scraper-brasil-portugues/run-sync-get-dataset-items?timeout=120&memory=1024`, {
        method: 'POST', headers, body: JSON.stringify({ keyword: data.q, sort: 'relevance', maxPages: 1, scrapeOfertas: false, promoted: false }),
        signal: AbortSignal.timeout(130000),
      });
      if (!response.ok) {
        // Do not expose provider bodies that may echo a manually supplied credential.
        console.error('Apify search failed', response.status);
        return fail(response.status === 401 ? 'Apify recusou a chave de API. Verifique a conexão ou informe outra chave.' : response.status === 402 ? 'A conta Apify precisa de créditos para realizar esta coleta.' : response.status === 408 ? 'A coleta Apify excedeu o tempo de espera. Consulte a execução na Apify antes de tentar novamente.' : `A coleta Apify falhou (HTTP ${response.status}). Verifique a execução na sua conta Apify.`);
      }
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) return fail('Apify retornou um formato de dados inesperado.');
      const source = raw.filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null);
      const items = normalizeApify(source, data);
      return { ok: true, total: source.length, items, collectedAt };
    } catch {
      return fail('Não foi possível concluir a coleta Apify. Verifique a execução na sua conta antes de tentar novamente.');
    }
  });
