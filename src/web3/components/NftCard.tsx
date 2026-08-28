import type { ReactNode } from "react";
import { useNftMetadata } from "../hooks/useNftCollection";
import "./NftCard.css";

export default function NftCard({ tokenId, footer }: { tokenId: bigint; footer?: ReactNode }) {
  const { metadata, isLoading } = useNftMetadata(tokenId);

  return (
    <div className="nft-card">
      <div className="nft-card__image-wrap">
        {isLoading || !metadata ? (
          <div className="nft-card__image-placeholder" aria-hidden="true" />
        ) : (
          <img src={metadata.image} alt={metadata.name} loading="lazy" className="nft-card__image" />
        )}
      </div>
      <div className="nft-card__body">
        <p className="nft-card__name">{metadata?.name ?? `Light Demo #${tokenId}`}</p>
        <p className="nft-card__id">Token ID {tokenId.toString()}</p>
        {footer && <div className="nft-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
