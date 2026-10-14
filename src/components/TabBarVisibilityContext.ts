import { createContext, useContext } from "react";

export const TabBarVisibilityContext = createContext<
  ((hidden: boolean) => void) | null
>(null);

export function useSetTabBarHidden() {
  const setHidden = useContext(TabBarVisibilityContext);
  if (!setHidden) {
    throw new Error("Tab bar visibility requires the app tab layout.");
  }
  return setHidden;
}
