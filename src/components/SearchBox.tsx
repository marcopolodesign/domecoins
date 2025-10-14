'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchBoxProps {
  variant?: 'header' | 'hero'
  placeholder?: string
  onSearch?: (query: string) => void
}

export default function SearchBox({ 
  variant = 'header', 
  placeholder = 'Probá buscando "Pikachu Crown"',
  onSearch 
}: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery)
      } else {
        // Default behavior: navigate to cards page with search filter
        window.location.href = `/cards?search=${encodeURIComponent(searchQuery)}`
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  if (variant === 'hero') {
    // Large hero version
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        <div className="flex items-center bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="pl-6 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-4 py-5 text-lg border-0 focus:ring-0 focus:outline-none"
          />
          <button
            type="submit"
            className="px-8 py-5 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Buscar
          </button>
        </div>
      </form>
    )
  }

  // Header version
  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
      <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-300">
        <div className="pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm border-0 focus:ring-0 focus:outline-none"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors duration-200"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}

