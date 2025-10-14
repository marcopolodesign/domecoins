# Pokémon TCG Data Sync Scripts

This directory contains utility scripts for managing Pokémon TCG data.

## sync-pokemon-data.js

Downloads all Pokémon TCG cards, sets, and metadata from the official [Pokémon TCG API](https://docs.pokemontcg.io/) and saves them locally as JSON files.

### Prerequisites

1. **Get an API Key** (highly recommended):
   - Visit https://dev.pokemontcg.io/
   - Register for a free API key
   - Add it to your `.env.local` file:
     ```bash
     POKEMON_TCG_API_KEY=your-api-key-here
     ```

2. **Rate Limits**:
   - **Without API key**: 1,000 requests/day
   - **With API key**: 20,000 requests/day

### Usage

```bash
# Make sure you're in the project root
cd /Users/mataldao/Local/pokemon-tcg-shop

# Run the sync script
node scripts/sync-pokemon-data.js
```

### What It Does

The script will:

1. **Fetch all sets** (~200+ sets)
   - Saves to: `data/pokemon-tcg/sets.json`

2. **Fetch all cards** (~20,000+ cards)
   - Saves to: `data/pokemon-tcg/cards-all.json`
   - Also saves by set: `data/pokemon-tcg/sets/[set-id].json`

3. **Fetch metadata** (types, subtypes, supertypes, rarities)
   - Saves to: `data/pokemon-tcg/metadata.json`

4. **Generate summary** (statistics and distributions)
   - Saves to: `data/pokemon-tcg/summary.json`

### Expected Time

With an API key, the full sync takes approximately:
- **30-60 minutes** (depends on API response times and rate limiting)
- The script includes delays between requests to respect rate limits

### Output Structure

```
data/pokemon-tcg/
├── cards-all.json          # All ~20,000+ cards in one file
├── sets.json               # All sets/expansions
├── metadata.json           # Types, rarities, etc.
├── summary.json            # Statistics and overview
└── sets/                   # Cards organized by set
    ├── base1.json
    ├── base2.json
    ├── sv1.json
    └── ... (200+ files)
```

### File Sizes (Approximate)

- `cards-all.json`: ~100-150 MB
- Individual set files: 100 KB - 5 MB each
- Total: ~200-300 MB

### Using Local Data

After syncing, you can update your API routes to use local data instead of making API calls. This is useful for:
- **Development** - Faster load times
- **Offline work** - No internet required
- **Rate limiting** - Avoid hitting API limits
- **Performance** - Instant search results

### Updating Data

The Pokémon TCG API updates when new sets are released. To keep your local data current:

```bash
# Re-run the sync script periodically
node scripts/sync-pokemon-data.js
```

Recommended update frequency:
- **New set releases**: Every 3 months (when new sets drop)
- **Price updates**: Not included (prices change frequently)
- **Manual trigger**: When you notice missing cards

### Troubleshooting

**Rate Limited?**
- Wait for the cooldown period
- Check if you have an API key configured
- Reduce `DELAY_BETWEEN_REQUESTS` in the script

**Script Fails?**
- Check your internet connection
- Verify API key is valid
- Check API status: https://docs.pokemontcg.io/

**Out of Memory?**
- The script processes cards in batches
- Node should handle it, but you can increase memory:
  ```bash
  node --max-old-space-size=4096 scripts/sync-pokemon-data.js
  ```

### API Documentation

For more information about the Pokémon TCG API:
- Documentation: https://docs.pokemontcg.io/
- Developer Portal: https://dev.pokemontcg.io/
- Rate Limits: https://docs.pokemontcg.io/getting-started/rate-limits


