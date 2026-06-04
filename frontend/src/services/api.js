import axios from 'axios'

const normalizarBaseURL = (url) => {
    const base = (url || 'http://localhost:3000/api').replace(/\/$/, '')
    return base.endsWith('/api') ? base : `${base}/api`
}

const api = axios.create({
    baseURL: normalizarBaseURL(import.meta.env.VITE_API_URL)
})

export default api
