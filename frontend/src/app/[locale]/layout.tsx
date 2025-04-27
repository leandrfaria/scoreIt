import "@/app/globals.css";
import { Header } from "@/components/header";
import { MemberProvider } from "@/context/MemberContext";
import { AuthProvider } from "@/context/AuthContext";
import { TabProvider } from "@/context/TabContext";
import { FavoriteProvider } from "@/context/FavoriteContext"; // 🆕 IMPORTAMOS O FAVORITE CONTEXT
import { Toaster } from "react-hot-toast";
import { IntlProvider } from "./intl-provider";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <MemberProvider>
      <AuthProvider>
        <IntlProvider locale={params.locale}>
          <TabProvider>
            <FavoriteProvider> {/* 🆕 Envolvendo aqui */}
              <Header />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#333",
                    color: "#fff",
                  },
                }}
              />
              {children}
            </FavoriteProvider>
          </TabProvider>
        </IntlProvider>
      </AuthProvider>
    </MemberProvider>
  );
}
