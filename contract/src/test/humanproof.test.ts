import { HumanProofSimulator } from "./humanproof-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("HumanProof smart contract", () => {
  it("accepts a fresh nullifier", () => {
    const sim = new HumanProofSimulator();
    const nullifier = new Uint8Array(32);
    nullifier[0] = 0x01;
    expect(() => sim.verify(nullifier)).not.toThrow();
  });

  it("rejects a duplicate nullifier", () => {
    const sim = new HumanProofSimulator();
    const nullifier = new Uint8Array(32);
    nullifier[0] = 0x42;
    sim.verify(nullifier);
    expect(() => sim.verify(nullifier)).toThrow();
  });

  it("accepts two different nullifiers", () => {
    const sim = new HumanProofSimulator();
    const n1 = new Uint8Array(32);
    n1[0] = 0x01;
    const n2 = new Uint8Array(32);
    n2[0] = 0x02;
    expect(() => sim.verify(n1)).not.toThrow();
    expect(() => sim.verify(n2)).not.toThrow();
  });
});
