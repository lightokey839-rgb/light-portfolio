import { chainMeta, explorerAddressUrl } from "../config/chains";
import { deploymentStatusLabel } from "../config/contracts";
import "./ContractVerificationPanel.css";

type ContractEntry = {
  name: string;
  address: string | null;
  verified: boolean;
  sourcePath: string;
};

function truncate(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

/**
 * The single standardized way every Web3 project on this portfolio shows
 * its contract proof: name, network, address, explorer link, verification
 * status, source link. When a contract hasn't been deployed yet, this
 * renders an honest "Deployment pending" row instead of a fabricated
 * address — never the reverse. Likewise, the "Source" link only renders
 * when a real GitHub repo URL is configured (githubBasePath !== null) —
 * never a guessed or placeholder link.
 */
export default function ContractVerificationPanel({
  contracts,
  githubBasePath,
}: {
  contracts: ContractEntry[];
  githubBasePath: string | null;
}) {
  return (
    <div className="contract-panel">
      <div className="contract-panel__head">
        <span>Contract</span>
        <span>Network</span>
        <span>Status</span>
        <span>Links</span>
      </div>
      {contracts.map((c) => (
        <div className="contract-panel__row" key={c.name}>
          <div className="contract-panel__name">
            <span>{c.name}</span>
            {c.address && (
              <code className="contract-panel__address" title={c.address}>
                {truncate(c.address)}
              </code>
            )}
          </div>
          <span className="contract-panel__network">
            {chainMeta.name} <span className="contract-panel__chainid">({chainMeta.id})</span>
          </span>
          <span
            className={`contract-panel__status${c.address ? (c.verified ? " contract-panel__status--verified" : " contract-panel__status--deployed") : " contract-panel__status--pending"}`}
          >
            {deploymentStatusLabel(c)}
          </span>
          <span className="contract-panel__links">
            {c.address ? (
              <a href={explorerAddressUrl(c.address)} target="_blank" rel="noreferrer">
                Explorer ↗
              </a>
            ) : (
              <span className="contract-panel__links-empty">—</span>
            )}
            {githubBasePath && c.sourcePath && (
              <a href={`${githubBasePath}/blob/main/${c.sourcePath}`} target="_blank" rel="noreferrer">
                Source ↗
              </a>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
