"use client";

import { getHttpsUpgradeUrl } from "@/lib/runtime/is-secure-app-context";

export function HttpsRequiredPage() {
  const handleOpenSecure = () => {
    window.location.assign(getHttpsUpgradeUrl());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFC] px-5 py-12">
      <section
        className="w-full max-w-lg rounded-lg border border-[#E4E7EC] bg-white p-8 shadow-sm"
        aria-labelledby="https-required-title"
      >
        <p className="m-0 text-[10px] font-medium uppercase tracking-[0.28em] text-[#6B7280]">
          Connection
        </p>
        <h1
          id="https-required-title"
          className="mt-4 font-display text-3xl font-semibold leading-tight text-[#18110F]"
        >
          Secure connection required
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6B7280]">
          Wallet login and trading features require an encrypted HTTPS connection.
          Open the secure version of this page to continue.
        </p>
        <div className="mt-8">
          <button
            type="button"
            className="flex h-[42px] w-full items-center justify-center rounded-[8px] bg-[#18110F] text-sm font-medium text-white"
            onClick={handleOpenSecure}
          >
            Open secure version
          </button>
        </div>
      </section>
    </div>
  );
}
