import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/humanproof/contract/index.js";
import { type HumanProofPrivateState, witnesses } from "../witnesses.js";

export class HumanProofSimulator {
  readonly contract: Contract<HumanProofPrivateState>;
  circuitContext: CircuitContext<HumanProofPrivateState>;

  constructor() {
    this.contract = new Contract<HumanProofPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext({ localState: 0 }, "0".repeat(64))
      );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public verify(nullifier: Uint8Array): void {
    this.circuitContext = this.contract.impureCircuits.verify(
      this.circuitContext,
      nullifier
    ).context;
  }
}
