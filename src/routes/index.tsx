import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { searchML, type SearchResult } from "@/lib/ml.functions";
import { classifyCurvaA } from "@/lib/curva";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Curva A ML — Mais vendidos do Mercado Livre" },
      { name: "description", content: "Identifique produtos Curva A em peças para moto, caminhão, carro e tratores no Mercado Livre." },
      { property: "og:title", content: "Curva A ML" },
      { property: "og:description", content: "Busca rápida de produtos Curva A no Mercado Livre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const CATS = ["Peças para moto", "Peças para caminhão", "Peças para carro", "Peças para tratores"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${Math.round(n * 100)}%`;

function Index() {
  const [cat, setCat] = useState<string>(CATS[2] ?? "Peças para carro");
  const search = useServerFn(searchML);
  const [keyOpen, setKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ freeShipping: false, fullOnly: false, official: false, minPrice: "", maxPrice: "" });
  const [onlyA, setOnlyA] = useState(true);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<SearchResult | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const query = `${cat.replace("Peças para ", "peças ")} ${q}`.trim();
      setRes(await search({ data: { q: query, apiKey: apiKey || undefined, freeShipping: f.freeShipping, fullOnly: f.fullOnly, official: f.official, minPrice: f.minPrice ? +f.minPrice : undefined, maxPrice: f.maxPrice ? +f.maxPrice : undefined } }));
    } catch {
      setRes({ ok: false, error: "Não foi possível realizar a busca. Tente novamente.", total: 0, items: [], collectedAt: new Date().toISOString() });
    } finally { setLoading(false); }
  }

  const cls = res?.ok ? classifyCurvaA(res.items) : null;
  const rows = cls ? (onlyA ? cls.rows.filter((r) => r.curvaA) : cls.rows) : [];
  const a = cls?.rows.filter((r) => r.curvaA) ?? [];
  const prices = a.map((r) => r.price).sort((x, y) => x - y);

  return (
    <div className="min-h-screen">
      <header className="bg-brand shadow-sm">
        <form onSubmit={run} className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <span className="text-lg font-extrabold text-brand-foreground">Curva<span className="text-primary">A</span> ML</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-sm bg-card px-2 py-2 text-sm shadow-sm">
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: amortecedor, pastilha de freio, filtro de óleo…" className="min-w-[200px] flex-1 rounded-sm bg-card px-3 py-2 text-sm shadow-sm outline-none" />
          <Button type="submit" disabled={loading}>{loading ? "Coletando…" : "Buscar"}</Button>
          <Button type="button" variant="outline" size="icon" title="Chave Apify" aria-label="Chave Apify" onClick={() => { setKeyDraft(""); setKeyOpen(true); }}><KeyRound /></Button>
        </form>
      </header>

      <Dialog open={keyOpen} onOpenChange={(open) => { setKeyOpen(open); if (!open) setKeyDraft(""); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chave de API Apify</DialogTitle>
            <DialogDescription>{apiKey ? "Chave pessoal ativa nesta sessão." : "Conexão Apify do projeto ativa."} As coletas podem consumir créditos Apify.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setApiKey(keyDraft.trim()); setKeyDraft(""); setKeyOpen(false); }}>
            <label className="block space-y-2 text-sm"><span>Usar outra chave nesta sessão</span><input type="password" autoComplete="off" aria-label="Chave de API Apify" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="Token da sua conta Apify" className="w-full rounded-sm border bg-card px-3 py-2" /></label>
            <p className="text-xs text-muted-foreground">A chave não é salva no navegador e será esquecida ao recarregar a página.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setApiKey(""); setKeyDraft(""); setKeyOpen(false); }}>Usar conexão do projeto</Button>
              <Button type="submit" disabled={!keyDraft.trim()}>Usar chave</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md bg-card p-3 text-sm shadow-sm">
          {([["freeShipping", "Frete grátis"], ["fullOnly", "Apenas FULL"], ["official", "Lojas oficiais"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{l}</label>
          ))}
          <input value={f.minPrice} onChange={(e) => setF({ ...f, minPrice: e.target.value })} placeholder="Preço mín." type="number" className="w-24 rounded-sm border px-2 py-1" />
          <input value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })} placeholder="Preço máx." type="number" className="w-24 rounded-sm border px-2 py-1" />
          <label className="ml-auto flex items-center gap-1.5 font-medium"><input type="checkbox" checked={onlyA} onChange={(e) => setOnlyA(e.target.checked)} />Mostrar só Curva A</label>
        </div>

        {!res && <p className="py-16 text-center text-muted-foreground">Escolha uma categoria, digite um produto e clique em Buscar. Condição padrão: novo.</p>}
        {res && !res.ok && <div className="rounded-md bg-card p-4 text-sm text-destructive shadow-sm">{res.error}</div>}

        {res?.ok && rows.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum produto encontrado com estes filtros.</p>}
        {cls && res && (
          <>
            <div className="mb-3 grid gap-3 text-sm sm:grid-cols-4">
              <Stat label="Coletados / filtrados" value={`${res.total.toLocaleString("pt-BR")} / ${res.items.length}`} />
              <Stat label="Itens Curva A" value={`${a.length}`} />
              <Stat label="Faixa de preço Curva A" value={prices.length ? `${brl(prices[0] ?? 0)} – ${brl(prices[prices.length - 1] ?? 0)}` : "n/d"} />
              <Stat label="FULL · Frete grátis" value={a.length ? `${pct(a.filter((r) => r.full).length / a.length)} · ${pct(a.filter((r) => r.free_shipping).length / a.length)}` : "n/d"} />
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Coleta: {new Date(res.collectedAt).toLocaleString("pt-BR")} · Via: Apify · {cls.method === "pareto" ? "Critério: Pareto (≈80% das unidades vendidas)" : "Estimativa: top 20% do ranking (vendas não disponíveis na coleta)"} · Reavaliar em 7 dias.
            </p>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <a key={r.id} href={r.permalink} target="_blank" rel="noreferrer" className="flex gap-4 rounded-md bg-card p-3 shadow-sm transition hover:shadow-md">
                  <img src={r.thumbnail} alt="" loading="lazy" className="h-20 w-20 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      <h3 className="line-clamp-2 text-sm">{r.title}</h3>
                      {r.curvaA && <span className="ml-auto shrink-0 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">CURVA A</span>}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      {r.original_price && r.original_price > r.price && <span className="text-xs text-muted-foreground line-through">{brl(r.original_price)}</span>}
                      <span className="text-xl">{brl(r.price)}</span>
                      {r.original_price && r.original_price > r.price && <span className="text-xs text-success">{pct(1 - r.price / r.original_price)} OFF</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {r.free_shipping && <span className="font-semibold text-success">Frete grátis</span>}
                      {r.full && <span className="font-bold text-success">⚡FULL</span>}
                      {r.official && <span>Loja oficial</span>}
                      <span>Vendidos: {r.sold ?? "n/d"}</span>
                      {r.share !== null && <span>Part.: {pct(r.share)}</span>}
                      <span>Estoque: {r.stock ?? "n/d"}</span>
                      <span>Marca: {r.brand ?? "n/d"}</span>
                      <span>{r.listing ? (r.listing === "gold_pro" ? "Premium" : "Clássico") : "Tipo: n/d"}</span>
                      <span>{r.id}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-card p-3 shadow-sm"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
