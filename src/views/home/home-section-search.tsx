"use client";

import { useEffect, useMemo, useState } from "react";
import { useHomeContext } from "./context";

export function HomeSectionSearch(props: any) {
  const { searchValue, setSearchValue } = useHomeContext();

  const [innerValue, setInnerValue] = useState("");

  const isClose = useMemo(() => !!innerValue && innerValue.trim().length > 0, [innerValue]);

  const handleChange = (e: any) => {
    setInnerValue(e.target.value);
    setSearchValue?.(e.target.value);
  };

  useEffect(() => {
    setInnerValue(searchValue);
  }, [searchValue]);

  return (
    <div className="hidden md:flex -translate-y-3">
      <div className="relative h-[34px] border border-[#EBEBEB] bg-white rounded-2xl px-3 flex items-center gap-3">
        <img
          src="/icons/icon-search.svg"
          alt="Search"
          className="w-3.5 h-3.5 shrink-0 object-center object-contain"
        />
        <input
          type="text"
          maxLength={10}
          placeholder="Search"
          className="flex-1 pr-4 text-sm text-[#222429] placeholder:text-[#909090] outline-none border-0 h-full"
          value={innerValue}
          onChange={handleChange}
        />
        {
          isClose && (
            <button
              type="button"
              className="absolute right-3 z-[1] size-3.5 rounded-full overflow-hidden bg-[#EDEDED] hover:bg-[#cdcdcd] duration-150 flex justify-center items-center"
              onClick={() => handleChange({ target: { value: "" } })}
            >
              <img
                src="/icons/icon-close.svg"
                alt="Close"
                className="w-1.5 h-1.5 shrink-0 object-center object-contain"
              />
            </button>
          )
        }
      </div>
    </div>
  );
}
