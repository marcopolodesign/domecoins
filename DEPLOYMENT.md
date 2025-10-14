# 🚀 Guía de Deployment - Pokemon TCG Argentina

## 📋 Checklist Pre-Deploy

### ✅ Configuración Básica
- [ ] Variables de entorno configuradas
- [ ] APIs funcionando correctamente
- [ ] Build sin errores (`npm run build`)
- [ ] Tests pasando (`npm test`)
- [ ] SEO configurado
- [ ] Analytics implementado

### 🔑 APIs y Servicios

#### Pokemon TCG API
- **Status**: ✅ Implementado
- **Fallback**: Cache local para desarrollo
- **Rate Limit**: 20k/día sin key, 100k/día con key

#### Dólar Blue API
- **Status**: ✅ Implementado con múltiples fuentes
- **Sources**: DolarApi, Ambito
- **Fallback**: AR$1335 fijo
- **Update**: Cada 5 minutos

#### MercadoPago
- **Status**: ✅ SDK integrado
- **Métodos**: Tarjeta, transferencia, efectivo
- **Webhooks**: `/api/webhooks/mercadopago`
- **Testing**: Sandbox mode disponible

#### Andreani
- **Status**: ⏳ Estructura preparada
- **API**: Calculadora de envíos
- **Coverage**: Todo Argentina

## 🌐 Opciones de Deploy

### 1. Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login y deploy
vercel login
vercel

# 3. Configurar dominio personalizado
vercel domains add pokemon-tcg-argentina.com
```

**Variables de entorno en Vercel:**
```
NEXT_PUBLIC_POKEMON_API_KEY=your_key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_key
MERCADOPAGO_ACCESS_TOKEN=your_token
NEXT_PUBLIC_ANDREANI_API_KEY=your_key
ANDREANI_API_SECRET=your_secret
NEXT_PUBLIC_APP_URL=https://pokemon-tcg-argentina.com
```

### 2. Netlify

```bash
# 1. Build optimizado
npm run build

# 2. Deploy
netlify deploy --prod --dir=.next
```

### 3. Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login y deploy
railway login
railway deploy
```

## 🔧 Configuración de Producción

### Environment Variables

```bash
# Requeridas
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_NAME="Pokemon TCG Argentina"

# Pokemon TCG API (opcional pero recomendado)
NEXT_PUBLIC_POKEMON_API_KEY=tu_api_key

# MercadoPago (requerido para pagos)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx

# Andreani (requerido para envíos)
NEXT_PUBLIC_ANDREANI_API_KEY=tu_api_key
ANDREANI_API_SECRET=tu_secret

# Base de datos (opcional para órdenes)
DATABASE_URL=postgresql://user:pass@host:port/db

# Email (opcional para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

### Next.js Config Optimizations

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: [
      'images.pokemontcg.io',
      'cards.pokemontcg.io'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate' },
      ],
    },
  ],
}
```

## 📊 Analytics y Monitoring

### Google Analytics
```typescript
// Agregar en layout.tsx
<Script src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID" />
<Script id="google-analytics">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_TRACKING_ID');
  `}
</Script>
```

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
// Agregar en layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🚦 Health Checks

### API Status
- `/api/currency` - Dólar blue rate
- `/api/cards` - Pokemon cards proxy
- `/api/checkout` - MercadoPago integration

### Performance Monitoring
```bash
# Core Web Vitals
npm install web-vitals

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

## 🔒 Security Best Practices

### Headers de Seguridad
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

### Rate Limiting
```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
})

export function checkRateLimit(identifier: string) {
  const count = rateLimit.get(identifier) || 0
  if (count >= 10) return false
  rateLimit.set(identifier, count + 1)
  return true
}
```

## 🎯 SEO Configuration

### Sitemap Generation
```bash
# Instalar
npm install next-sitemap

# Configurar next-sitemap.config.js
module.exports = {
  siteUrl: 'https://pokemon-tcg-argentina.com',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*'],
}
```

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://pokemon-tcg-argentina.com/sitemap.xml
```

## 📱 PWA Setup (Opcional)

```bash
npm install next-pwa
```

```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public'
})

module.exports = withPWA({
  // next config
})
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Performance Optimizations

### Image Optimization
- WebP/AVIF formats
- Lazy loading automático
- Responsive images
- Pokemon card thumbnails

### Bundle Optimization
- Code splitting automático
- Dynamic imports
- Tree shaking
- Unused CSS removal

### Caching Strategy
- API responses: 5 minutos
- Static assets: 1 año
- Pokemon images: 30 días
- Currency rates: 5 minutos

## 🆘 Troubleshooting

### Problemas Comunes

**Error: Pokemon API rate limit**
```bash
# Solución: Agregar API key
NEXT_PUBLIC_POKEMON_API_KEY=tu_key
```

**Error: MercadoPago sandbox**
```bash
# Verificar credenciales sandbox vs production
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx
```

**Error: Currency API timeout**
```bash
# Fallback automático a rate fijo: AR$1335
# Verificar logs en /api/currency
```

### Logs y Debug
```bash
# Vercel logs
vercel logs

# Local debug
DEBUG=* npm run dev
```

## ✅ Post-Deploy Checklist

- [ ] URL principal funciona
- [ ] Cartas se cargan correctamente
- [ ] Dólar blue se actualiza
- [ ] Carrito funciona
- [ ] Checkout redirect funciona
- [ ] SEO meta tags visibles
- [ ] Performance > 90 en Lighthouse
- [ ] Mobile responsive
- [ ] SSL certificado activo
- [ ] Analytics funcionando

## 📞 Soporte Post-Deploy

1. **Monitoring**: Configurar alertas para APIs
2. **Backups**: Base de datos y configuración
3. **Updates**: Mantener dependencias actualizadas
4. **Security**: Auditorías regulares

---

🎉 **¡Tu tienda Pokemon TCG Argentina está lista para el mundo!** 🇦🇷
