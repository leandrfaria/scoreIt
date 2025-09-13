"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSeriesByPage, fetchGenres } from "@/services/series/series_list";
import { Series } from "@/types/Series";
import { SeriesCard } from "@/components/features/serie/SeriesCard";
import { useTranslations, useLocale } from "next-intl";
import { FaSearch } from "react-icons/fa";
import { X } from "lucide-react";

function GridSkeleton() {
  return (
    <section className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-[180px] sm:max-w-[190px] rounded-xl overflow-hidden shadow-lg"
          style={{ contentVisibility: "auto", containIntrinsicSize: "270px 180px" }}
        >
          <div className="relative w-full aspect-[2/3] bg-neutral-900 animate-pulse" />
        </div>
      ))}
    </section>
  );
}

export function SeriesList() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const t = useTranslations("SeriesList");
  const locale = useLocale(); // pega o locale atual do next-intl
  const maxPage = 500;
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);

  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => 2025 - i), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // debounce da busca
  useEffect(() => {
    const delay = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // carregar gêneros com base no locale
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const genresData = await fetchGenres(locale); // <-- passa locale
        if (!cancelled) setGenres(genresData);
      } catch (error) {
        if (!cancelled) console.error(t("errorProcessingGenres"), error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // carregar séries com base no locale, filtros e página
  useEffect(() => {
    let cancelled = false;
    const myId = ++requestIdRef.current;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchSeriesByPage(
          page,
          selectedYear ? parseInt(selectedYear) : undefined,
          selectedGenre ? parseInt(selectedGenre) : undefined,
          debouncedSearchTerm || undefined,
          { locale, signal: undefined } // <-- passa locale
        );
        if (!cancelled && myId === requestIdRef.current) {
          setSeries(data);
        }
      } catch (error) {
        if (!cancelled) console.error(t("errorProcessingSeries"), error);
      } finally {
        if (!cancelled && myId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, selectedYear, selectedGenre, debouncedSearchTerm, locale]);

  const handlePageChange = () => {
    const newPage = Number(inputPage);
    if (!isNaN(newPage) && newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
    } else {
      setInputPage(String(page));
    }
  };

  const handleArrowClick = (direction: "prev" | "next") => {
    const newPage = direction === "prev" ? page - 1 : page + 1;
    if (newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
      setInputPage(String(newPage));
    }
  };

  const clearFilters = () => {
    setSelectedYear("");
    setSelectedGenre("");
  };

  return (
    <>
      {/* Desktop/Tablet filters */}
      <div className="hidden sm:flex items-center mb-6 gap-4">
        <button
          onClick={() => {
            setIsSearchVisible((v) => !v);
            setTimeout(() => searchRef.current?.focus(), 0);
          }}
          className="focus:outline-none bg-neutral-800 rounded-md p-2"
          aria-label={t("openSearch")}
        >
          <FaSearch className="text-white w-5 h-5" />
        </button>

        <div
          className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? "w-64" : "w-0"}`}
          aria-hidden={!isSearchVisible}
        >
          <input
            type="text"
            ref={searchRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t("searchSeries")}
            className="px-3 py-2 rounded-md border border-darkgreen focus:outline-none w-full text-lightgreen bg-black placeholder:text-neutral-400"
            aria-label={t("searchSeries")}
          />
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 rounded-md border border-darkgreen focus:outline-none bg-black text-lightgreen"
          aria-label={t("Years")}
        >
          <option value="">{t("Years")}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-3 py-2 rounded-md border border-darkgreen focus:outline-none bg-black text-lightgreen"
          aria-label={t("Genres")}
        >
          <option value="">{t("Genres")}</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        {(selectedYear || selectedGenre) && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-lightgreen underline underline-offset-4"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Mobile filters */}
      <div className="sm:hidden mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-neutral-800 rounded-md p-2">
            <FaSearch className="text-white w-4 h-4" />
          </div>
          <input
            type="text"
            ref={mobileSearchRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t("searchSeries")}
            className="flex-1 px-3 py-2 rounded-md border border-darkgreen focus:outline-none text-lightgreen bg-black placeholder:text-neutral-500"
            aria-label={t("searchSeries")}
          />
        </div>

        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full px-3 py-2 rounded-md bg-neutral-800 text-white border border-darkgreen"
          aria-label={t("openFilters")}
        >
          {t("filters")}
        </button>
      </div>

      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden
          />
          <div
            className="fixed z-50 left-0 right-0 bottom-0 bg-neutral-900 border-t border-neutral-700 rounded-t-2xl p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t("filters")}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">{t("filters")}</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-neutral-300"
                aria-label={t("close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">{t("Years")}</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-darkgreen focus:outline-none bg-black text-lightgreen"
                  aria-label={t("Years")}
                >
                  <option value="">{t("Years")}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-300 mb-1">{t("Genres")}</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-darkgreen focus:outline-none bg-black text-lightgreen"
                  aria-label={t("Genres")}
                >
                  <option value="">{t("Genres")}</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-sm text-lightgreen underline underline-offset-4"
              >
                {t("clear")}
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="px-4 py-2 rounded-md bg-darkgreen text-white hover:brightness-110 transition"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <GridSkeleton />
      ) : series.length === 0 ? (
        <p className="text-center mt-10 text-white">{t("noSeriesFound")}</p>
      ) : (
        <section
          className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center"
          aria-live="polite"
        >
          {series.map((serie) => (
            <div key={serie.id} className="flex justify-center">
              <SeriesCard {...serie} />
            </div>
          ))}
        </section>
      )}

      <div className="flex justify-center items-center gap-2 mt-8 sm:mt-10 mb-20 text-white">
        <span className="text-white text-sm sm:text-base">{t("choosePage")}</span>
        <button
          onClick={() => handleArrowClick("prev")}
          className="text-darkgreen text-2xl sm:text-3xl hover:scale-110 transition"
          aria-label={t("previousPage")}
        >
          {"<"}
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePageChange()}
          onBlur={handlePageChange}
          className="w-14 sm:w-16 h-10 text-white text-center rounded-md border outline-none border-darkgreen bg-transparent"
          aria-label={t("selectPage")}
        />
        <button
          onClick={() => handleArrowClick("next")}
          className="text-darkgreen text-2xl sm:text-3xl hover:scale-110 transition"
          aria-label={t("nextPage")}
        >
          {">"}
        </button>
      </div>
    </>
  );
}
