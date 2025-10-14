# Pokemon TCG Argentina 🎮

Una moderna tienda online de cartas Pokemon para Argentina con precios en pesos argentinos usando el dólar blue en tiempo real.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Catálogo completo** de cartas Pokemon usando Pokemon TCG API
- **Precios en tiempo real** convertidos de USD a ARS con dólar blue
- **Carrito lateral** con gestión de productos
- **Búsqueda y filtros avanzados** por set, tipo, rareza, etc.
- **Diseño responsive** optimizado para móviles y desktop
- **SEO optimizado** para mejor posicionamiento
- **Checkout con MercadoPago** (tarjeta, transferencia, efectivo)
- **Envíos con Andreani** (calculadora de costos)

### 🎨 Diseño
- Basado en el branding **OLIC** de Behance
- Colores de tipos Pokemon auténticos
- Animaciones suaves y moderna UX
- Componentes accesibles y responsive

### 💰 Pagos y Envíos
- **MercadoPago**: Tarjetas, transferencias, efectivo
- **Andreani**: Envíos a todo Argentina
- **Dólar Blue**: Actualización automática cada 5 minutos

## 🛠️ Tecnologías

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS con diseño personalizado
- **Estado**: Redux Toolkit
- **APIs**: Pokemon TCG API, APIs de dólar blue
- **Pagos**: MercadoPago SDK
- **Envíos**: Andreani API
- **SEO**: Next SEO, metadatos optimizados

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuentas en MercadoPago y Andreani (opcional para desarrollo)

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd pokemon-tcg-shop
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia `.env.local` y completa las variables:

```bash
# Pokemon TCG API (opcional - mayor límite de requests)
NEXT_PUBLIC_POKEMON_API_KEY=tu_api_key

# MercadoPago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_ACCESS_TOKEN=tu_access_token

# Andreani
NEXT_PUBLIC_ANDREANI_API_KEY=tu_api_key
ANDREANI_API_SECRET=tu_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Pokemon TCG Argentina"
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔧 Configuración Avanzada

### Pokemon TCG API
1. Registrate en [Pokemon TCG Developer](https://pokemontcg.io/)
2. Obtén tu API key
3. Agrega `NEXT_PUBLIC_POKEMON_API_KEY` a `.env.local`

### MercadoPago
1. Crea cuenta en [MercadoPago Developers](https://developers.mercadopago.com/)
2. Obtén tus credenciales de sandbox/producción
3. Configura webhooks en `/api/webhooks/mercadopago`
4. Agrega las variables de entorno

### Andreani
1. Contacta a Andreani para acceso API
2. Obtén credenciales de integración
3. Configura las variables de entorno

## 🏗️ Estructura del Proyecto

```
src/
├── app/                  # App Router de Next.js
│   ├── api/             # API routes
│   ├── cards/           # Página de catálogo
│   └── layout.tsx       # Layout principal
├── components/          # Componentes React
│   ├── Header.tsx       # Navegación principal
│   ├── Cart.tsx         # Carrito lateral
│   └── PokemonCard.tsx  # Tarjeta de producto
├── lib/                 # Utilidades y APIs
│   ├── pokemon-api.ts   # Cliente Pokemon TCG API
│   └── currency-api.ts  # Conversión de moneda
├── store/               # Redux store
│   ├── cartSlice.ts     # Estado del carrito
│   ├── productsSlice.ts # Estado de productos
│   └── currencySlice.ts # Estado de moneda
└── styles/              # Estilos globales
```

## 🎯 APIs Utilizadas

### Pokemon TCG API
- **Endpoint**: `https://api.pokemontcg.io/v2`
- **Documentación**: [docs.pokemontcg.io](https://docs.pokemontcg.io)
- **Rate Limit**: 20,000/día (sin API key), 100,000/día (con API key)

### Dólar Blue APIs
- **DolarApi**: `https://dolarapi.com/v1/dolares/blue`
- **Ambito**: `https://mercados.ambito.com/dolar/informal/variacion`
- **Fallback**: Rate fijo de AR$1335 si fallan todas las fuentes

## 🚢 Deploy

### Vercel (Recomendado)
1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Configura las variables de entorno en el dashboard
3. Deploy automático en cada push

### Otras Plataformas
- **Netlify**: Compatible con Next.js
- **Railway**: Soporte completo para Next.js
- **Render**: Deploy gratuito disponible

## 🔒 Seguridad

- Variables sensibles solo en servidor
- Validación de entrada en todas las APIs
- Rate limiting en endpoints críticos
- CORS configurado apropiadamente
- Sanitización de datos de usuario

## 📱 PWA y Performance

- **Core Web Vitals** optimizados
- **Image optimization** con Next.js
- **Bundle splitting** automático
- **Caching** estratégico
- **Offline support** (próximamente)

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📊 Analytics y Monitoring

- **Google Analytics** (configurar en layout.tsx)
- **Vercel Analytics** (automático en Vercel)
- **Error tracking** con Sentry (opcional)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la documentación
2. Busca en [Issues](https://github.com/tu-repo/issues)
3. Crea un nuevo issue con detalles
4. Contacta al equipo de desarrollo

## 🎉 Agradecimientos

- **Pokemon Company** por las imágenes y datos
- **Pokemon TCG API** por la API gratuita
- **OLIC** por el diseño de referencia
- **MercadoPago** por la integración de pagos
- **Andreani** por los servicios de envío

---

**Pokemon TCG Argentina** - Hecho con ❤️ para la comunidad Pokemon Argentina
