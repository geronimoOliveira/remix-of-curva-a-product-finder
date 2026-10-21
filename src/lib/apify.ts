export type MLItem = {
  id: string; title: string; price: number; original_price: number | null;
  sold: number | null; stock: number | null; condition: string; listing: string;
  free_shipping: boolean; full: boolean; official: boolean; thumbnail: string;
  permalink: string; brand: string | null;
};
export type SearchFilters = { freeShipping?: boolean | undefined; fullOnly?: boolean | undefined; official?: boolean | undefined; minPrice?: number | undefined; maxPrice?: number | undefined };
export function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  let s = value.replace(/[^\d.,]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return s && Number.isFinite(n) ? n : null;
}
export function normalizeApify(items: Record<string, unknown>[], filters: SearchFilters): MLItem[] {
  const seen = new Set<string>();
  return items.flatMap((it) => {
    const id = String(it['idPublicacao'] || it['SKU'] || it['idProdutoCatalogo'] || '');
    const price = numeric(it['novoPreco']);
    const permalink = String(it['zProdutoLink'] || '');
    if (!id || seen.has(id) || price === null || !/^https:\/\/(?:[\w-]+\.)?(?:mercadolivre\.com\.br|mercadolibre\.com)\//.test(permalink)) return [];
    seen.add(id);
    const item: MLItem = {
      id, title: String(it['eTituloProduto'] || ''), price, original_price: numeric(it['precoAnterior']),
      sold: numeric(it['quantidadeVendida']), stock: null, condition: 'new', listing: '',
      free_shipping: it['freteGratis'] === true, full: /\bFULL\b/i.test(String(it['envio'] || '')),
      official: it['lojaOficial'] === true, thumbnail: String(it['imagemLink'] || '').replace(/^http:/, 'https:'),
      permalink, brand: typeof it['produtoMarca'] === 'string' ? it['produtoMarca'] : null,
    };
    if (filters.freeShipping && !item.free_shipping || filters.fullOnly && !item.full || filters.official && !item.official || filters.minPrice !== undefined && price < filters.minPrice || filters.maxPrice !== undefined && price > filters.maxPrice) return [];
    return [item];
  });
}
