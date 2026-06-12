"use client";

import { useContext } from "react";

import { MigrateContext, type MigrateContextValue } from "@/context/migrate/migrate-context";

export function useMigrate(): MigrateContextValue {
  const context = useContext(MigrateContext);

  if (!context) {
    throw new Error("useMigrate must be used within MigrateProvider.");
  }

  return context;
}

export function useMigrateOptional(): MigrateContextValue | null {
  return useContext(MigrateContext);
}
