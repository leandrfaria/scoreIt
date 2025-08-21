"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

// carrega o TabSwitcher real (client isolado)
const TabSwitcherMediaType = dynamic(
  () =>
    import("../Others/TabSwitcherMediaType").then(
      (m) => m.TabSwitcherMediaType
    ),
);

export default function TabSwitcherGuard() {
  const { isLoggedIn } = useAuthContext();
  const pathname = usePathname();

  // mesma regra do header antigo
  const showMediaTypeMenu =
    !!isLoggedIn &&
    !pathname.endsWith("/feed") &&
    !pathname.includes("/series") &&
    !pathname.includes("/album") &&
    !pathname.includes("/movie");

  if (!showMediaTypeMenu) return null;

  return <TabSwitcherMediaType />;
}
