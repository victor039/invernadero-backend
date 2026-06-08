import axios from 'axios'

const DEFAULT_API_URL = 'https://invernadero-backend-pfgt.onrender.com/api'

const normalizarBaseURL = (url) => {
    const base = (url || DEFAULT_API_URL).replace(/\/$/, '')
    return base.endsWith('/api') ? base : `${base}/api`
}

const api = axios.create({
    baseURL: normalizarBaseURL(import.meta.env.VITE_API_URL)
})

export default api
