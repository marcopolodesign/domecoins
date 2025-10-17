# 🎯 FLUJO COMPLETO DEL SISTEMA DE PRECIOS

## ¿Cómo funciona ahora todo?

Básicamente, antes traíamos el precio de TCGPlayer y lo mostrábamos tal cual. Ahora, cuando traemos una carta, **le aplicamos una fórmula según su rareza** para calcular nuestro precio de venta.

---

## 1️⃣ El Usuario Busca una Carta

```
Usuario escribe: "Charizard"
↓
Frontend llama: GET /api/search-with-prices?query=Charizard
```

---

## 2️⃣ API de Búsqueda (search-with-prices)

**Lo que hace:**

```javascript
// 1. Llamamos a TCGPlayer y traemos cartas
const tcgResponse = await searchTCGPlayerPrices('Charizard')

// Ejemplo de lo que trae TCGPlayer:
{
  productName: "Charizard ex",
  marketPrice: 45.99,  // ← Precio de mercado
  rarity: "Ultra Rare"
}

// 2. Para CADA carta, le aplicamos la fórmula
const rarity = "Ultra Rare"
const marketPrice = 45.99

// 3. Calculamos NUESTRO precio con la fórmula
const retailPrice = calculateFinalPrice(rarity, marketPrice)
// Ultra Rare con M=$45.99 → (45.99 + 0.4) × 1.20 = $55.67

// 4. Devolvemos AMBOS precios
{
  name: "Charizard ex",
  pricing: {
    marketPrice: 45.99,    // ← Original de TCGPlayer
    retailPrice: 55.67,    // ← NUESTRO precio (con markup)
    source: "TCGPlayer"
  }
}
```

**Código real:**
```typescript
// src/app/api/search-with-prices/route.ts (líneas 53-56)

const rarity = priceData.rarity || 'Unknown';
const marketPrice = priceData.marketPrice || 0;
const finalRetailPrice = calculateFinalPrice(rarity, marketPrice);

// Agregamos retailPrice al pricing
pricing: {
  marketPrice: priceData.marketPrice,  // Original
  retailPrice: finalRetailPrice,       // Con fórmula ✅
  lowPrice: priceData.lowestPrice,
  ...
}
```

---

## 3️⃣ Frontend Muestra el Precio

**ProductCard.tsx** (las cartas en la grilla):

```typescript
// src/components/ProductCard.tsx (líneas 42-47)

const getPrice = () => {
  // Primero intenta usar retailPrice (nuestro precio con fórmula)
  if (card.pricing?.retailPrice) {
    return card.pricing.retailPrice  // ← ESTE es el que mostramos ✅
  }
  
  // Si no existe (backward compatibility), usa marketPrice
  if (card.pricing?.marketPrice) {
    return card.pricing.marketPrice
  }
}
```

**Entonces el usuario ve:**
```
Charizard ex
AR$ 81.606  ← (55.67 USD × 1465 = 81.606 ARS)
```

---

## 4️⃣ Página Individual de Carta

**Cuando haces click en una carta:**

```
Usuario clickea Charizard
↓
Frontend llama: GET /api/cards/178845
```

**API Individual (cards/[id]/route.ts):**

```typescript
// 1. Traemos la carta de TCGPlayer
const product = await fetchProductDetails(178845)

// Tiene 2 variantes:
// - Holofoil: M=$45.99
// - Reverse Holofoil: M=$42.50

// 2. Aplicamos fórmula a CADA variante
product.variants = product.variants.map(variant => {
  const rarity = product.rarity  // "Ultra Rare"
  const marketPrice = variant.marketPrice
  const retailPrice = calculateFinalPrice(rarity, marketPrice)
  
  return {
    ...variant,
    retailPrice  // ← Agregamos precio calculado ✅
  }
})

// Resultado:
variants: [
  {
    printing: "Holofoil",
    marketPrice: 45.99,      // Original TCGPlayer
    retailPrice: 55.67,      // Con fórmula ✅
  },
  {
    printing: "Reverse Holofoil",
    marketPrice: 42.50,      // Original TCGPlayer
    retailPrice: 51.40,      // Con fórmula ✅
  }
]
```

**Frontend muestra:**
```
📋 Versiones Disponibles:
┌─────────────────────────────┐
│ Holofoil                    │
│ ⏱ Por Encargo              │
│ AR$ 81.606             ← retailPrice con conversión
└─────────────────────────────┘

┌─────────────────────────────┐
│ Reverse Holofoil            │
│ ⏱ Por Encargo              │
│ AR$ 75.301             ← retailPrice con conversión
└─────────────────────────────┘
```

**Código:**
```typescript
// src/app/cards/[id]/page.tsx (línea 261)

const variantPrice = variant.retailPrice || variant.marketPrice
// Primero intenta retailPrice, sino marketPrice (fallback)
```

---

## 5️⃣ Agregar al Carrito

```typescript
// src/app/cards/[id]/page.tsx (línea 86)

const handleAddToCart = (variant) => {
  const price = variant.retailPrice || variant.marketPrice || 0
  
  dispatch(addToCart({
    card: { ... },
    priceUsd: price,  // ← Usa retailPrice ✅
    priceArs: price × dolarBlueRate
  }))
}
```

**Entonces en el carrito:**
```
🛒 Carrito
Charizard ex - Holofoil
AR$ 81.606  ← Precio con fórmula aplicada
```

---

## 🔧 La Magia: priceFormulas.ts

Este es el archivo que tiene todas las fórmulas:

```typescript
// src/utils/priceFormulas.ts

export function calculateFinalPrice(rarity: string, marketPrice: number) {
  
  // COMMON/UNCOMMON → M × 1.25 (mínimo $0.3)
  if (rarity === 'Common') {
    return Math.max(0.3, marketPrice × 1.25)
  }
  
  // ULTRA RARE → Escala según precio
  if (rarity === 'Ultra Rare') {
    let multiplier = 1.35  // Default
    
    if (marketPrice > 100) multiplier = 1.10      // 10%
    else if (marketPrice > 70) multiplier = 1.15  // 15%
    else if (marketPrice > 40) multiplier = 1.20  // 20%
    else if (marketPrice > 20) multiplier = 1.25  // 25%
    // else → 35% (default)
    
    const calculated = (marketPrice + 0.4) × multiplier
    return Math.max(1.5, calculated)  // Mínimo $1.5
  }
  
  // ... 20+ rarities más
}
```

---

## 📊 Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario busca "Charizard"                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API llama TCGPlayer                                      │
│    • marketPrice: $45.99                                    │
│    • rarity: "Ultra Rare"                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. priceFormulas.ts calcula                                 │
│    • (45.99 + 0.4) × 1.20 = $55.67                         │
│    • Math.max(1.5, 55.67) = $55.67 ✅                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. API devuelve                                             │
│    {                                                        │
│      pricing: {                                             │
│        marketPrice: 45.99,   ← TCGPlayer                   │
│        retailPrice: 55.67    ← Nuestro ✅                  │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend muestra                                         │
│    AR$ 81.606 (55.67 × 1465)                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Usuario agrega al carrito con ese precio ✅              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Cambios en Cada Archivo

### Nuevos:
- ✅ `src/utils/priceFormulas.ts` - Sistema completo de fórmulas

### Modificados:
- ✅ `src/app/api/search-with-prices/route.ts` - Aplica fórmula en búsqueda
- ✅ `src/app/api/cards/[id]/route.ts` - Aplica fórmula en variantes
- ✅ `src/app/cards/[id]/page.tsx` - Muestra `retailPrice`
- ✅ `src/components/ProductCard.tsx` - Usa `retailPrice`

---

## 🎯 Resultado Final

**Antes:**
```
Mostrábamos: $45.99 (directo de TCGPlayer)
```

**Ahora:**
```
Mostramos: $55.67 (con nuestra fórmula según rarity)
Mantenemos: $45.99 (para referencia interna)
```

---

## 🔍 Printing Variants - Aplicación de Fórmulas

### ¿Se aplica la fórmula a cada printing variant?

**SÍ ✅** - La fórmula se aplica a **cada variante individual** (Holofoil, Reverse Holofoil, etc.)

### Ejemplo Real:

```typescript
// Carta: Typhlosion (Ultra Rare)
// 
// TCGPlayer devuelve:
variants: [
  { printing: "Holofoil",         marketPrice: 10.05 },
  { printing: "Reverse Holofoil", marketPrice: 7.00 }
]

// Aplicamos fórmula a CADA UNA:
// 
// API (cards/[id]/route.ts líneas 34-43):
product.variants = product.variants.map(variant => {
  const rarity = product.rarity         // "Ultra Rare"
  const marketPrice = variant.marketPrice
  const retailPrice = calculateFinalPrice(rarity, marketPrice)
  
  return { ...variant, retailPrice }
})

// Resultado:
variants: [
  {
    printing: "Holofoil",
    marketPrice: 10.05,    // Original
    retailPrice: 13.06     // (10.05 + 0.4) × 1.25 = 13.06 ✅
  },
  {
    printing: "Reverse Holofoil",
    marketPrice: 7.00,     // Original
    retailPrice: 9.25      // (7.00 + 0.4) × 1.25 = 9.25 ✅
  }
]
```

### En el Frontend:

```typescript
// src/app/cards/[id]/page.tsx (línea 261)

{card.variants.map((variant) => {
  // Usa retailPrice si existe, sino marketPrice
  const variantPrice = variant.retailPrice || variant.marketPrice
  
  return (
    <div>
      <p>{variant.printing}</p>
      <p>{formatPrice(variantPrice)}</p>  // ← Muestra precio con fórmula
    </div>
  )
})}
```

### Verificación:

**Usuario ve:**
```
Versiones Disponibles:

┌──────────────────────┐
│ Holofoil             │
│ AR$ 19.137 ✅        │ ← (13.06 USD × 1465)
└──────────────────────┘

┌──────────────────────┐
│ Reverse Holofoil     │
│ AR$ 13.551 ✅        │ ← (9.25 USD × 1465)
└──────────────────────┘
```

### Resumen:

✅ **Cada printing variant tiene su propio `retailPrice`**  
✅ **Se calcula usando la misma `rarity` de la carta madre**  
✅ **Pero con el `marketPrice` específico de ese printing**  
✅ **Frontend muestra el precio con fórmula aplicada**  
✅ **Carrito usa el `retailPrice` del variant seleccionado**

---

## 📝 Notas Importantes

1. **Backward Compatibility:** Si `retailPrice` no existe, el sistema usa `marketPrice` como fallback
2. **Logging:** El primer resultado de búsqueda se loggea con ambos precios para debugging
3. **Rarity Consistency:** Todos los variants de una carta usan la misma `rarity` para calcular el markup
4. **Minimum Prices:** Se aplican los mínimos según la rarity (ej: Ultra Rare mínimo $1.5)

---

**Todo es automático** - solo traemos el `marketPrice` y `rarity` de TCGPlayer, y el sistema calcula nuestro precio de venta para cada variant. 🚀

