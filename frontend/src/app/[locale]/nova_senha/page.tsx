"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import PageTransition from "@/components/page-transition/PageTransition";
import { resetPassword } from "@/services/service_refazSenha";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl"; // 🌍 Tradução

export default function NovaSenha() {
  const [newSenha, setNewSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const t = useTranslations("nova_senha"); // 🌍 Chave de tradução

  useEffect(() => {
    const posters = [
      "poster1.png",
      "poster2.png",
      "poster3.png",
      "poster4.png",
      "poster5.png",
      "poster6.png",
      "poster7.png",
    ];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem("");

    if (!token) {
      setMensagem(t("token_invalido")); // 🌍
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, newSenha);

    setLoading(false);

    if (result.success) {
      toast.success(t("senha_sucesso")); // 🌍
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      toast.error(t("senha_erro")); // 🌍
    }
  };

  return (
    <PageTransition>
      <main className="w-full">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
            {/* Imagem à esquerda */}
            <div className="w-full md:w-1/2 mb-10 md:mb-0">
              <img
                src={randomImage}
                alt={t("poster_aleatorio_alt")} // 🌍
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Formulário à direita */}
            <div className="w-full md:w-1/2 p-8 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-8">
                {t("titulo")} {/* 🌍 */}
              </h1>
              <form
                className="space-y-4 max-w-md mx-auto md:mx-0"
                onSubmit={handleSubmit}
              >
                <input
                  type="password"
                  placeholder={t("placeholder")} // 🌍
                  value={newSenha}
                  onChange={(e) => setNewSenha(e.target.value)}
                  className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />

                <button
                  type="submit"
                  className="w-full bg-darkgreen hover:brightness-110 transition text-white font-semibold py-3 rounded-md"
                  disabled={loading}
                >
                  {loading ? t("salvando") : t("botao")} {/* 🌍 */}
                </button>

                {mensagem && (
                  <p className="text-red-400 text-sm text-center mt-2">
                    {mensagem}
                  </p>
                )}
              </form>
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
