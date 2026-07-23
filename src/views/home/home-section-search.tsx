"use client";

import { useEffect, useState } from "react";

import { HomeSearchInput } from "@/views/home/home-search-input";
import { useHomeContext } from "./context";

export function HomeSectionSearch() {
  const { searchValue, setSearchValue } = useHomeContext();
  const [innerValue, setInnerValue] = useState("");

  useEffect(() => {
    setInnerValue(searchValue);
  }, [searchValue]);

  return (
    <div className="hidden -translate-y-3 md:flex">
      <HomeSearchInput
        value={innerValue}
        onChange={(next) => {
          setInnerValue(next);
          setSearchValue?.(next);
        }}
        maxLength={10}
      />
    </div>
  );
}
