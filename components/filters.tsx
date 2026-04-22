'use client';

import { ChangeEvent } from 'react';

type FiltersProps = {
  category: string;
  style: string;
  query: string;
  onCategoryChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onQueryChange: (value: string) => void;
};

const categories = ['All', 'Streetwear', 'Sportswear', 'Luxury', 'Casual'];
const styles = ['All', 'Illustration', 'Photoreal', 'Typography', 'Pattern'];

export function Filters({
  category,
  style,
  query,
  onCategoryChange,
  onStyleChange,
  onQueryChange,
}: FiltersProps) {
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <section className="filters" aria-label="Artwork filters">
      <input
        type="search"
        value={query}
        onChange={onInput}
        placeholder="Search by title or description"
      />
      <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
        {categories.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <select value={style} onChange={(event) => onStyleChange(event.target.value)}>
        {styles.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </section>
  );
}
