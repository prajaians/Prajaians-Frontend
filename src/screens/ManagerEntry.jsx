import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ManagerPanel from './ManagerPanel'

const ManagerEntry = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'manager' && userData.role !== 'admin') {
        navigate('/staffPanel', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return <ManagerPanel />
}

export default ManagerEntry