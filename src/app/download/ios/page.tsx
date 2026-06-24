import type { Metadata } from "next";
import dynamic from "next/dynamic";

const IosDownloadPage = dynamic(
  () =>
    import("@/views/download/ios-download-page").then((mod) => mod.IosDownloadPage),
  { loading: () => null }
);

export const metadata: Metadata = {
  title: "Prophet",
  description: "Download Prophet for iOS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black"
  },
  formatDetection: {
    telephone: false
  }
};

export default function Page() {
  return <IosDownloadPage />;
}
