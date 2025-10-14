'use client';

import Link from 'next/link';
import { ChevronRightIcon, SparklesIcon, TruckIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import SearchBox from '@/components/SearchBox';

const features = [
  {
    name: 'Precios en Pesos',
    description: 'Todos los precios en pesos argentinos con el dólar blue actualizado en tiempo real.',
    icon: CreditCardIcon,
  },
  {
    name: 'Envíos Seguros',
    description: 'Envíos a todo el país con Andreani, seguimiento incluido.',
    icon: TruckIcon,
  },
  {
    name: 'Cartas Auténticas',
    description: 'Todas nuestras cartas son 100% originales y en excelente estado.',
    icon: SparklesIcon,
  },
];

const heroSets = [
  {
    name: 'Scarlet & Violet',
    description: 'Las cartas más nuevas de la región de Paldea',
    image: '/hero-sv.jpg',
    href: '/sets/sv',
  },
  {
    name: 'Pokémon GO',
    description: 'Colección especial de Pokémon GO',
    image: '/hero-pogo.jpg',
    href: '/sets/pgo',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="block">BUSCA Y COMPARA PRECIOS DE CARTAS</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Mejora tu experiencia de búsqueda con resultados unificados, conversión automática de monedas y listas de compra inteligentes.
            </p>
            
            {/* Hero Search */}
            <div className="mt-8">
              <SearchBox variant="hero" placeholder='Probá buscando "Pikachu Crown"' />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Pokemon TCG Argentina?
            </h2>
            <p className="text-lg text-gray-600">
              La mejor experiencia para coleccionistas argentinos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card-hover p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Sets Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sets Destacados
            </h2>
            <p className="text-lg text-gray-600">
              Explora las colecciones más populares
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {heroSets.map((set) => (
              <Link key={set.name} href={set.href} className="card-hover overflow-hidden group">
                <div className="aspect-[16/9] bg-gradient-to-r from-primary-400 to-secondary-400 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-2">{set.name}</h3>
                      <p className="text-lg opacity-90">{set.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Comienza tu búsqueda ahora!
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Accede a miles de cartas con precios actualizados
          </p>
          <Link href="/search" className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg">
            Buscar Cartas Pokémon
            <ChevronRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Pokemon TCG Argentina</h3>
            <p className="text-gray-400 mb-4">
              Tu tienda de confianza para cartas Pokémon en Argentina
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/search" className="text-gray-400 hover:text-white">
                Buscar
              </Link>
              <Link href="/cards" className="text-gray-400 hover:text-white">
                Cartas
              </Link>
              <Link href="/sets" className="text-gray-400 hover:text-white">
                Sets
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}