import { BlockExplorer } from "./block-explorer";

export class Chain {
    constructor(id, name, decimal, explorerUrl, 
      explorerAddr, explorerTx) {
      this.id = id;
      this.name = name;
      this.decimal = decimal;
      this.blockExplorer = new BlockExplorer(
        explorerUrl, 
        explorerAddr, 
        explorerTx);
    }
  }