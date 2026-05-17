import { HumanProof, type HumanProofPrivateState, witnesses } from '@midnight-ntwrk/humanproof-contract';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { deployContract } from '@midnight-ntwrk/midnight-js/contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js/types';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Buffer } from 'buffer';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js/utils';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Intent, Signature, ZswapSecretKeys, DustSecretKey } from '@midnight-ntwrk/ledger-v8';
import type { DeployedHumanProofContract, HumanProofCircuits, HumanProofProviders } from './common-types.js';
import { HumanProofPrivateStateId } from './common-types.js';

// @ts-expect-error needed for Apollo GraphQL subscriptions
globalThis.WebSocket = WebSocket;

const currentDir = path.resolve(fileURLToPath(import.meta.url), '..');
const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'humanproof');

setNetworkId('undeployed');

const config = {
  indexer: 'http://127.0.0.1:8088/api/v3/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v3/graphql/ws',
  node: 'http://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
};

// Genesis seed for standalone — has pre-funded tokens in dev mode
const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const compiledContract = CompiledContract.make('humanproof', HumanProof.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ZswapSecretKeys;
  dustSecretKey: DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

let deployedContract: DeployedHumanProofContract | null = null;

// In-memory set for optimistic duplicate detection (before on-chain confirmation)
const usedNullifiersLocal = new Set<string>();

const deriveKeysFromSeed = (seed: string) => {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Failed to initialize HDWallet from seed');
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivationResult.type !== 'keysDerived') throw new Error('Failed to derive keys');
  hdWallet.hdWallet.clear();
  return derivationResult.keys;
};

const buildShieldedConfig = () => ({
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS },
  provingServerUrl: new URL(config.proofServer),
  relayURL: new URL(config.node.replace(/^http/, 'ws')),
});

const buildUnshieldedConfig = () => ({
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS },
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
});

const buildDustConfig = () => ({
  networkId: getNetworkId(),
  costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
  indexerClientConnection: { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS },
  provingServerUrl: new URL(config.proofServer),
  relayURL: new URL(config.node.replace(/^http/, 'ws')),
});

const signTransactionIntents = (
  tx: { intents?: Map<number, any> },
  signFn: (payload: Uint8Array) => Signature,
  proofMarker: 'proof' | 'pre-proof',
): void => {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize<ledger.SignatureEnabled, ledger.Proofish, ledger.PreBinding>(
      'signature', proofMarker, 'pre-binding', intent.serialize(),
    );
    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: ledger.UtxoSpend, i: number) => cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: ledger.UtxoSpend, i: number) => cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
};

const createWalletAndMidnightProvider = async (ctx: WalletContext): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  return {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx, ttl?) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      }
      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx) => ctx.wallet.submitTransaction(tx) as any,
  };
};

const registerForDustGeneration = async (wallet: WalletFacade, unshieldedKeystore: UnshieldedKeystore): Promise<void> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  if (state.dust.availableCoins.length > 0) {
    console.log(`  ✓ DUST available: ${state.dust.balance(new Date()).toLocaleString()}`);
    return;
  }
  const nightUtxos = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length > 0) {
    console.log(`  Registering ${nightUtxos.length} NIGHT UTXO(s) for dust generation...`);
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      nightUtxos,
      unshieldedKeystore.getPublicKey(),
      (payload) => unshieldedKeystore.signData(payload),
    );
    const finalized = await wallet.finalizeRecipe(recipe);
    await wallet.submitTransaction(finalized);
  }
  console.log('  Waiting for DUST tokens...');
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s) => s.isSynced),
      Rx.filter((s) => s.dust.balance(new Date()) > 0n),
    ),
  );
  const finalState = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  console.log(`  ✓ DUST ready: ${finalState.dust.balance(new Date()).toLocaleString()}`);
};

export const initializeMidnight = async (): Promise<void> => {
  console.log('  Building wallet from genesis seed...');
  const keys = deriveKeysFromSeed(GENESIS_SEED);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

  const walletConfig = {
    ...buildShieldedConfig(),
    ...buildUnshieldedConfig(),
    ...buildDustConfig(),
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) => DustWallet(cfg).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  const ctx: WalletContext = { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };

  console.log('  Syncing with network...');
  await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  console.log('  ✓ Synced');

  const syncedState = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const balance = syncedState.unshielded.balances[unshieldedToken().raw] ?? 0n;
  if (balance === 0n) {
    console.log('  Waiting for funds...');
    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(10_000),
        Rx.filter((s) => s.isSynced),
        Rx.map((s) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
        Rx.filter((b) => b > 0n),
      ),
    );
  }

  await registerForDustGeneration(wallet, unshieldedKeystore);

  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider<HumanProofCircuits>(zkConfigPath);
  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;

  const providers: HumanProofProviders = {
    privateStateProvider: levelPrivateStateProvider<typeof HumanProofPrivateStateId>({
      privateStateStoreName: 'humanproof-private-state',
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };

  console.log('  Deploying HumanProof contract...');
  deployedContract = await deployContract(providers, {
    compiledContract,
    privateStateId: HumanProofPrivateStateId,
    initialPrivateState: { localState: 0 },
  });

  console.log(`  ✓ Contract deployed at: ${deployedContract.deployTxData.public.contractAddress}`);
};

export const verifyNullifier = async (nullifierHex: string): Promise<string> => {
  if (!deployedContract) throw new Error('Midnight not initialized');

  if (usedNullifiersLocal.has(nullifierHex)) {
    throw new Error('Nullifier already used');
  }

  usedNullifiersLocal.add(nullifierHex);

  const nullifierBytes = Buffer.from(nullifierHex, 'hex');

  // Submit to chain async — ZK proof generation takes 30-60s, too slow to await in HTTP response
  deployedContract.callTx.verify(nullifierBytes).then((result) => {
    console.log(`  ✓ Nullifier confirmed on-chain, tx: ${result.public.txId}`);
  }).catch((err: Error) => {
    console.error(`  ✗ On-chain verify failed: ${err.message}`);
    usedNullifiersLocal.delete(nullifierHex);
  });

  return `optimistic-${Date.now()}`;
};
