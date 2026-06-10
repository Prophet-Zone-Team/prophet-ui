import { deriveDepositWallet } from "@polymarket/builder-relayer-client";
import { concat, encodeAbiParameters, getCreate2Address, keccak256, pad, toHex } from "viem";

const ERC1967_BEACON_CONST1 =
  "0xb3582b35133d50545afa5036515af43d6000803e604d573d6000fd5b3d6000f3";
const ERC1967_BEACON_CONST2 =
  "0x1b60e01b36527fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6c";
const ERC1967_BEACON_CONST3 = "0x60195155f3363d3d373d3d363d602036600436635c60da";
const ERC1967_BEACON_PREFIX = 0x6100523d8160233d3973n;

export function deriveUupsDepositWallet(
  owner: string,
  factory: string,
  implementation: string,
) {
  return deriveDepositWallet(owner, factory, implementation);
}

export function deriveBeaconDepositWallet(
  owner: string,
  factory: string,
  beacon: string,
) {
  const args = depositWalletArgs(owner, factory);
  const salt = keccak256(args);
  const bytecodeHash = initCodeHashERC1967Beacon(beacon, args);

  return getCreate2Address({
    from: factory as `0x${string}`,
    salt,
    bytecodeHash,
  });
}

function depositWalletArgs(owner: string, factory: string) {
  const walletId = pad(owner as `0x${string}`, { dir: "left", size: 32 });

  return encodeAbiParameters(
    [{ type: "address" }, { type: "bytes32" }],
    [factory as `0x${string}`, walletId],
  );
}

function initCodeHashERC1967Beacon(beacon: string, args: `0x${string}`) {
  const n = BigInt((args.length - 2) / 2);
  const combined = ERC1967_BEACON_PREFIX + (n << 56n);

  return keccak256(
    concat([
      toHex(combined, { size: 10 }),
      beacon as `0x${string}`,
      ERC1967_BEACON_CONST3,
      ERC1967_BEACON_CONST2,
      ERC1967_BEACON_CONST1,
      args,
    ]),
  );
}
