export type Artwork = {
  id: string;
  title: string;
  category: 'Streetwear' | 'Sportswear' | 'Luxury' | 'Casual';
  season: 'Spring/Summer' | 'Fall/Winter' | 'Resort';
  style: 'Illustration' | 'Photoreal' | 'Typography' | 'Pattern';
  description: string;
  score: number;
};
