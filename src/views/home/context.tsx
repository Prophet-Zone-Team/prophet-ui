import { createContext, useContext } from "react";

export interface HomeContextType {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const HomeContext = createContext<HomeContextType>({
  searchValue: "",
  setSearchValue: () => { }
});

export function HomeProvider({ children, value }: { children: React.ReactNode, value: HomeContextType }) {
  return (
    <HomeContext.Provider value={value}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHomeContext() {
  return useContext(HomeContext);
}
