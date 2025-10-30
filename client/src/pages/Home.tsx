import { useMemo, useState, useEffect } from "react";
import { Upload } from "../components/upload";
import { pdfCacheService, CachedUserSummary } from "../services/pdfCacheService";

export default function Home() {
  // removed remote users fetch: we rely solely on local pdf cache for displayed clients

  // Seletor de ano (exibição/controle) - os anos serão extraídos do cache após carregamento
      const tabelas = [
        {
          2025: [
            {
              "Alíquota 1": { De: null, Ate: 4679.67, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4679.68, Ate: 8157.41, percentual: 0.14, deduzir: 140.39 },
              "Alíquota 3": { De: 8157.42, Ate: 20055.73, percentual: 0.15, deduzir: 221.96 },
              "Alíquota 4": { De: 20055.74, Ate: 40111.45, percentual: 0.16, deduzir: 422.52 },
              "Alíquota 5": { De: 40111.46, Ate: null, percentual: 0.18, deduzir: 1224.75 },
            },
          ],
          2024: [
            {
              "Alíquota 1": { De: null, Ate: 4466.61, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4466.62, Ate: 7786.02, percentual: 0.14, deduzir: 134.00 },
              "Alíquota 3": { De: 7786.03, Ate: 19142.63, percentual: 0.15, deduzir:211.86 },
              "Alíquota 4": { De: 19142.64, Ate: 38285.24, percentual: 0.16, deduzir: 403.28 },
              "Alíquota 5": { De: 38285.25, Ate: null, percentual: 0.18, deduzir: 1168.99 },
            },
          ],
          2023: [
            {
              "Alíquota 1": { De: null, Ate: 4306.83, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4306.84, Ate: 7507.49, percentual: 0.14, deduzir: 129.20 },
              "Alíquota 3": { De: 7507.50, Ate: 18457.84, percentual: 0.15, deduzir: 204.28 },
              "Alíquota 4": { De: 18457.85, Ate: 36915.67, percentual: 0.16, deduzir: 388.86 },
              "Alíquota 5": { De: 36915.68, Ate: null, percentual: 0.18, deduzir: 1127.17 },
            },
          ],
           2022: [
            {
              "Alíquota 1": { De: null, Ate: 4065.73, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4065.74, Ate: 7087.22, percentual: 0.14, deduzir: 121.97 },
              "Alíquota 3": { De: 7087.23, Ate: 17424.56, percentual: 0.15, deduzir: 192.84 },
              "Alíquota 4": { De: 17424.57, Ate: 34849.12, percentual: 0.16, deduzir: 367.09 },
              "Alíquota 5": { De: 34849.13, Ate: null, percentual: 0.18, deduzir: 1064.07 },
            },
          ],
           2021: [
            {
              "Alíquota 1": { De: null, Ate: 3690.75, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 3690.76, Ate: 6433.57, percentual: 0.14, deduzir: 110.72 },
              "Alíquota 3": { De: 6433.58, Ate: 15817.50, percentual: 0.15, deduzir: 175.06 },
              "Alíquota 4": { De: 15817.51, Ate: 31635.00, percentual: 0.16, deduzir: 333.23 },
              "Alíquota 5": { De: 31635.01, Ate: null, percentual: 0.18, deduzir: 965.93 },
            },
          ],
        },
      ];
  const [selectedYear, setSelectedYear] = useState<string>(
    () => String(new Date().getFullYear())
  );

  // selectedYear will be synchronized with extracted years once cache is loaded

  // Modal de upload de PDF
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Estado para dados em cache (vantagens) do último upload
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [cachedCpf, setCachedCpf] = useState<string | null>(null);
  const [cachedUserInfo, setCachedUserInfo] = useState<{
    name: string;
    cpf: string;
    matricula: string;
    cargo: string;
  } | null>(null);
  const [cachedAdvantages, setCachedAdvantages] = useState<
    Array<{
      name: string;
      amount: number;
      monthYear: string;
      paidMonthYear?: string;
    }>
  >([]);
  const [cachedDiscounts, setCachedDiscounts] = useState<
    Array<{
      name: string;
      amount: number;
      monthYear: string;
      paidMonthYear?: string;
    }>
  >([]);
  // Compute available years from cached advantages/discounts (extracted from monthYear/paidMonthYear)
  const extractedYears = useMemo(() => {
    const set = new Set<string>();
    const addFrom = (arr: Array<any> | undefined) => {
      if (!arr) return;
      for (const item of arr) {
        if (item?.monthYear && typeof item.monthYear === 'string') {
          const parts = item.monthYear.split('/');
          if (parts.length === 2) set.add(parts[1]);
        }
        if (item?.paidMonthYear && typeof item.paidMonthYear === 'string') {
          const parts = item.paidMonthYear.split('/');
          if (parts.length === 2) set.add(parts[1]);
        }
      }
    };
    addFrom(cachedAdvantages);
    addFrom(cachedDiscounts);
    return Array.from(set).map((y) => String(y)).sort((a, b) => Number(a) - Number(b));
  }, [cachedAdvantages, cachedDiscounts]);

  // When extractedYears changes, default selectedYear to the first available year if current isn't present
  useEffect(() => {
    if (extractedYears.length === 0) return;
    if (!extractedYears.includes(selectedYear)) {
      setSelectedYear(extractedYears[0]);
    }
  }, [extractedYears]);
  const [viewMode, setViewMode] = useState<
    "general" | "advantages" | "discounts"
  >("general");

  // Nome do arquivo gerado no último upload (se o servidor retornou um filename)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Add a dedicated state for cache verification
  const [isVerifyingCache, setIsVerifyingCache] = useState(true);

  // Carrega o último usuário em cache e suas vantagens
  const loadLatestCache = async () => {
    try {
      setCacheLoading(true);
      setIsVerifyingCache(true);
      const list = await pdfCacheService.listCachedUsers();
      if (!list.length) {
        setCachedCpf(null);
        setCachedAdvantages([]);
        setCacheError(null);
        return;
      }
      const last = list[list.length - 1];
      // set basic summary info immediately so UI shows a name/cpf even if detail fetch fails
      setCachedCpf(last.cpf);
      setCachedUserInfo({
        name: last.name || 'NÃO INFORMADO',
        cpf: last.cpf,
        matricula: last.matricula || 'NÃO INFORMADO',
        cargo: last.cargo || 'NÃO INFORMADO',
      });
      try {
        const detail = await pdfCacheService.getCachedUser(last.cpf);
        if (detail) {
          setCachedUserInfo({
            name: detail.name || (last.name || 'NÃO INFORMADO'),
            cpf: detail.cpf || last.cpf,
            matricula: detail.matricula || last.matricula || 'NÃO INFORMADO',
            cargo: detail.cargo || last.cargo || 'NÃO INFORMADO',
          });
          setCachedAdvantages(detail.advantages || []);
          setCachedDiscounts(detail.discounts || []);
        } else {
          // fallback to empty arrays when detail absent
          setCachedAdvantages([]);
          setCachedDiscounts([]);
        }
      } catch (innerErr) {
        console.error('Failed to fetch cached user detail:', innerErr);
        // keep summary info but clear detailed lists
        setCachedAdvantages([]);
        setCachedDiscounts([]);
        setCacheError('Erro ao carregar dados do último upload');
      }
      setCacheError(null);
    } catch (e) {
      setCacheError("Erro ao carregar dados do último upload");
    } finally {
      setCacheLoading(false);
      setIsVerifyingCache(false);
    }
  };

  useEffect(() => {
    loadLatestCache();
  }, []);

  // Troca o usuário exibido ao clicar na lista da direita
  const loadCacheByCpf = async (cpf: string) => {
    try {
      setCacheLoading(true);
      setCachedCpf(cpf);
      const detail = await pdfCacheService.getCachedUser(cpf);
      setCachedAdvantages(detail.advantages || []);
      setCachedDiscounts(detail.discounts || []);
      setCachedUserInfo({
        name: detail.name,
        cpf: detail.cpf,
        matricula: detail.matricula,
        cargo: detail.cargo,
      });
      setCacheError(null);
    } catch (e) {
      setCacheError("Erro ao carregar dados do usuário selecionado");
    } finally {
      setCacheLoading(false);
    }
  };

  // Monta meses do ano selecionado (ex.: 01/2020 ... 12/2020)
  const months = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, i) => `${String(i + 1).padStart(2, "0")}/${selectedYear}`
      ),
    [selectedYear]
  );

  // Precompute cutoff (today minus 5 years) used to determine prescription-excluded months
  const cutoff = useMemo(() => {
    const now = new Date();
    const c = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    return { year: c.getFullYear(), month: c.getMonth() + 1 };
  }, []);

  // Filtra vantagens/desvantagens do ano selecionado
  const advantagesOfYear = useMemo(
    () =>
      cachedAdvantages.filter(
        (a) =>
          /\d{2}\/\d{4}/.test(a.monthYear) &&
          a.monthYear.endsWith(`/${selectedYear}`)
      ),
    [cachedAdvantages, selectedYear]
  );
  const discountsOfYear = useMemo(
    () =>
      cachedDiscounts.filter(
        (a) =>
          /\d{2}\/\d{4}/.test(a.monthYear) &&
          a.monthYear.endsWith(`/${selectedYear}`)
      ),
    [cachedDiscounts, selectedYear]
  );

  // Colunas dinâmicas (nomes de vantagens), com ordem preferencial
  const uniqueCols = useMemo(() => {
    const set = new Set<string>();
    const source =
      viewMode === "advantages" ? advantagesOfYear : discountsOfYear;
    for (const a of source) set.add(a.name);
    const preferred = [
      "VENC. BASE",
      "ADTS",
      "FUNÇÃO GRATIFICADA",
      "INSALUBRIDADE",
      "GRATIF. JORNADA ESPECIAL",
      "ADD NOTURNO",
      "ADICIONAL DE FÉRIAS",
      "GRATIFICAÇÃO NATALINA",
      "ADIANTAMENTO GRATIFICAÇÃO NATALINA",
      "TOTAL VANTAGENS",
    ];
    const arr = Array.from(set);
    arr.sort((a, b) => {
      const ia = preferred.indexOf(a);
      const ib = preferred.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return arr;
  }, [advantagesOfYear, discountsOfYear, viewMode]);

  // Geral (colunas fixas): mistura vantagens e descontos por mês
  const generalCols = [
    "VENC. BASE",
    "ADTS",
    "IPE",
    // "IRRF",
    "TOTAL VANTAGENS AJUSTADA",
    "TOTAL DESCONTOS",
    "Desconto Previdência",
    "Diferença",
  ] as const;

  // Type for a general data row: all columns are numbers, but 'Diferença' may be null
  type GeneralRow = {
    [K in (typeof generalCols)[number]]: K extends "Diferença" ? number | null : number;
  };

  // Função para buscar faixa de alíquota pelo valor e ano
  function getAliquotaFaixa(valor: number, ano: string) {
  const anoNum = Number(ano);

  // Special-case: year 2020 uses a flat 11% on the adjusted total (do not consult tabelas)
  if (anoNum === 2020) {
    return { De: null, Ate: null, percentual: 0.11, deduzir: null } as any;
  }

  const tabelaAno = tabelas.find((t) => Object.prototype.hasOwnProperty.call(t, anoNum));
  if (!tabelaAno) return null;
  const faixas = tabelaAno[anoNum as keyof typeof tabelaAno][0];
  for (const key in faixas) {
    const faixa = (faixas as Record<string, typeof faixas[keyof typeof faixas]>)[key];
    if (
      (faixa.De === null || valor >= faixa.De) &&
      (faixa.Ate === null || valor <= faixa.Ate)
    ) {
      return faixa;
    }
  }
  return null;
  }

  const generalData = useMemo(() => {
  const map = new Map<string, GeneralRow>();
    for (const m of months) {
      map.set(m, {
        "VENC. BASE": 0,
        ADTS: 0,
        IPE: 0,
        // IRRF: 0,
        "TOTAL VANTAGENS AJUSTADA": 0,
        "TOTAL DESCONTOS": 0,
        "Desconto Previdência": 0,
        "Diferença": 0,
      });
    }
    // Somar vantagens relevantes (para exibição de rubricas)
    for (const a of advantagesOfYear) {
      const row = map.get(a.monthYear);
      if (!row) continue;
      // incluir apenas valores pagos no próprio mês de referência (on-time)
      if (a.paidMonthYear && a.paidMonthYear !== a.monthYear) continue;
      if (a.name === "VENC. BASE") row["VENC. BASE"] += a.amount;
      if (a.name === "ADTS") row["ADTS"] += a.amount;
      // total geral de vantagens não exibido mais
    }
    // Somar descontos relevantes (valores negativos): IPE e IRRF (+ IRRF 13º)
    for (const d of discountsOfYear) {
      const row = map.get(d.monthYear);
      if (!row) continue;
      // incluir apenas valores pagos no próprio mês de referência (on-time)
      if (d.paidMonthYear && d.paidMonthYear !== d.monthYear) continue;
      if (d.name === "IPE") row["IPE"] += d.amount;
      // if (d.name === "IRRF" || d.name === "IRRF 13º") row["IRRF"] += d.amount;
      row["TOTAL DESCONTOS"] += d.amount;
    }
    // Calcular Desconto Previdência
    for (const m of months) {
      const row = map.get(m);
      if (!row) continue;
      // Soma todas as vantagens exceto 'ADICIONAL DE FÉRIAS', 'FUNÇÃO GRATIFICADA' e itens judiciais
      let totalVantagens = 0;
      let totalVantagensAjustada = 0;
      for (const a of advantagesOfYear) {
        if (a.monthYear !== m) continue;
        if (a.paidMonthYear && a.paidMonthYear !== a.monthYear) continue;
        totalVantagens += a.amount;
  const lower = a.name.toLowerCase().trim();
  // Normalize to remove accents so we can compare in a robust way
  const normalized = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Allow exactly the phrase "VENCIMENTO POR DECISAO JUDICIAL" (accent-insensitive).
  // Any other field containing the word 'judicial' should NOT count for the previdência base.
  const allowedJudicial = normalized === "vencimento por decisao judicial";
  const isJudicial = /\bjudicial\b/.test(normalized) && !allowedJudicial;
  if (a.name === "ADICIONAL DE FÉRIAS" || a.name === "FUNÇÃO GRATIFICADA" || isJudicial) continue;
        totalVantagensAjustada += a.amount;
      }
      // store adjusted total for the row
      row["TOTAL VANTAGENS AJUSTADA"] = totalVantagensAjustada;
      // Use the adjusted total (excl. função gratificada, adicional de férias, itens judiciais)
      const faixa = getAliquotaFaixa(totalVantagensAjustada, selectedYear);
      let desconto: number | null = null;
      if (faixa && typeof faixa.percentual === "number") {
        desconto = totalVantagensAjustada * faixa.percentual;
        if (faixa.deduzir) desconto -= faixa.deduzir;
      }
      // store desconto as 0 for display when null, but keep null for logic
      row["Desconto Previdência"] = desconto ?? 0;
      // If desconto is not available, do not consider it for the difference calculation
      if (desconto !== null) {
        const diff = Math.abs(row["IPE"] || 0) - desconto;
        // If difference is negative, store null so UI can display a '-' indicator
        row["Diferença"] = diff > 0 ? diff : null;
      } else {
        row["Diferença"] = Math.abs(row["IPE"] || 0);
      }
    }
    return map;
  }, [months, advantagesOfYear, discountsOfYear, selectedYear]);

  // Build a map of general data for ALL months found in cache (not filtered by selectedYear)
  const allGeneralData = useMemo(() => {
    const map = new Map<string, GeneralRow>();
    const monthSet = new Set<string>();
    const addMonthFrom = (arr: Array<any> | undefined) => {
      if (!arr) return;
      for (const it of arr) {
        if (it?.monthYear && typeof it.monthYear === 'string') monthSet.add(it.monthYear);
        if (it?.paidMonthYear && typeof it.paidMonthYear === 'string') monthSet.add(it.paidMonthYear);
      }
    };
    addMonthFrom(cachedAdvantages);
    addMonthFrom(cachedDiscounts);

    // sort months by year then month
    const monthsAll = Array.from(monthSet).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      if (ya !== yb) return ya - yb;
      return ma - mb;
    });

    for (const m of monthsAll) {
      map.set(m, {
        "VENC. BASE": 0,
        ADTS: 0,
        IPE: 0,
        "TOTAL VANTAGENS AJUSTADA": 0,
        "TOTAL DESCONTOS": 0,
        "Desconto Previdência": 0,
        "Diferença": null,
      } as GeneralRow);
    }

    // Sum advantages into rows
    for (const a of cachedAdvantages) {
      if (!a?.monthYear) continue;
      const row = map.get(a.monthYear);
      if (!row) continue;
      if (a.paidMonthYear && a.paidMonthYear !== a.monthYear) continue;
      if (a.name === "VENC. BASE") row["VENC. BASE"] += a.amount;
      if (a.name === "ADTS") row["ADTS"] += a.amount;
    }

    // Sum discounts into rows
    for (const d of cachedDiscounts) {
      if (!d?.monthYear) continue;
      const row = map.get(d.monthYear);
      if (!row) continue;
      if (d.paidMonthYear && d.paidMonthYear !== d.monthYear) continue;
      if (d.name === "IPE") row["IPE"] += d.amount;
      row["TOTAL DESCONTOS"] += d.amount;
    }

    // Calculate adjusted totals, previdencia and diferença per month
    for (const m of Array.from(map.keys())) {
      const row = map.get(m)!;
      // calculate TOTAL VANTAGENS AJUSTADA by re-scanning advantages for that month
      let totalVantagensAjustada = 0;
      for (const a of cachedAdvantages) {
        if (a.monthYear !== m) continue;
        if (a.paidMonthYear && a.paidMonthYear !== a.monthYear) continue;
        const lower = a.name.toLowerCase().trim();
        const normalized = lower.normalize("NFD").replace(/[[\u0300-\u036f]]/g, "");
        const allowedJudicial = normalized === "vencimento por decisao judicial";
        const isJudicial = /\bjudicial\b/.test(normalized) && !allowedJudicial;
        if (a.name === "ADICIONAL DE FÉRIAS" || a.name === "FUNÇÃO GRATIFICADA" || isJudicial) continue;
        totalVantagensAjustada += a.amount;
      }
      row["TOTAL VANTAGENS AJUSTADA"] = totalVantagensAjustada;

      const year = m.split('/')[1];
      const faixa = getAliquotaFaixa(totalVantagensAjustada, year);
      let desconto: number | null = null;
      if (faixa && typeof faixa.percentual === "number") {
        desconto = totalVantagensAjustada * faixa.percentual;
        if (faixa.deduzir) desconto -= faixa.deduzir;
      }
      row["Desconto Previdência"] = desconto ?? 0;
      if (desconto !== null) {
        const diff = Math.abs(row["IPE"] || 0) - desconto;
        row["Diferença"] = diff > 0 ? diff : null;
      } else {
        row["Diferença"] = Math.abs(row["IPE"] || 0);
      }
    }

    return map;
  }, [cachedAdvantages, cachedDiscounts]);

  const formatBRL = (v?: number | null) => {
    if (v === null) return "-";
    return typeof v === "number" && !isNaN(v) && v !== 0
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "";
  };

  // Render a currency cell. If value is negative, show the absolute value in red
  // (the user requested discounts be shown in red instead of with a '-' sign).
  const renderCurrencyCell = (v?: number | null, subdued: boolean = false) => {
    if (v === null) return "-";
    // negative values shown as absolute but red; use a faded red when subdued
    if (typeof v === "number" && v < 0) {
      const redClass = subdued ? "text-red-400" : "text-red-600";
      return <span className={redClass}>{formatBRL(Math.abs(v))}</span>;
    }
    // for subdued (prescription-excluded) positive/zero values, show them muted
    if (subdued) return <span className="text-gray-400">{formatBRL(v as number | undefined)}</span>;
    return formatBRL(v as number | undefined);
  };

  // (removido: cálculo global de diferença independente do ano)

  // Soma da Diferença para os anos encontrados no PDF (independe do ano selecionado)
  const totalDiferencaAnosEncontrados = useMemo(() => {
    // Only consider months within the last 5 years (prescription window).
    // Example: if today is Oct 30, 2025, cutoff is Oct 2020 — include Oct..Dec 2020 and all months after.
    const now = new Date();
    const cutoff = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    const cutoffYear = cutoff.getFullYear();
    const cutoffMonth = cutoff.getMonth() + 1; // 1-based month

    const yearlyTotals = new Map<number, number>();
    for (const m of Array.from(allGeneralData.keys())) {
      const parts = m.split('/').map((p) => Number(p));
      if (parts.length !== 2) continue;
      const [mm, yyyy] = parts;
      if (isNaN(mm) || isNaN(yyyy)) continue;
      // include month if it's after cutoff (strictly greater year) or same year and month >= cutoffMonth
      if (yyyy > cutoffYear || (yyyy === cutoffYear && mm >= cutoffMonth)) {
        const row = allGeneralData.get(m);
        const val = row && typeof row['Diferença'] === 'number' ? (row['Diferença'] as number) : 0;
        yearlyTotals.set(yyyy, (yearlyTotals.get(yyyy) || 0) + val);
      }
    }

    let total = 0;
    for (const v of yearlyTotals.values()) total += v;
    return total;
  }, [allGeneralData, extractedYears]);

  // Soma da Diferença para o ano atualmente selecionado (usada em IPE devido)
  const ipeDevidoSelectedYear = useMemo(() => {
    let total = 0;
    for (const m of months) {
      const row = generalData.get(m);
      if (!row) continue;
      const diff = row["Diferença"];
      if (typeof diff === "number" && !isNaN(diff)) total += diff;
    }
    return total;
  }, [months, generalData]);

  // Se não houver nada em cache, mostra apenas a tela de upload
  if (!cacheLoading && !cacheError && cachedCpf == null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-8 flex flex-col items-center">
          {/* <h2 className="text-gray-800 text-2xl font-bold mb-4">Upload de PDF</h2> */}
          <div className="w-full">
            <Upload
              embedded
              multiple
              onUploadComplete={async (fileName?: string) => {
                try {
                  if (fileName) setUploadedFileName(fileName);
                  await loadLatestCache(); // Reload cache after upload
                } catch (error) {
                  console.error("Failed to reload cache after upload:", error);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Update the return block to show a loading indicator during cache verification
  if (isVerifyingCache) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="text-gray-700 text-lg font-medium">Verificando cache...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1300px] xl:max-w-[1600px] mx-auto px-4">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">
              Último upload
            </h2>
            <div className="text-md text-gray-500 mt-1">
              {cachedUserInfo
                ? `${cachedUserInfo.name} - ${cachedUserInfo.cpf}`
                : "Nenhum usuário selecionado"}
            </div>
          </div>
          {/* <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">+ Add</button>
        </div> */}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] lg:grid-cols-[5fr_2fr] xl:grid-cols-[6fr_2fr] gap-6 xl:gap-8">
          <main className="md:col-start-1">
            {/* cards row (coluna 1) */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 xl:gap-8 mb-6">
              <div className="w-full">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1A16F3] to-[#0F0D8D] shadow-lg text-white h-28 flex flex-col justify-between">
                  <div className="text-sm font-medium">
                    {(() => {
                      if (extractedYears.length === 0) return 'Diferença total';
                      const nums = extractedYears.map((y) => Number(y)).filter((n) => !isNaN(n));
                      if (nums.length === 1) return `Diferença total (${nums[0]})`;
                      const min = Math.min(...nums);
                      const max = Math.max(...nums);
                      return `Total (${min}–${max})`;
                    })()}
                  </div>
                  <div className="text-2xl font-extrabold">{formatBRL(totalDiferencaAnosEncontrados)}</div>
                </div>
              </div>
              <div className="w-full">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-[#E0DFFF] to-[#E6E6FB] shadow text-[#0F0D8D] h-24 flex flex-col justify-center">
                    <div className="text-sm font-medium">IPE pago ({selectedYear})</div>
                    <div className=" text-xl font-bold">{formatBRL(
                      // Sum absolute IPE values for the selected year across all months
                      ((): number => {
                        let total = 0;
                        for (const m of months) {
                          const row = generalData.get(m);
                          if (!row) continue;
                          const v = row["IPE"] || 0;
                          total += Math.abs(v);
                        }
                        return total;
                      })()
                    )}</div>
                </div>
              </div>
              <div className="w-full">
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[#E0DFFF] to-[#E6E6FB] shadow text-[#0F0D8D] h-24 flex flex-col justify-center">
                  <div className="text-sm font-medium">Diferença ({selectedYear})</div>
                  <div className=" text-xl font-bold">{formatBRL(ipeDevidoSelectedYear)}</div>
                </div>
              </div>
            </div>
            <nav className="flex items-end gap-6 border-b ml-3">
              <button
                type="button"
                onClick={() => setViewMode("general")}
                className={`relative pb-2 text-sm transition-colors ${
                  viewMode === "general"
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Geral
                {viewMode === "general" && (
                  <span className="absolute left-0 right-0 -bottom-[2px] h-0.5 bg-[#1A16F3] rounded"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("advantages")}
                className={`relative pb-2 text-sm transition-colors ${
                  viewMode === "advantages"
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Vantagens
                {viewMode === "advantages" && (
                  <span className="absolute left-0 right-0 -bottom-[2px] h-0.5 bg-[#1A16F3] rounded"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("discounts")}
                className={`relative pb-2 text-sm transition-colors ${
                  viewMode === "discounts"
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Descontos
                {viewMode === "discounts" && (
                  <span className="absolute left-0 right-0 -bottom-[2px] h-0.5 bg-[#1A16F3] rounded"></span>
                )}
              </button>
            </nav>
            <section className="bg-white rounded-2xl shadow p-6 min-h-[420px]">
              <div className="flex items-center justify-between mb-4">
                <div className=" items-center gap-3 flex-wrap">
                  <h3 className="text-gray-700 font-semibold">
                    Lista de dados
                  </h3>
                  <div className="flex items-center gap-2"></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        if (uploadedFileName) {
                          await pdfCacheService.downloadExcelByFileName(uploadedFileName);
                        } else if (cachedCpf) {
                          // If we don't have a pre-saved filename, generate/download from the cached CPF
                          await pdfCacheService.downloadExcelByCpf(cachedCpf);
                        } else {
                          window.alert('Nenhum arquivo disponível para download. Faça upload primeiro ou selecione um usuário em cache.');
                        }
                      } catch (err) {
                        console.error('Erro ao baixar arquivo:', err);
                        window.alert('Falha ao baixar arquivo. Veja o console para detalhes.');
                      }
                    }}
                    className=" text-sm px-3 py-1 border bg-[#1A16F3] border-[#1A16F3] rounded-md text-[#ffffff] hover:bg-[#120fcf] hover:text-white transition-colors"
                  >
                    Baixar
                  </button>
                  <div className="mr-2">
                      <select
                      id="ano"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="text-xs px-2 py-1 bg-white border border-[#1A16F3] rounded-md text-[#1A16F3] hover:bg-[#e2e2ff] hover:text-[#1A16F3] transition-colors"
                    >
                      {(extractedYears.length ? extractedYears : [String(new Date().getFullYear())]).map((y: string) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr className="text-xs text-gray-500">
                      <th className="py-3 px-4 border-b">Mês/Ano</th>
                      {(viewMode === "general"
                        ? generalCols
                        : uniqueCols
                      ).map((col) => (
                        <th key={col as string} className="py-3 px-4 border-b">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {cacheLoading && (
                      <tr>
                        <td
                          className="py-3 px-4 text-center text-gray-500"
                          colSpan={
                            1 +
                            (viewMode === "general"
                              ? generalCols.length
                              : uniqueCols.length)
                          }
                        >
                          Carregando dados do último upload...
                        </td>
                      </tr>
                    )}
                    {cacheError && (
                      <tr>
                        <td
                          className="py-3 px-4 text-center text-red-600"
                          colSpan={
                            1 +
                            (viewMode === "general"
                              ? generalCols.length
                              : uniqueCols.length)
                          }
                        >
                          {cacheError}
                        </td>
                      </tr>
                    )}
                    {/* Quando não há cache, a página faz early-return e mostra apenas a tela de upload */}

                    {/* Render rows per month depending on viewMode */}
                    {!cacheLoading &&
                      !cacheError &&
                      cachedCpf &&
                      <>
                        {months.map((m) => {
                          // determine if this month falls outside the 5-year cutoff (prescription)
                          const [mmStr, yyStr] = m.split('/');
                          const mmNum = Number(mmStr);
                          const yyNum = Number(yyStr);
                          const isExcludedByPrescription =
                            !isNaN(mmNum) && !isNaN(yyNum) && (yyNum < cutoff.year || (yyNum === cutoff.year && mmNum < cutoff.month));

                          if (viewMode === "general") {
                            const row = generalData.get(m);
                            const trClass = `h-12 border-b last:border-b-0 ${isExcludedByPrescription ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}`;
                            return (
                              <tr
                                key={m}
                                className={trClass}
                              >
                                <td className="py-3 px-4">{m}</td>
                                {generalCols.map((col) => (
                                  <td key={col} className="py-3 px-4">
                                    {renderCurrencyCell(row ? row[col] : 0, isExcludedByPrescription)}
                                  </td>
                                ))}
                              </tr>
                            );
                          }

                          // For advantages or discounts: aggregate per-month by rubrica name
                          const values = new Map<string, number>();
                          if (viewMode === "advantages") {
                            for (const a of advantagesOfYear) {
                              if (a.monthYear !== m) continue;
                              // Only include positive amounts (should be advantages)
                              if (
                                typeof a.amount !== "number" ||
                                isNaN(a.amount)
                              )
                                continue;
                              values.set(
                                a.name,
                                (values.get(a.name) || 0) + a.amount
                              );
                            }
                          } else {
                            for (const d of discountsOfYear) {
                              if (d.monthYear !== m) continue;
                              if (
                                typeof d.amount !== "number" ||
                                isNaN(d.amount)
                              )
                                continue;
                              values.set(
                                d.name,
                                (values.get(d.name) || 0) + d.amount
                              );
                            }
                          }

                          const trClassOther = `h-12 border-b last:border-b-0 ${isExcludedByPrescription ? 'bg-gray-50 text-gray-400' : ''}`;
                          return (
                            <tr
                              key={m}
                              className={trClassOther}
                            >
                              <td className="pr-6">{m}</td>
                              {uniqueCols.map((col) => (
                                <td key={col} className="pr-6">
                                  {renderCurrencyCell(values.get(col), isExcludedByPrescription)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        {/* Linha TOTAL para aba Geral */}
                        {viewMode === "general" && (
                          <tr className="font-bold bg-gray-50 border-t">
                            <td className="pr-6 text-center">TOTAL</td>
                            {generalCols.map((col) => (
                                <td key={col} className="pr-6">
                                  {col === "Diferença"
                                    ? renderCurrencyCell(
                                        months.reduce((acc, m) => {
                                          const row = generalData.get(m);
                                          return acc + (row ? row["Diferença"] || 0 : 0);
                                        }, 0)
                                      )
                                    : col === "TOTAL VANTAGENS AJUSTADA"
                                    ? renderCurrencyCell(
                                        months.reduce((acc, m) => {
                                          const row = generalData.get(m);
                                          return acc + (row ? row["TOTAL VANTAGENS AJUSTADA"] || 0 : 0);
                                        }, 0)
                                      )
                                    : ""}
                                </td>
                              ))}
                          </tr>
                        )}
                      </>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          <aside className="bg-white rounded-2xl shadow p-4 md:col-start-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-700 font-semibold">Clientes</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-xs px-3 py-1 bg-[#1A16F3] text-white rounded transition-transform transform hover:scale-105 hover:bg-[#120fcf] focus:ring-2 focus:ring-offset-2 focus:ring-[#1A16F3]"
                  aria-label="Upload PDF"
                >
                  Upload PDF
                </button>
                <div className="relative group">
                  <button
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded border border-red-300 hover:bg-red-200"
                    onClick={async () => {
                      try {
                        await pdfCacheService.clearCache(); // Clear cache on the device
                        setCachedCpf(null);
                        setCachedAdvantages([]);
                        setCachedDiscounts([]);
                        setCachedUserInfo(null);
                      } catch (error) {
                        console.error("Failed to clear cache:", error);
                      }
                    }}
                    aria-label="Clear cache"
                  >
                    Limpar cache
                  </button>
                  <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-max bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clear all cached data
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-auto pr-2">
              {/* DB users */}
              {/* Using only cached uploads; no DB users displayed */}
              {/* {!loading && !error && users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))} */}

              {/* Cached uploads */}
              <CachedUsersPanel
                onSelect={loadCacheByCpf}
                selectedCpf={cachedCpf || undefined}
              />
            </div>
          </aside>
        </div>
      </div>
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowUploadModal(false);
              loadLatestCache(); // Ensure cache reloads after modal closes
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-gray-800 font-semibold">Upload de PDF</h5>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  loadLatestCache(); // Reload cache after upload
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <Upload
              embedded
              multiple
              onUploadComplete={async (fileName?: string) => {
                try {
                  if (fileName) setUploadedFileName(fileName);
                  await loadLatestCache(); // Reload cache after successful upload
                  // no DB users to refresh anymore
                } catch (error) {
                  console.error("Failed to update client list after upload:", error);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Fix CachedUsersPanel to return valid JSX
function CachedUsersPanel({
  onSelect,
  selectedCpf,
}: {
  onSelect?: (cpf: string) => void;
  selectedCpf?: string;
}) {
  const [items, setItems] = useState<CachedUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await pdfCacheService.listCachedUsers();
      setItems(data);
      setError(null);
    } catch (e) {
      setError("Erro ao carregar dados em cache");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando dados em cache...</div>;
  }
  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }
  if (items.length === 0) {
    return <div className="text-sm text-gray-500">Nenhum dado em cache.</div>;
  }

  return (
    <div className="space-y-2">
      <hr />
      {items.map((it) => (
        <button
          key={it.cpf}
          type="button"
          onClick={() => onSelect && onSelect(it.cpf)}
          className={`w-full text-left p-2 border-b rounded-lg hover:bg-gray-50 text-sm ${
            selectedCpf === it.cpf ? "bg-indigo-50 border-indigo-200" : ""
          }`}
        >
          <div className="font-medium text-gray-800">{it.name}</div>
          <div className="text-xs text-gray-500">
            CPF: {it.cpf} • Matrícula: {it.matricula}
          </div>
        </button>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={load} className="text-xs px-2 py-1 border rounded">
          Atualizar
        </button>
      </div>
    </div>
  );
}
