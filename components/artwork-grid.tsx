'use client';

import { useMemo, useState } from 'react';
import { Artwork } from '@/lib/types';
import { Filters } from './filters';

type ArtworkGridProps = {
  items: Artwork[];
};

export function ArtworkGrid({ items }: ArtworkGridProps) {
  const [category, setCategory] = useState('All');
  const [style, setStyle] = useState('All');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => (category === 'All' ? true : item.category === category))
      .filter((item) => (style === 'All' ? true : item.style === style))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [category, style, query, items]);

  const toggleFavorite = (id: string) => {
    setFavorites((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id],
    );
  };

  return (
    <>
      <Filters
        category={category}
        style={style}
        query={query}
        onCategoryChange={setCategory}
        onStyleChange={setStyle}
        onQueryChange={setQuery}
      />
      <div className="grid">
        {filtered.map((item) => {
          const isFavorite = favorites.includes(item.id);

          return (
            <article key={item.id} className="card">
              <header>
                <h3>{item.title}</h3>
                <span>{item.score}/100</span>
              </header>
              <p>{item.description}</p>
              <ul>
                <li>{item.category}</li>
                <li>{item.season}</li>
                <li>{item.style}</li>
              </ul>
              <button type="button" onClick={() => toggleFavorite(item.id)}>
                {isFavorite ? '★ Saved' : '☆ Save direction'}
              </button>
            </article>
          );
        })}
      </div>
      {!filtered.length && <p className="empty">No concepts match the current filters.</p>}
    </>
  );
}
