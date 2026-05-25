"use client";


import { PageBack } from "@/components/ui/page-back";


export function TradeSimpleHeaderToolbar() {


  return (
    <div className="absolute inset-x-0 top-2 z-20 flex items-center justify-between px-4 pt-2 sm:px-10">
      <PageBack className="text-white" />
    </div>
  );
}
