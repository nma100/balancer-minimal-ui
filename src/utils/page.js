import { bnumf } from "../utils/bnum"

export const truncateAddress = (address) => {
    if (!address) return 'No Account';
    const match = address.match(
      /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/
    );
    if (!match) return address;
    return `${match[1]}....${match[2]}`;
};

export const dollar = bn => bn === false ? 'N/A' : `$${bnumf(bn)}`;
export const ndollar = n => `$${n ? n.toFixed(2) : '0.00'}`;
