"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, Building2, MapPin, Search, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import rawObras from "@/data/obras.json";

type Obra = typeof rawObras[number];
const ObrasMap = dynamic(() => import("@/components/ObrasMap"), { ssr: false, loading: () => <div className="map map-loading">Cargando mapa…</div> });
const money = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
const PAGE_SIZE = 10;

export default function Home() {
  const [search, setSearch] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [division, setDivision] = useState("");
  const [tipologia, setTipologia] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"top" | "all">("top");

  const localidades = useMemo(() => [...new Set(rawObras.map(o => o.localidad))].sort((a, b) => a.localeCompare(b, "es")), []);
  const divisiones = useMemo(() => [...new Set(rawObras.map(o => o.division))].sort((a, b) => a.localeCompare(b, "es")), []);
  const tipologias = useMemo(() => [...new Set(rawObras.map(o => o.tipologia))].sort(), []);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return rawObras.filter(o => (!q || String(o.id).includes(q) || o.nombre.toLocaleLowerCase("es").includes(q)) &&
      (!localidad || o.localidad === localidad) && (!division || o.division === division) && (!tipologia || o.tipologia === tipologia));
  }, [search, localidad, division, tipologia]);
  const total = filtered.reduce((sum, o) => sum + o.montoMillones, 0);
  const sortedAmounts = filtered.map(o => o.montoMillones).sort((a, b) => a - b);
  const median = sortedAmounts.length ? (sortedAmounts[Math.floor((sortedAmounts.length - 1) / 2)] + sortedAmounts[Math.floor(sortedAmounts.length / 2)]) / 2 : 0;
  const byDivision = divisiones.map(name => {
    const items = filtered.filter(o => o.division === name);
    return { name, cantidad: items.length, monto: items.reduce((s, o) => s + o.montoMillones, 0) };
  }).filter(x => x.cantidad).sort((a, b) => b.monto - a.monto);
  const ranked = [...filtered].sort((a, b) => b.montoMillones - a.montoMillones);
  const list = view === "top" ? ranked.slice(0, 10) : ranked;
  const maxPage = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const select = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };

  return <main className="shell">
    <header className="header">
      <div><div className="eyebrow">OBSERVATORIO DE OBRAS</div><h1>Obras en Córdoba</h1><p>Una vista clara de la inversión y su distribución territorial.</p></div>
      <div className="header-badge"><Building2 size={17} /> Cartera de obras</div>
    </header>

    <section className="filters" aria-label="Filtros">
      <label className="search-field"><Search size={18} /><input value={search} onChange={e => select(setSearch)(e.target.value)} placeholder="Buscar por ID o nombre" aria-label="Buscar por ID o nombre" /></label>
      <label><span>Localidad</span><select value={localidad} onChange={e => select(setLocalidad)(e.target.value)}><option value="">Todas</option>{localidades.map(x => <option key={x}>{x}</option>)}</select></label>
      <label><span>División</span><select value={division} onChange={e => select(setDivision)(e.target.value)}><option value="">Todas</option>{divisiones.map(x => <option key={x}>{x}</option>)}</select></label>
      <label><span>Tipología</span><select value={tipologia} onChange={e => select(setTipologia)(e.target.value)}><option value="">Todas</option>{tipologias.map(x => <option key={x}>{x}</option>)}</select></label>
    </section>

    <section className="stats" aria-label="Indicadores principales">
      <Stat icon={<Building2 size={20} />} label="Cantidad de obras" value={money(filtered.length)} />
      <Stat icon={<Wallet size={20} />} label="Monto total" value={`${money(total)} M`} note="millones de pesos" />
      <Stat icon={<BarChart3 size={20} />} label="Monto mediano por obra" value={`${money(median)} M`} note="millones de pesos" />
    </section>

    <section className="insights">
      <div className="card chart-card"><div className="section-heading"><div><h2>Inversión por división</h2><p>Montos en millones de pesos</p></div></div>
        {byDivision.length ? <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={byDivision} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 4 }}><CartesianGrid stroke="#e9eef0" horizontal={false} /><XAxis type="number" tickFormatter={money} tick={{ fill: "#667881", fontSize: 12 }} /><YAxis type="category" dataKey="name" width={115} tick={{ fill: "#40545d", fontSize: 12 }} /><Tooltip formatter={(value, name) => [`${money(Number(value))} M de pesos`, name === "monto" ? "Monto" : String(name)]} /><Bar dataKey="monto" fill="#158a91" radius={[0, 5, 5, 0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div> : <Empty />}
      </div>
      <div className="card division-card"><div className="section-heading"><div><h2>Composición de la cartera</h2><p>Obras y participación en el monto</p></div></div>
        {byDivision.length ? <div className="division-list">{byDivision.map(d => <div className="division-row" key={d.name}><div className="division-line"><strong>{d.name}</strong><span>{d.cantidad} {d.cantidad === 1 ? "obra" : "obras"} · {total ? Math.round(d.monto / total * 100) : 0}%</span></div><div className="progress"><div style={{ width: `${total ? d.monto / total * 100 : 0}%` }} /></div></div>)}</div> : <Empty />}
      </div>
    </section>

    <section className="card map-card"><div className="section-heading"><div><h2>Distribución territorial</h2><p>{filtered.length} {filtered.length === 1 ? "obra marcada" : "obras marcadas"} en el mapa</p></div><MapPin size={20} /></div><ObrasMap obras={filtered} /></section>

    <section className="card table-card"><div className="section-heading table-heading"><div><h2>Explorar obras</h2><p>Ordenadas por monto, de mayor a menor</p></div><div className="segmented" aria-label="Vista de obras"><button className={view === "top" ? "active" : ""} onClick={() => { setView("top"); setPage(1); }}>Top 10</button><button className={view === "all" ? "active" : ""} onClick={() => { setView("all"); setPage(1); }}>Todas ({filtered.length})</button></div></div>
      {visible.length ? <div className="table-wrap"><table><thead><tr><th>ID</th><th>Obra</th><th>Localidad</th><th>División</th><th className="amount">Monto (M $)</th></tr></thead><tbody>{visible.map((o: Obra) => <tr key={o.id}><td className="id">#{o.id}</td><td className="obra-name" title={o.nombre}>{o.nombre}</td><td>{o.localidad}</td><td>{o.division}</td><td className="amount">{money(o.montoMillones)}</td></tr>)}</tbody></table></div> : <Empty />}
      {view === "all" && list.length > 0 && <div className="pagination"><span>Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, list.length)} de {list.length}</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page} de {maxPage}</span><button disabled={page === maxPage} onClick={() => setPage(page + 1)}>Siguiente</button></div></div>}
    </section>
    <footer>Fuente: Obras para KPI.xlsx · Importes expresados en millones de pesos</footer>
  </main>;
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return <div className="stat"><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{note && <div className="stat-note">{note}</div>}</div>;
}
function Empty() { return <div className="empty">No hay obras para los filtros seleccionados.</div>; }
