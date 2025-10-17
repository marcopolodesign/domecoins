# Local Development Data (KV Fallback)

Este directorio contiene archivos JSON para simular Vercel KV (Redis) en desarrollo local.

## 🔧 **Cómo funciona:**

### **En Producción (Vercel):**
- ✅ Usa **Vercel KV (Redis)** con `REDIS_URL`
- ✅ Los datos persisten en la nube

### **En Local (Development):**
- ⚠️ **NO hay `REDIS_URL` configurado**
- 📁 Lee/escribe de **archivos JSON locales** en este directorio
- ✅ Los datos persisten entre reinicios del servidor

---

## 📂 **Archivos:**

### 1. `custom-price.json`
Precio del dólar personalizado (en vez del API externo).

```json
{
  "price": 1500,
  "updatedAt": "2025-01-17T00:00:00.000Z",
  "source": "local-development"
}
```

**Cómo actualizar:**
- Desde Admin: `/admin` → "Actualizar Precio Dólar" → se guarda automáticamente
- Manual: Edita el archivo y cambia el valor de `price`

---

### 2. `inventory.json`
Inventario de cartas (CSV).

```json
{
  "comment": "Local inventory for development",
  "lastUpdated": "2025-01-17T00:00:00.000Z",
  "inventory": {
    "250300": 5,
    "250314": 10,
    "478058": 3
  }
}
```

**Cómo actualizar:**
- Desde Admin: `/admin` → "Subir CSV de Inventario" → se guarda automáticamente
- Manual: Edita el archivo y agrega/modifica los `productId`

---

## ⚠️ **Importante:**

1. **Estos archivos NO se suben a Git** (están en `.gitignore`)
2. **Solo funcionan en local** (Vercel usa Redis)
3. **Cada desarrollador tiene sus propios archivos locales**
4. **NO afectan producción en ningún momento**

---

## 🚀 **Para empezar:**

1. Copia el archivo de ejemplo:
   ```bash
   cp data/local/custom-price.json.example data/local/custom-price.json
   cp data/local/inventory.json.example data/local/inventory.json
   ```

2. Edita los valores según necesites

3. Reinicia el servidor Next.js:
   ```bash
   npm run dev
   ```

4. Los datos ahora persisten localmente! 🎉

