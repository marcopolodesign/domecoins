import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Use the official Pokemon TCG API
    const url = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=20`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pokemon TCG API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match our expected format
    const transformedItems = data.data?.map((card: any) => ({
      name: card.name,
      detailUrl: card.tcgplayer?.url || `https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/${card.id}`,
      imageUrl: card.images?.large || card.images?.small || '/placeholder-card.svg',
      categoryName: card.set?.name || 'Unknown Set',
      offers: card.tcgplayer?.prices?.normal?.market ? [`$${card.tcgplayer.prices.normal.market}`] : ['Price N/A'],
      provider: 'Pokemon TCG API',
      rarity: card.rarity,
      setId: card.set?.id,
      cardId: card.id
    })) || [];

    const transformedResponse = {
      items: transformedItems,
      total: transformedItems.length,
      providers: ['pokemon-tcg-api', 'tcgplayer'],
      games: [
        { id: "pokemon", name: "Pokémon" }
      ]
    };
    
    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Error fetching from Pokemon TCG API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}

