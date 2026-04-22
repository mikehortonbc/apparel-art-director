import { ArtworkGrid } from '@/components/artwork-grid';
import { BriefForm } from '@/components/brief-form';
import { artworks } from '@/lib/data';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Apparel Art Director</p>
        <h1>Build launch-ready visual directions in minutes</h1>
        <p>
          Explore scored concepts, filter by category and style, then capture a brief for the next
          campaign.
        </p>
      </section>

      <ArtworkGrid items={artworks} />
      <BriefForm />
    </main>
  );
}
