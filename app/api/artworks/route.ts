import { NextRequest, NextResponse } from 'next/server';
import { artworks } from '@/lib/data';

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const style = searchParams.get('style');

  const filtered = artworks.filter((item) => {
    const categoryMatch = category ? item.category === category : true;
    const styleMatch = style ? item.style === style : true;
    return categoryMatch && styleMatch;
  });

  return NextResponse.json({ count: filtered.length, items: filtered });
}
