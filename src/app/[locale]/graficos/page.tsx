"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Others/Container";
import { ProtectedRoute } from "@/components/layout/Others/ProtectedRoute";
import { getReviewsByDate, getPopularMedia, getUsersGrowth } from "@/services/admin/admin";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";
import { resolveMediaTitle } from "@/services/graficos/graficos";
import { useTranslations } from "next-intl";

// Recharts
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/** cache in-memory durante a sessão do cliente */
const titleCache = new Map<string, string | null>();

export default function AdminChartsPage() {
  const t = useTranslations("AdminCharts");

  return (
    <ProtectedRoute
      requiredRole="ADMIN"
      redirectTo="/auth"
      onNoRole={
        <Container>
          <div className="py-12 text-center">
            <div className="max-w-md mx-auto bg-zinc-900/60 border border-rose-600 rounded-lg p-8 shadow">
              <h2 className="text-2xl font-semibold text-rose-300">{t("accessDenied.title")}</h2>
              <p className="mt-2 text-sm text-rose-200/80">{t("accessDenied.description")}</p>
            </div>
          </div>
        </Container>
      }
    >
      <Container>
        <div className="py-12">
          <div className="flex items-center justify-between mb-6">
            <Link href="/admin" className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition">
              {t("backToAdmin")}
            </Link>
          </div>

          <ChartsPanel />
        </div>
      </Container>
    </ProtectedRoute>
  );
}

// Paleta coerente
const CHART_COLORS = {
  primary: "#7C3AED", // filme - violet
  secondary: "#06B6D4", // série - cyan
  accent: "#FB923C", // álbum - orange
  muted: "#60A5FA", // fallback
  pastel: "#A78BFA", // fallback
};
const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.muted, CHART_COLORS.pastel];

function ChartsPanel() {
  const t = useTranslations("AdminCharts");
  const locale = useLocale();

  const [loading, setLoading] = useState(false);
  const [usersGrowth, setUsersGrowth] = useState<any[]>([]);
  const [reviewsByDate, setReviewsByDate] = useState<any[]>([]);
  const [popularMedia, setPopularMedia] = useState<any[]>([]);

  // hovered index for review bars (controls opacity)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // load all three datasets in parallel, then enrich popularMedia titles in parallel (with caching)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // fetch base datasets in parallel
        const [ug, rv, pm] = await Promise.all([
          getUsersGrowth().catch((e) => {
            console.warn("getUsersGrowth failed", e);
            return [];
          }),
          getReviewsByDate().catch((e) => {
            console.warn("getReviewsByDate failed", e);
            return [];
          }),
          getPopularMedia().catch((e) => {
            console.warn("getPopularMedia failed", e);
            return [];
          }),
        ]);

        if (!mounted) return;

        setUsersGrowth(Array.isArray(ug) ? ug : []);
        setReviewsByDate(Array.isArray(rv) ? rv : []);

        // If no popular media, set empty and exit
        if (!Array.isArray(pm) || pm.length === 0) {
          setPopularMedia([]);
          return;
        }

        // Enrich titles in parallel, but only when needed. Use cache and request locale.
        const enriched = await Promise.all(
          pm.map(async (p: any) => {
            try {
              const title = await resolveMediaTitle(p, locale);
              return { ...(p || {}), title: title ?? (p.title || p.name || `${p.mediaType}:${p.mediaId}`) };
            } catch (e) {
              console.warn("resolveMediaTitle failed for", p, e);
              return { ...(p || {}), title: p.title || p.name || `${p.mediaType}:${p.mediaId}` };
            }
          })
        );

        if (!mounted) return;
        setPopularMedia(Array.isArray(enriched) ? enriched : []);
      } catch (err) {
        console.error(err);
        toast.error(t("errors.loadCharts"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // Refetch when locale changes so we can present titles in the new locale (cache mitigates slowness)
  }, [locale, t]);

  // Normaliza séries temporais (aceita month/date/total etc.)
  const normalizeTimeSeries = (arr: any[]) =>
    (arr || []).map((x) => ({
      date: x?.month ?? x?.date ?? x?.day ?? x?.key ?? x?.label ?? String((x && x[0]) || ""),
      count: Number(x?.total ?? x?.count ?? x?.value ?? (Array.isArray(x) ? x[1] : 0) ?? 0),
    }));

  const usersGrowthData = normalizeTimeSeries(usersGrowth);
  const reviewsData = normalizeTimeSeries(reviewsByDate);

  // garante name string, ordena e pega top 10, adiciona displayName com tipo e color por mediaType
  const pieData = (popularMedia || [])
    .map((p: any) => {
      const typeRaw = (p.mediaType || "").toString().toUpperCase();
      const typeNorm = typeRaw === "MOVIE" ? "MOVIE" : typeRaw === "SERIES" || typeRaw === "TV" ? "SERIES" : typeRaw === "ALBUM" ? "ALBUM" : "OTHER";
      const title = String(p.title || p.name || `${p.mediaType}:${p.mediaId}`);
      // usa tradução para label de tipo
      const typeLabel =
        typeNorm === "MOVIE"
          ? t("mediaType.movie")
          : typeNorm === "SERIES"
          ? t("mediaType.series")
          : typeNorm === "ALBUM"
          ? t("mediaType.album")
          : t("mediaType.other");
      return { name: title, displayName: `${typeLabel}: ${title}`, value: Number(p?.total ?? p?.count ?? p?.value ?? 0), mediaType: typeNorm };
    })
    .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 10)
    .map((item: any, idx: number) => ({
      ...item,
      color:
        item.mediaType === "MOVIE"
          ? CHART_COLORS.primary
          : item.mediaType === "SERIES"
          ? CHART_COLORS.secondary
          : item.mediaType === "ALBUM"
          ? CHART_COLORS.accent
          : COLORS[idx % COLORS.length],
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mídias mais populares (moved to top-left) */}
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 p-5 rounded-2xl shadow-lg border border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold">{t("popularMedia.title")}</h4>
              <p className="text-xs text-zinc-400">{t("popularMedia.subtitle")}</p>
            </div>
            <div className="text-sm font-medium text-zinc-300">{t("popularMedia.items", { count: pieData.length })}</div>
          </div>

          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={pieData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid stroke="#334155" strokeOpacity={0.05} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} domain={[0, "dataMax"]} tickCount={6} tickFormatter={(v: any) => String(Math.round(Number(v)))} />
                <YAxis dataKey="displayName" type="category" width={240} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip formatter={(value: any, name: any, entry: any) => [value, entry?.payload?.displayName ?? name]} />
                <Bar dataKey="value" barSize={16} radius={[8, 8, 8, 8]}>
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reviews por data */}
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 p-5 rounded-2xl shadow-lg border border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold">{t("reviewsByDate.title")}</h4>
              <p className="text-xs text-zinc-400">{t("reviewsByDate.subtitle")}</p>
            </div>
            <div className="text-sm font-medium text-zinc-300">{t("reviewsByDate.total", { total: reviewsData.reduce((s, it) => s + Number(it.count || 0), 0) })}</div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={reviewsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="#334155" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 6, boxShadow: "0 6px 18px rgba(2,6,23,0.4)" }} />
                <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={14}>
                  {reviewsData.map((entry, index) => {
                    const baseFill = COLORS[index % COLORS.length];
                    const opacity = hoveredBarIndex === null ? 1 : hoveredBarIndex === index ? 1 : 0.45;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={baseFill}
                        fillOpacity={opacity}
                        onMouseEnter={() => setHoveredBarIndex(index)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Crescimento de usuários (moved below, full width) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 p-5 rounded-2xl shadow-lg border border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold">{t("usersGrowth.title")}</h4>
              <p className="text-xs text-zinc-400">{t("usersGrowth.subtitle")}</p>
            </div>
            <div className="text-sm font-medium text-zinc-300">{t("usersGrowth.total", { total: usersGrowthData.reduce((s, it) => s + Number(it.count || 0), 0) })}</div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={usersGrowthData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeOpacity={0.06} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, boxShadow: "0 6px 18px rgba(2,6,23,0.6)" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  strokeLinecap="round"
                  fill="url(#lg1)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-emerald-300">{t("loading")}</div>}
    </div>
  );
}