/**
 * Mapping of the TokenLists used on each network
 */
export const TOKEN_LIST_MAP = {
  '1': {
    Balancer: {
      Default:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/listed-old.tokenlist.json',
      Vetted:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json',
    },
    External: [
      'ipns://tokens.uniswap.org',
      'https://www.gemini.com/uniswap/manifest.json',
    ],
  },
  '5': {
    Balancer: {
      Default:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/listed-old.tokenlist.json',
      Vetted:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json',
    },
    External: [],
  },
  '10': {
    Balancer: {
      Default: '',
      Vetted: '',
    },
    External: [],
  },
  '137': {
    Balancer: {
      Default:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/listed-old.tokenlist.json',
      Vetted:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json',
    },
    External: [
      'https://unpkg.com/quickswap-default-token-list@1.0.67/build/quickswap-default.tokenlist.json',
    ],
  },
  '42161': {
    Balancer: {
      Default:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/listed-old.tokenlist.json',
      Vetted:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json',
    },
    External: [],
  },
  '100': {
    Balancer: {
      Default:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/listed-old.tokenlist.json',
      Vetted:
        'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json',
    },
    External: [
      'https://unpkg.com/@1hive/default-token-list@latest/build/honeyswap-default.tokenlist.json',
    ],
  },
};