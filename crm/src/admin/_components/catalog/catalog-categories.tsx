"use client"

import { useEffect, useState } from 'react'
import { catalogApi } from './libs/catalog-api'
import type { CatalogCategory } from './types/catalog'

export default function CatalogCategories() {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const cats = await catalogApi.getCategories()
        if (!mounted) return
        setCategories(cats)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load categories')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Catalog Categories</h2>
        <div className="text-sm text-gray-500">{categories.length} categories</div>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-t">
                  <td className="p-2 font-medium">{cat.name}</td>
                  <td className="p-2 text-gray-700">{cat.description || '-'}</td>
                  <td className="p-2 text-gray-500">{new Date(cat.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
