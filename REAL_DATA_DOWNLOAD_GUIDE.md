# 🎴 Real Pokemon TCG Data Download Guide

## Why You Need This

Your server cannot reach `api.pokemontcg.io` due to Cloudflare's bot protection blocking automated requests. However, **browser requests work fine** because Cloudflare allows them!

## 📥 Method 1: Browser Downloader Tool (Easiest)

### Step 1: Open the Browser Tool

1. Make sure your Next.js dev server is running:
   ```bash
   npm run dev
   ```

2. Open in your browser:
   ```
   http://localhost:3002/download-sets.html
   ```

### Step 2: Download the Sets

1. The API key should already be filled in (or add your own)
2. Click **"Download All Sets"**
3. Wait for all 4 sets to download (~30 seconds)
4. Click **"Save Downloaded Files"**
5. Your browser will download 4 JSON files

### Step 3: Move Files to Data Directory

The downloaded files will be in your Downloads folder. Move them:

```bash
# Option A: Using Finder
# 1. Open Finder
# 2. Go to Downloads folder
# 3. Look for: sv3pt5-full.json, swsh12pt5-full.json, cel25-full.json, sv9pt5-full.json
# 4. Move them to: /Users/mataldao/Local/pokemon-tcg-shop/data/pokemon-tcg/

# Option B: Using Terminal
mv ~/Downloads/*-full.json /Users/mataldao/Local/pokemon-tcg-shop/data/pokemon-tcg/
```

### Step 4: Verify and Restart

```bash
# Check files are there
ls -lh data/pokemon-tcg/*-full.json

# You should see 4 files with real sizes (not the mock data)
# - cel25-full.json (should be ~75-100KB)
# - sv3pt5-full.json (should be ~300-400KB)
# - sv9pt5-full.json (should be ~140-180KB)
# - swsh12pt5-full.json (already have this one!)

# Restart your Next.js server (Ctrl+C then):
npm run dev
```

### Step 5: Test It!

```bash
curl "http://localhost:3002/api/search?query=charizard&provider=pokemon-tcg&pageSize=5"
```

You should see REAL Charizard cards from the actual sets! 🔥

---

## 📥 Method 2: Manual Browser Download (Alternative)

If the tool doesn't work, you can manually download each set:

### Scarlet & Violet 151
1. Open: https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5&pageSize=250
2. Right-click → "Save As" → Save as `sv3pt5-response.json`
3. Open the file in a text editor
4. Copy ONLY the `"data"` array (everything between `"data": [` and `]`)
5. Save it as `sv3pt5-full.json` in `data/pokemon-tcg/`

### Celebrations
1. Open: https://api.pokemontcg.io/v2/cards?q=set.id:cel25&pageSize=250
2. Follow the same steps as above
3. Save as `cel25-full.json`

### Destined Rivals
1. Open: https://api.pokemontcg.io/v2/cards?q=set.id:sv9pt5&pageSize=250
2. Follow the same steps
3. Save as `sv9pt5-full.json`

### Crown Zenith
✅ You already have this one! (`swsh12pt5-full.json`)

---

## 📥 Method 3: Using DevTools Console

1. Open your browser DevTools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Paste this code:

```javascript
// Configuration
const API_KEY = '445630f3-81ff-43ee-aa1f-9e8c56bdfd08';
const SETS = [
    { id: 'sv3pt5', name: 'Scarlet & Violet 151' },
    { id: 'cel25', name: 'Celebrations' },
    { id: 'sv9pt5', name: 'Destined Rivals' }
];

// Download function
async function downloadSet(setId, setName) {
    console.log(`Downloading ${setName}...`);
    
    const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`,
        { headers: { 'X-Api-Key': API_KEY } }
    );
    
    const data = await response.json();
    const cards = data.data;
    
    // Create download
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setId}-full.json`;
    a.click();
    
    console.log(`✓ ${setName}: ${cards.length} cards`);
    return new Promise(resolve => setTimeout(resolve, 2000)); // Delay
}

// Download all
(async () => {
    for (const set of SETS) {
        await downloadSet(set.id, set.name);
    }
    console.log('All downloads complete!');
})();
```

4. Press Enter
5. Wait for downloads to complete
6. Move files to `data/pokemon-tcg/`

---

## 🔍 Verify Real Data vs Mock Data

### Check if data is real:

```bash
# Real data will have actual Pokemon TCG card IDs and proper images
# Check a file:
cat data/pokemon-tcg/sv3pt5-full.json | grep -m 1 '"id"'

# Real data example: "id": "sv3pt5-1"
# Mock data example: "id": "sv3pt5-1" (same format but different content)

# Better check - look at image URLs:
cat data/pokemon-tcg/sv3pt5-full.json | grep -m 1 '"large"'

# Real data will have: "large": "https://images.pokemontcg.io/sv3pt5/1_hires.png"
```

### File sizes (approximate):

- **Scarlet & Violet 151** (`sv3pt5-full.json`): ~350-450KB (real) vs ~320KB (mock)
- **Celebrations** (`cel25-full.json`): ~80-120KB (real) vs ~75KB (mock)
- **Destined Rivals** (`sv9pt5-full.json`): ~150-200KB (real) vs ~143KB (mock)
- **Crown Zenith** (`swsh12pt5-full.json`): ~19KB (you have real data already!)

---

## ❓ Troubleshooting

### "Failed to fetch" error in browser
- **Solution**: Try from a different browser (Chrome, Safari, Firefox)
- Or try disabling browser extensions temporarily

### "Rate limited" error
- **Solution**: Wait 60 seconds and try again
- Or make sure API key is entered correctly

### Downloaded files are in wrong format
- **Solution**: Make sure you're saving the `data` array only, not the full API response

### Mock data still showing after replacing files
- **Solution**: Restart your Next.js server (Ctrl+C then `npm run dev`)

---

## 📊 Expected Results

After completing these steps, you should have:

```
data/pokemon-tcg/
├── sets.json                    (73KB - already have)
├── sv3pt5-full.json            (350-450KB - Scarlet & Violet 151)
├── cel25-full.json             (80-120KB - Celebrations)
├── sv9pt5-full.json            (150-200KB - Destined Rivals)
└── swsh12pt5-full.json         (19KB - Crown Zenith)
```

**Total: ~600-800KB of REAL Pokemon TCG card data across 4 premium sets!**

---

## 🚀 Next Steps

Once you have real data:

1. ✅ Your search API will use it automatically
2. ✅ Searches will return real card images from pokemontcg.io
3. ✅ Real prices from TCGPlayer
4. ✅ Accurate card details, attacks, HP, types, etc.
5. ✅ Ready for e-commerce integration!

---

## 💡 Why This Works

- **Server requests**: Blocked by Cloudflare ❌
- **Browser requests**: Allowed by Cloudflare ✅
- **Reason**: Cloudflare can't distinguish legitimate browser traffic from bots, so they allow all browser requests
- **Your browser** = Trusted ✅
- **Your server** = Detected as bot ❌

This is a common issue with Cloudflare-protected APIs!

