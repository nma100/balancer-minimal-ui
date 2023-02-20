import { bnf, bnc } from "../utils/bn";
import { nf } from "./number";
import { Modal, Toast } from 'bootstrap';

export function reload() {
  window.location.reload();
}

export function blur() {
  document.querySelector('body').style.opacity = 0.75;
}

export function openModal(id) {
  Modal.getOrCreateInstance(`#${id}`).show();
}

export function hideModal(id) {
  Modal.getOrCreateInstance(`#${id}`).hide();
}

export function openToast(id) {
  Toast.getOrCreateInstance(`#${id}`).show();
}

export const truncateAddress = (address) => {
    if (!address) return 'No Account';
    const match = address.match(
      /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/
    );
    if (!match) return address;
    return `${match[1]}....${match[2]}`;
};

export const usd = (bn, compact = false) => {
    if (bn === false) return 'N/A';
    return `$${compact ? bnc(bn) : bnf(bn)}`;
} 

export const fusd = n => `$${ nf(n || 0) }`;
