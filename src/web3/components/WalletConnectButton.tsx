import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { supportedChain, chainMeta } from "../config/chains";
import "./WalletConnectButton.css";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Handles every wallet-connection state this dApp can be in: no wallet
 * extension, disconnected, connecting, connected on the wrong network,
 * and connected on Sepolia. This is the one component every Web3 project
 * page on the portfolio should reuse rather than re-implementing connect
 * logic per page.
 */
export default function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const injectedConnector = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const hasWalletExtension = typeof window !== "undefined" && Boolean((window as any).ethereum);

  if (!isConnected) {
    if (!hasWalletExtension) {
      return (
        <a
          className="wallet-btn wallet-btn--muted"
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
        >
          Install a wallet
        </a>
      );
    }
    return (
      <div className="wallet-connect">
        <button
          type="button"
          className="wallet-btn"
          onClick={() => injectedConnector && connect({ connector: injectedConnector })}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        {error && (
          <p className="wallet-connect__error" role="status">
            {error.message.includes("rejected") ? "Connection cancelled." : "Couldn't connect. Please try again."}
          </p>
        )}
      </div>
    );
  }

  if (chainId !== supportedChain.id) {
    return (
      <button
        type="button"
        className="wallet-btn wallet-btn--warn"
        onClick={() => switchChain({ chainId: supportedChain.id })}
        disabled={isSwitching}
        aria-busy={isSwitching}
      >
        {isSwitching ? "Switching…" : `Switch to ${chainMeta.name}`}
      </button>
    );
  }

  return (
    <div className="wallet-connected">
      <span className="wallet-connected__network" aria-label={`Connected to ${chainMeta.name}`}>
        {chainMeta.name}
      </span>
      <span className="wallet-connected__address">{address ? truncateAddress(address) : ""}</span>
      <button type="button" className="wallet-btn wallet-btn--ghost" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
