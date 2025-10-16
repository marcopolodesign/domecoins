'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dolarPrice, setDolarPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Inventory management
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [inventorySuccess, setInventorySuccess] = useState('');
  const [inventoryStats, setInventoryStats] = useState<{totalCards: number} | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const authToken = sessionStorage.getItem('admin_auth');
    if (authToken === 'dome_authenticated') {
      setIsAuthenticated(true);
      fetchCurrentPrice();
      fetchInventoryStats();
    }
  }, []);

  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('/api/currency/custom');
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.customPrice || data.bluePrice);
      }
    } catch (err) {
      console.error('Error fetching current price:', err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hardcoded credentials
    if (username === 'dome' && password === 'aldo123') {
      sessionStorage.setItem('admin_auth', 'dome_authenticated');
      setIsAuthenticated(true);
      fetchCurrentPrice();
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const price = parseFloat(dolarPrice);
    if (isNaN(price) || price <= 0) {
      setError('Por favor ingresa un precio válido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/currency/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      });

      if (response.ok) {
        setSuccess(`Precio del dólar actualizado a $${price}`);
        setCurrentPrice(price);
        setDolarPrice('');
      } else {
        const data = await response.json();
        setError(data.error || 'Error al actualizar el precio');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventoryStats({ totalCards: data.totalCards });
      }
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setInventoryError('');
      setInventorySuccess('');
    }
  };

  const handleInventoryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      setInventoryError('Por favor selecciona un archivo CSV');
      return;
    }

    setInventoryLoading(true);
    setInventoryError('');
    setInventorySuccess('');

    try {
      // Read CSV file
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvData = event.target?.result as string;
          
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ csvData }),
          });

          if (response.ok) {
            const data = await response.json();
            setInventorySuccess(
              `✅ Inventario actualizado: ${data.processedCount} productos cargados${
                data.errorCount > 0 ? ` (${data.errorCount} errores)` : ''
              }`
            );
            setCsvFile(null);
            // Reset file input
            const fileInput = document.getElementById('csv-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            // Refresh stats
            fetchInventoryStats();
          } else {
            const data = await response.json();
            setInventoryError(data.error || 'Error al cargar el inventario');
          }
        } catch (err) {
          setInventoryError('Error al procesar el archivo CSV');
        } finally {
          setInventoryLoading(false);
        }
      };

      reader.onerror = () => {
        setInventoryError('Error al leer el archivo');
        setInventoryLoading(false);
      };

      reader.readAsText(csvFile);
    } catch (err) {
      setInventoryError('Error al cargar el archivo');
      setInventoryLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 font-thunder">
              Panel de Administración
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa tus credenciales para continuar
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 font-thunder">
                Configuración del Precio del Dólar
              </h3>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cerrar Sesión
              </button>
            </div>

            {currentPrice !== null && (
              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Precio actual:</span> ${currentPrice.toFixed(2)}
                </p>
              </div>
            )}

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label htmlFor="dolar-price" className="block text-sm font-medium text-gray-700">
                  Nuevo Precio del Dólar (ARS)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="dolar-price"
                    id="dolar-price"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={dolarPrice}
                    onChange={(e) => setDolarPrice(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">ARS</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Ingresa el precio del dólar blue que deseas usar para las conversiones.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Precio'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Información</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• El precio personalizado tendrá prioridad sobre las APIs automáticas.</li>
              <li>• Puedes actualizar el precio cuantas veces necesites.</li>
              <li>• Los cambios se aplicarán inmediatamente en todo el sitio.</li>
            </ul>
          </div>
        </div>

        {/* Inventory Management Section */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 font-thunder mb-6">
              Gestión de Inventario
            </h3>

            {inventoryStats && (
              <div className="mb-6 p-4 bg-green-50 rounded-md">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Productos en inventario:</span> {inventoryStats.totalCards}
                </p>
              </div>
            )}

            <form onSubmit={handleInventoryUpload} className="space-y-4">
              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-2">
                  Cargar Archivo CSV de Inventario
                </label>
                <input
                  type="file"
                  id="csv-file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Formato esperado: CSV con columnas TCGplayer Id, Product Name, Add to Quantity
                </p>
              </div>

              {csvFile && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-900">
                    📄 Archivo seleccionado: <span className="font-semibold">{csvFile.name}</span>
                  </p>
                </div>
              )}

              {inventoryError && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{inventoryError}</p>
                </div>
              )}

              {inventorySuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{inventorySuccess}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={inventoryLoading || !csvFile}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inventoryLoading ? 'Cargando...' : 'Subir Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Información del Inventario</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• El archivo CSV debe contener la columna "TCGplayer Id" y "Add to Quantity".</li>
              <li>• El inventario se actualiza completamente con cada carga.</li>
              <li>• Los productos sin stock no se mostrarán como disponibles.</li>
              <li>• El inventario se almacena en memoria y se reinicia con cada deployment.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

