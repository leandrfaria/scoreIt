'use client';

import { useEffect, useState } from 'react';
import { fetchSeriesByPage } from '@/services/series/series_list';
import { Series } from '@/types/Series';
import { SeriesCard } from '@/components/features/serie/SeriesCard';
import { useTranslations } from 'next-intl';

export function SeriesList() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');
  const t = useTranslations('MovieList'); // Reutilizando traduções de filmes
  const maxPage = 500;

  useEffect(() => {
    const getSeries = async () => {
      setLoading(true);
      const seriesData = await fetchSeriesByPage(page);
      setSeries(seriesData);
      setLoading(false);
    };

    getSeries();
  }, [page]);

  const handlePageChange = () => {
    const newPage = Number(inputPage);
    if (!isNaN(newPage) && newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
    } else {
      setInputPage(String(page));
    }
  };

  const handleArrowClick = (direction: 'prev' | 'next') => {
    const newPage = direction === 'prev' ? page - 1 : page + 1;
    if (newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
      setInputPage(String(newPage));
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-white">{t('loading')}</p>;
  }

  if (series.length === 0) {
    return <p className="text-center mt-10 text-white">{t('noMoviesFound')}</p>;
  }

  return (
    <>
      <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
        {series.map((serie) => (
          <SeriesCard key={serie.id} {...serie} />
        ))}
      </section>

      <div className="flex justify-center items-center gap-2 mt-10 mb-20 text-white">
        <span className="text-white text-base">{t("ChoosePage")}</span>

        <button
          onClick={() => handleArrowClick('prev')}
          className="text-darkgreen text-3xl hover:scale-110 transition"
        >
          {'<'}
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePageChange()}
          onBlur={handlePageChange}
          className="w-16 h-10 text-white text-center rounded-md border outline-none border-darkgreen"
          style={{
            backgroundColor: 'transparent',
            appearance: 'none',
          }}
        />

        <button
          onClick={() => handleArrowClick('next')}
          className="text-darkgreen text-3xl hover:scale-110 transition"
        >
          {'>'}
        </button>
      </div>
    </>
  );
}
