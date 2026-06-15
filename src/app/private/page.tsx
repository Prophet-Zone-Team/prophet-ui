import dynamic from "next/dynamic";

const PrivateTopupPage = dynamic(
  () =>
    import("@/views/portfolio/private-topup").then((mod) => mod.PrivateTopupPage),
  { loading: () => null },
);

export default function Page() {
  return <PrivateTopupPage />;
}
