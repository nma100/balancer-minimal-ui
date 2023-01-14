import { bnf } from "../utils/bn";
import { nf } from "./number";
import { Modal, Toast } from 'bootstrap';

export function openModal(id) {
  Modal.getOrCreateInstance(`#${id}`).show();
}

export function hideModal(id) {
  Modal.getOrCreateInstance(`#${id}`).hide();
}

export function openToast(id) {
  Toast.getOrCreateInstance(`#${id}`).show();
}

export function reload() {
  window.location.reload();
}

export const truncateAddress = (address) => {
    if (!address) return 'No Account';
    const match = address.match(
      /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/
    );
    if (!match) return address;
    return `${match[1]}....${match[2]}`;
};

export const dollar = bn => bn === false ? 'N/A' : `$${bnf(bn)}`;
export const fdollar = n => `$${ n ? nf(n) : '0.00'}`;
