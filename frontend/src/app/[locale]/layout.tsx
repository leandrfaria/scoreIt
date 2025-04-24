import "@/app/globals.css";
import { Header } from "@/components/header";
import { MemberProvider } from "@/context/MemberContext";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { IntlProvider } from "./intl-provider";
import { TabProvider } from "@/context/TabContext";

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
          </TabProvider>
        </IntlProvider>
      </AuthProvider>
    </MemberProvider>
  );
}
