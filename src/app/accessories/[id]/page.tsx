'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, openCart, MAX_QUANTITY_PER_VARIANT } from '@/store/cartSlice';
import { ShoppingCartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import VanillaTilt from 'vanilla-tilt';
import { getRoundedArsPrice } from '@/utils/priceFormatting';
import toast from 'react-hot-toast';
import type { Accessory } from '@/lib/kv';

export default function AccessoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dolarBlueRate = useAppSelector((state) => state.currency.dolarBlueRate);
  const cartItems = useAppSelector((state) => state.cart.items);
  
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [loading, setLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Helper function to transform Cloudinary URLs for browser compatibility
  const transformCloudinaryUrl = (url: string): string => {
    if (!url) return url;
    
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com/') && url.includes('/upload/')) {
      // Add f_auto (automatic format) and q_auto (automatic quality) transformations
      // This converts HEIC to WebP/JPG automatically based on browser support
      return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    
    return url;
  };
  
  useEffect(() => {
    const fetchAccessory = async () => {
      try {
        setLoading(true);
        // Fetch all accessories and find the one with matching ID
        const response = await fetch('/api/accessories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch accessories');
        }
        
        const data = await response.json();
        const foundAccessory = data.accessories.find((acc: Accessory) => acc.id === params.id);
        
        if (!foundAccessory) {
          throw new Error('Accessory not found');
        }
        
        // Transform Cloudinary URL for browser compatibility
        if (foundAccessory.imageUrl) {
          foundAccessory.imageUrl = transformCloudinaryUrl(foundAccessory.imageUrl);
        }
        
        setAccessory(foundAccessory);
      } catch (error) {
        console.error('Error fetching accessory:', error);
        setAccessory(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchAccessory();
    }
  }, [params.id]);
  
  // Initialize VanillaTilt on image
  useEffect(() => {
    const currentRef = imageRef.current;
    if (currentRef && !loading && accessory) {
      VanillaTilt.init(currentRef, {
        max: 10,
        speed: 500,
        perspective: 3000,
      });
      
      // Cleanup on unmount
      return () => {
        const tiltInstance = (currentRef as HTMLImageElement & { vanillaTilt?: { destroy: () => void } });
        if (tiltInstance.vanillaTilt) {
          tiltInstance.vanillaTilt.destroy();
        }
      };
    }
  }, [loading, accessory]);
  
  const formatPrice = (priceUSD?: number) => {
    if (!priceUSD) return 'Consultá precio';
    
    const priceARS = getRoundedArsPrice(priceUSD * dolarBlueRate);
    return `AR$ ${priceARS.toLocaleString('es-AR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };
  
  const handleAddToCart = () => {
    if (!accessory) return;
    
    const price = accessory.price || 0;
    if (!price) {
      toast.error('Precio no disponible para este accesorio');
      return;
    }
    
    // Create unique ID
    const uniqueId = `${accessory.id}-normal`;
    
    // Check if cart already has 3 of this item
    const existingItem = cartItems.find(item => item.card.id === uniqueId);
    if (existingItem && existingItem.quantity >= MAX_QUANTITY_PER_VARIANT) {
      toast.error('Ya tenés el máximo de 3 unidades de este producto en tu carrito');
      return;
    }
    
    dispatch(addToCart({
      card: {
        id: uniqueId,
        name: accessory.productName,
        images: {
          small: accessory.imageUrl,
          large: accessory.imageUrl,
        },
        set: {
          name: accessory.setName,
          id: accessory.number,
        },
        number: accessory.number,
        rarity: accessory.productLine,
        imageUrl: accessory.imageUrl,
        categoryName: accessory.setName,
        setId: accessory.number,
        inStock: accessory.addToQuantity > 0,
        printing: 'Normal',
        productId: accessory.id,
      } as any,
      quantity: 1,
      priceUsd: price,
      priceArs: getRoundedArsPrice(price * dolarBlueRate),
      inStock: accessory.addToQuantity > 0,
    }));
    
    dispatch(openCart());
    toast.success(`${accessory.productName} agregado al carrito`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!accessory) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 font-thunder">Accesorio No Encontrado</h1>
          <p className="text-gray-600 mb-6 font-interphases">
            El accesorio que buscás no existe o fue removido.
          </p>
          <button
            onClick={() => router.push('/accessories')}
            className="text-orange-600 hover:text-orange-800 underline font-interphases"
          >
            Ver todos los accesorios
          </button>
        </div>
      </div>
    );
  }
  
  const inStock = accessory.addToQuantity > 0;
  const price = accessory.price || 0;
  
  return (
    <div className="min-h-screen bg-white pt-32 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/accessories')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-interphases">Volver a Accesorios</span>
        </button>
        
        {/* Accessory Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Image with Orange Gradient Background */}
          <div 
            className="flex justify-center rounded-lg py-12 p-8 lg:p-10 h-max relative"
            style={{ 
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
            }}
          >
            {/* Stock Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md font-interphases font-semibold text-sm shadow-sm ${
              inStock ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
            }`}>
              {inStock ? '✓ En Stock' : '⏱ Por Encargo'}
            </div>
            
            <div 
              className="lg:sticky lg:top-24 self-start"
              style={{ width: '400px', height: '400px', maxWidth: '100%' }}
            >
              <img
                ref={imageRef}
                src={accessory.imageUrl}
                alt={accessory.productName}
                className="rounded-lg object-cover w-full h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-card.svg';
                }}
              />
            </div>
          </div>
          
          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Title & Basic Info */}
            <div>
              <h1 className="text-5xl font-thunder mb-4">
                {accessory.productName}
              </h1>
              
              {/* Product Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-interphases font-semibold">Categoría:</span>
                  <span className="text-gray-800 font-interphases">{accessory.productLine}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-interphases font-semibold">Colección:</span>
                  <span className="text-gray-800 font-interphases">{accessory.setName}</span>
                </div>
                {accessory.number && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-interphases font-semibold">Número:</span>
                    <span className="text-gray-800 font-interphases">{accessory.number}</span>
                  </div>
                )}
                {accessory.title && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-interphases font-semibold">Título:</span>
                    <span className="text-gray-800 font-interphases">{accessory.title}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stock Information */}
            <div className="border-t pt-6">
              <h3 className="text-2xl font-thunder mb-4">Disponibilidad</h3>
              <div className={`border-2 rounded-lg p-4 ${
                inStock ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-interphases font-bold text-lg ${
                      inStock ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {inStock ? 'En Stock' : 'Por Encargo'}
                    </p>
                    {inStock && accessory.addToQuantity > 0 && (
                      <p className="text-sm font-interphases text-green-700">
                        {accessory.addToQuantity} {accessory.addToQuantity === 1 ? 'unidad disponible' : 'unidades disponibles'}
                      </p>
                    )}
                    {!inStock && (
                      <p className="text-sm font-interphases text-yellow-700">
                        Se encarga bajo pedido
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add to Cart */}
            <div className="border-t pt-6">
              {price > 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-interphases mb-1">Precio:</p>
                    <p className="text-4xl font-thunder">
                      {formatPrice(price)}
                    </p>
                    <p className="text-sm text-gray-500 font-interphases mt-1">
                      USD ${price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-4 rounded-lg font-interphases font-bold text-lg flex items-center justify-center gap-3 transition-all bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <ShoppingCartIcon className="w-6 h-6" />
                    Agregar al Carrito
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-interphases mb-4">Precio no disponible</p>
                  <p className="text-sm text-gray-400 font-interphases">Contactanos para consultar el precio</p>
                </div>
              )}
            </div>
            
            {/* Product ID */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 font-interphases">
                ID: {accessory.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

