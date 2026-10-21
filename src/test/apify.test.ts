import { describe, it, expect } from 'vitest';
import { normalizeApify } from '@/lib/apify';
const product = { idPublicacao: 'MLB123', eTituloProduto: 'Filtro de óleo', novoPreco: '89,90', quantidadeVendida: 500, freteGratis: true, lojaOficial: true, envio: 'Enviado pelo FULL', zProdutoLink: 'https://www.mercadolivre.com.br/p/MLB123' };
describe('Apify search', () => {
  it('maps Apify products to the Curva A sales input', () => {
    expect(normalizeApify([product], {})[0]).toMatchObject({ id: 'MLB123', price: 89.9, sold: 500, full: true, official: true });
  });
  it('keeps shipping filters when searching through Apify', () => {
    expect(normalizeApify([{ ...product, freteGratis: false }], { freeShipping: true })).toEqual([]);
  });
  it('keeps FULL and official store filters', () => {
    expect(normalizeApify([{ ...product, envio: '', lojaOficial: false }], { fullOnly: true, official: true })).toEqual([]);
  });
  it('keeps minimum and maximum price filters', () => {
    expect(normalizeApify([product], { minPrice: 90 })).toEqual([]);
    expect(normalizeApify([product], { maxPrice: 80 })).toEqual([]);
  });
  it('does not invent missing sales quantities', () => {
    expect(normalizeApify([{ ...product, quantidadeVendida: null }], {})[0]?.sold).toBeNull();
  });
});
