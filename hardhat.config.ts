import { HardhatUserConfig } from 'hardhat/config'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'

const balance = '100000000000000000000'
const accounts = [
  '0d7735a7965a9d928b1281ef0eb7d930630ca7bb77687a3e12c298709a81c0ab',
  '9653f05d3671b99f4d2263fc7edc1e03ddbd6611fbed5ef16fe947f2fa212d92',
  '98d02c3609fa7048a2e9242caf5fb685d1ee062faded9460f24cce9ab3cb516d',
  '73026645a77a51ebd812fd8780137f9b532a43cfadf379d1882dbfe5046bbff9',
  '73c8d46d8610c89d3f727fdd18099d9a142878bf5e010e65ba9382b8bb030b06',
  '630c184b1bb553100f94dc0dc8234b9334e0bf2e5595f83b1c494e09d5f5713a',
]

const config: HardhatUserConfig = {
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts,
    },
    rinkeby: {
      url: '',
      accounts,
    },
    ropsten: {
      url: '',
      accounts,
    },
    mainnet: {
      url: '',
      accounts,
    },
    binance: {
      url: '',
      accounts,
    },
    hardhat: {
      chainId: 7777,
      accounts: accounts.map((acct) => ({ privateKey: acct, balance })),
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
}

export default config
