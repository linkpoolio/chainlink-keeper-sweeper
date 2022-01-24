import axios from 'axios'

export const ethGas = axios.create({
  baseURL: `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETH_GAS_STATION_API_KEY}`,
})
