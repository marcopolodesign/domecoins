# Research: How PreciosTCG.com Works

## Investigation Steps

Let me analyze preciostcg.com to understand their scraping approach:

### 1. Visit the site and inspect network requests
- Open: https://www.preciostcg.com/
- Open DevTools (F12) → Network tab
- Search for a Pokemon card (e.g., "Charizard")
- Observe the network requests made

### 2. Key findings to look for:
- What API endpoints do they call?
- What's the request/response format?
- How do they handle TCGPlayer data?
- Do they use a backend proxy or direct scraping?

### 3. Based on owner's comment:
> "basicamente haces un fetch a pagina.com/search?query=nombrecarta"
> "Tcgplayer tiene una api pero no es publica, tenes que ver los request que haces en el network desde el navegador"

This tells us:
1. They fetch the search page HTML
2. TCGPlayer has an internal API (not public)
3. Need to inspect browser network requests to find the API endpoints
4. Extract token from those requests

## Next Steps:
1. Open preciostcg.com in browser
2. Open DevTools → Network tab
3. Search for "Pikachu" or "Charizard"
4. Document all XHR/Fetch requests
5. Find the pattern they use
6. Replicate it in our codebase

## Questions to Answer:
- [ ] What endpoint does preciostcg.com call for searches?
- [ ] Do they have their own backend API?
- [ ] How do they get TCGPlayer prices?
- [ ] What's their data structure?
- [ ] Do they cache results?

---

## Manual Inspection Required

Since I can't browse directly, please help me by:

1. Go to: https://www.preciostcg.com/
2. Open DevTools (Cmd+Option+I)
3. Go to Network tab
4. Search for a card (e.g., "Charizard")
5. Look for XHR/Fetch requests
6. Share the:
   - Request URL
   - Request headers
   - Request payload
   - Response format

Or alternatively, share a screenshot of the Network tab with the requests visible.

