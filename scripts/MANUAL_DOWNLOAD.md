# Manual Download Instructions for Pokemon TCG Sets

Since the Pokemon TCG API appears to be unreachable from your network environment, you can download the sets manually using these URLs in your browser:

## Sets to Download

### 1. Scarlet & Violet 151 (sv3pt5)
**Set Info:**
```
https://api.pokemontcg.io/v2/sets/sv3pt5
```

**All Cards (page 1):**
```
https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5&pageSize=250&page=1
```

Save as: `data/pokemon-tcg/sv3pt5-full.json`

---

### 2. Crown Zenith (swsh12pt5)
**Set Info:**
```
https://api.pokemontcg.io/v2/sets/swsh12pt5
```

**All Cards (page 1):**
```
https://api.pokemontcg.io/v2/cards?q=set.id:swsh12pt5&pageSize=250&page=1
```

Save as: `data/pokemon-tcg/swsh12pt5-full.json` (You already have this!)

---

### 3. Celebrations (cel25)
**Set Info:**
```
https://api.pokemontcg.io/v2/sets/cel25
```

**All Cards (page 1):**
```
https://api.pokemontcg.io/v2/cards?q=set.id:cel25&pageSize=250&page=1
```

Save as: `data/pokemon-tcg/cel25-full.json`

---

### 4. Destined Rivals (sv9pt5)
**Set Info:**
```
https://api.pokemontcg.io/v2/sets/sv9pt5
```

**All Cards (page 1):**
```
https://api.pokemontcg.io/v2/cards?q=set.id:sv9pt5&pageSize=250&page=1
```

Save as: `data/pokemon-tcg/sv9pt5-full.json`

---

## How to Download

### Option 1: Using Browser
1. Open each "All Cards" URL in your browser
2. The browser will display the JSON data
3. Right-click → Save As
4. Save with the filename specified above in `data/pokemon-tcg/` folder
5. **IMPORTANT**: Extract just the `data` array from the response and save that as an array

### Option 2: Using curl with API Key
If curl works from your local machine (not from Node.js):

```bash
# Set your API key
export API_KEY="445630f3-81ff-43ee-aa1f-9e8c56bdfd08"

# Download Scarlet & Violet 151
curl "https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5&pageSize=250" \
  -H "X-Api-Key: $API_KEY" \
  | jq '.data' > data/pokemon-tcg/sv3pt5-full.json

# Download Celebrations  
curl "https://api.pokemontcg.io/v2/cards?q=set.id:cel25&pageSize=250" \
  -H "X-Api-Key: $API_KEY" \
  | jq '.data' > data/pokemon-tcg/cel25-full.json

# Download Destined Rivals
curl "https://api.pokemontcg.io/v2/cards?q=set.id:sv9pt5&pageSize=250" \
  -H "X-Api-Key: $API_KEY" \
  | jq '.data' > data/pokemon-tcg/sv9pt5-full.json
```

### Option 3: Using Python Script
```python
import requests
import json

API_KEY = "445630f3-81ff-43ee-aa1f-9e8c56bdfd08"
headers = {"X-Api-Key": API_KEY}

sets = [
    ("sv3pt5", "Scarlet & Violet 151"),
    ("cel25", "Celebrations"),
    ("sv9pt5", "Destined Rivals")
]

for set_id, set_name in sets:
    print(f"Downloading {set_name}...")
    url = f"https://api.pokemontcg.io/v2/cards?q=set.id:{set_id}&pageSize=250"
    response = requests.get(url, headers=headers, timeout=30)
    
    if response.ok:
        data = response.json()
        with open(f"data/pokemon-tcg/{set_id}-full.json", "w") as f:
            json.dump(data['data'], f, indent=2)
        print(f"  ✓ Saved {len(data['data'])} cards")
    else:
        print(f"  ✗ Failed: {response.status_code}")
```

## File Format

Each file should be a JSON array of card objects:
```json
[
  {
    "id": "sv3pt5-1",
    "name": "Bulbasaur",
    "images": {
      "small": "https://images.pokemontcg.io/sv3pt5/1.png",
      "large": "https://images.pokemontcg.io/sv3pt5/1_hires.png"
    },
    ...
  },
  ...
]
```

## After Downloading

Once you've downloaded the files, restart your Next.js server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

The search API will automatically detect and use the new card files!

