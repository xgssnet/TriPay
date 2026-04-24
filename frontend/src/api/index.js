import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

export const uploadQRCodes = (formData) => {
  return api.post('/api/qrcode', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getQRCode = (id) => {
  return api.get(`/api/qrcode/${id}`)
}

export const getHealth = () => {
  return api.get('/api/health')
}