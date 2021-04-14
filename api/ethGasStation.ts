import axios from 'axios'

export const ethGasStation = axios.create({
  baseURL: `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${process.env.ETH_GAS_API_KEY}`,
})
