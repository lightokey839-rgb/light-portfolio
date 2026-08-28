import { lightTestTokenAbi } from "../abi/LightTestToken";
import { dexContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

type TokenKey = "lightUSD" | "lightDAI";

export function useFaucet(token: TokenKey) {
  const contract = dexContracts[token];
  const tx = useTransactionState();

  const claim = () => {
    if (!contract.address) return;
    return tx.send({
      address: contract.address,
      abi: lightTestTokenAbi,
      functionName: "faucet",
      args: [],
    });
  };

  return { ...tx, claim };
}
