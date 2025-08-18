"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import PageTransition from "@/components/layout/PageTransition";
import { Container } from "@/components/layout/Container";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { loginUser } from "@/services/user/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const [mensagem, setMensagem] = useState("");

  const { loadMemberData } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("login");
  const locale = useLocale();

  useEffect(() => {
    const posters = ["poster1.png","poster2.png","poster3.png","poster4.png","poster5.png","poster6.png","poster7.png"];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem("");
    setLoading(true);

    // Evita ruído com token expirado no localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }

    try {
      const { success } = await loginUser(email.trim(), senha);
      if (success) {
        await loadMemberData(); // usa o token recém-salvo
        toast.success(t("login_sucesso"));
        // volta pra home (ou mantém rota anterior se quiser)
        router.push("/");
      }
    } catch (e: any) {
      toast.error(t("login_erro"));
      setMensagem(e?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="w-full h-full flex">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
            <div className="w-full md:w-1/2 mb-10 md:mb-0">
              <img src={randomImage} alt="Poster aleatório" className="w-full h-[400px] object-cover rounded-lg shadow-lg" />
            </div>

            <div className="w-full md:w-1/2 p-8 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-8">{t("titulo")}</h1>
              <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto md:mx-0">
                <input
                  type="email"
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="password"
                  placeholder={t("senha")}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-darkgreen hover:brightness-110 transition text-white font-semibold py-3 rounded-md"
                  disabled={loading}
                >
                  {loading ? t("carregando") : t("botao")}
                </button>

                {mensagem && <p className="text-red-400 text-sm text-center mt-2">{mensagem}</p>}

                <div className="text-center">
                  <span onClick={() => router.push(`/${locale}/cadastro`)} className="text-emerald-400 hover:underline mt-4 cursor-pointer">
                    {t("cadastro")}
                  </span>
                </div>
                <div className="text-center">
                  <span onClick={() => router.push(`/${locale}/envia_email`)} className="text-emerald-400 hover:underline mt-4 cursor-pointer">
                    {t("esqueceu_senha")}
                  </span>
                </div>
                <div className="text-center">
                  <span onClick={() => router.push(`/${locale}/refaz_email`)} className="text-emerald-400 hover:underline mt-4 cursor-pointer">
                    {t("mudar_email")}
                  </span>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
