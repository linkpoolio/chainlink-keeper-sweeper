import axios from 'axios'

export const market = axios.create({
  baseURL: 'https://market.link/v1/',
  headers: {
    'x-access-key-id': process.env.ACCESS_KEY_ID,
    'x-secret-key': process.env.SECRET_KEY,
  },
})
