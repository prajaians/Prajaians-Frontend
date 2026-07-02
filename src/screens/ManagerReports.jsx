import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ManagerReports = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalCategories: 0,
    totalRecipes: 0,
    totalIngredients: 0,
    totalVendors: 0,
    totalPurchases: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        const [
          staffRes,
          categoriesRes,
          recipesRes,
          ingredientsRes,
          vendorsRes,
          purchasesRes
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllStaff`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllCategory`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllRecipe`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllIngredient`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllVendor`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllPurchase`, { headers: { token } })
        ])

        setStats({
          totalStaff: staffRes.data?.data?.length || 0,
          totalCategories: categoriesRes.data?.data?.length || 0,
          totalRecipes: recipesRes.data?.data?.length || 0,
          totalIngredients: ingredientsRes.data?.data?.length || 0,
          totalVendors: vendorsRes.data?.data?.length || 0,
          totalPurchases: purchasesRes.data?.data?.length || 0
        })
      } catch (err) {
        setError('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-['Playfair_Display',serif] text-emerald-300 font-semibold">
          Reports
        </h2>
        <p className="text-sm text-emerald-500/60 mt-1">
          Overview of your cafe operations
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-5 h-5 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-emerald-500/50">Loading reports...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Staff</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalStaff}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Categories</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalCategories}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Recipes</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalRecipes}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Ingredients</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalIngredients}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Vendors</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalVendors}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-wider">Purchases</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.totalPurchases}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerReports