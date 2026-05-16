import { HumanProof, type HumanProofPrivateState } from '@midnight-ntwrk/humanproof-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js/types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js/contracts';
import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';

export type HumanProofCircuits = ProvableCircuitId<HumanProof.Contract<HumanProofPrivateState>>;

export const HumanProofPrivateStateId = 'humanproofPrivateState' as const;

export type HumanProofProviders = MidnightProviders<
  HumanProofCircuits,
  typeof HumanProofPrivateStateId,
  HumanProofPrivateState
>;

export type HumanProofContractType = HumanProof.Contract<HumanProofPrivateState>;

export type DeployedHumanProofContract =
  | DeployedContract<HumanProofContractType>
  | FoundContract<HumanProofContractType>;
