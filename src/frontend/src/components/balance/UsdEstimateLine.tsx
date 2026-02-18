import React from 'react';

interface UsdEstimateLineProps {
  btcAmount: bigint | number;
  btcPriceUsd: number | null | undefined;
  isLoading?: boolean;
}

export default function UsdEstimateLine({ btcAmount, btcPriceUsd, isLoading }: UsdEstimateLineProps) {
  if (isLoading) {
    return (
      <div className="mt-2 space-y-1">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const btcAmountNumber = typeof btcAmount === 'bigint' ? Number(btcAmount) : btcAmount;

  if (!btcPriceUsd || btcAmountNumber === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-2">
        USD value unavailable
      </p>
    );
  }

  const estimatedUsdValue = (btcAmountNumber * btcPriceUsd).toFixed(2);

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-muted-foreground">
        ≈ ${estimatedUsdValue} USD
      </p>
      <p className="text-xs text-muted-foreground italic">
        Estimate only. USD value may fluctuate with market price.
      </p>
    </div>
  );
}
