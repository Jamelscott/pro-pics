import AppTabs from "@/components/AppTabs";
import { TabBarVisibilityContext } from "@/components/TabBarVisibilityContext";
import { useState } from "react";

export default function TabLayout() {
  const [tabsHidden, setTabsHidden] = useState(false);

  return (
    <TabBarVisibilityContext.Provider value={setTabsHidden}>
      <AppTabs hidden={tabsHidden} />
    </TabBarVisibilityContext.Provider>
  );
}
