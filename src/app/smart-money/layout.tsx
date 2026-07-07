import { SmartMoneyCopyWalletRefresh } from "@/views/copy-trade/smart-money-copy-wallet-refresh";

export default function SmartMoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmartMoneyCopyWalletRefresh />
      {children}
    </>
  );
}
