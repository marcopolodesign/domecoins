import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Cart from '@/components/Cart'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Pokemon TCG Argentina - Cartas Pokemon Online',
  description: 'Compra las mejores cartas Pokemon en Argentina. Precios en pesos argentinos con el dólar blue. Envíos a todo el país con Andreani.',
  keywords: 'pokemon, tcg, cartas pokemon, argentina, dolar blue, mercadopago',
  authors: [{ name: 'Pokemon TCG Argentina' }],
  creator: 'Pokemon TCG Argentina',
  publisher: 'Pokemon TCG Argentina',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://pokemon-tcg-argentina.com',
    siteName: 'Pokemon TCG Argentina',
    title: 'Pokemon TCG Argentina - Cartas Pokemon Online',
    description: 'Compra las mejores cartas Pokemon en Argentina. Precios en pesos argentinos con el dólar blue.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pokemon TCG Argentina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pokemontcgarg',
    creator: '@pokemontcgarg',
    title: 'Pokemon TCG Argentina - Cartas Pokemon Online',
    description: 'Compra las mejores cartas Pokemon en Argentina. Precios en pesos argentinos con el dólar blue.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://pokemon-tcg-argentina.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50 flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Cart />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
