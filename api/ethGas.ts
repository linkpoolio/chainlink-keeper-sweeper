import axios from 'axios'

export const ethGas = axios.create({
  baseURL: `https://www.gasnow.org/api/v3/gas/price?utm_source=:${process.env.GAS_NOW_APP_NAME}`,
})
