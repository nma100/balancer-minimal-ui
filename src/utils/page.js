import { RoutePath } from "..";
import { bnf, bnc } from "../utils/bn";
import { nf } from "./number";
import { Modal, Toast } from 'bootstrap';

export const UNAVAILABLE = 'N/A';

export function reload() {
  const { location } = window;
  const { Index, JoinPool, ExitPool } = RoutePath;
  if (location.hash.includes(JoinPool) || location.hash.includes(ExitPool)) {
    location.assign(Index);
  } else {
    location.reload();
  }
}

export function blur() {
  document.querySelector('body').style.opacity = 0.75;
}

export function activeInvestMenu(active = true) {
  document
    .querySelectorAll('.nav-item > .invest')
    .forEach(elem => active 
      ? elem.classList.add('active') 
      : elem.classList.remove('active'));
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
    if (bn === false) return UNAVAILABLE;
    return `$${compact ? bnc(bn) : bnf(bn)}`;
} 

export const fusd = n => `$${ nf(n || 0) }`;

export const weight = w => `${(parseFloat(w) * 100).toFixed()}%`;

