"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { registerUser } from "@/services/service_cadastro";
import { Container } from "@/components/container";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/page-transition/PageTransition";
import toast from 'react-hot-toast';
import {Link} from '@/i18n/navigation';

export default function Cadastro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const [mensagem, setMensagem] = useState("");

  const router = useRouter();
  const t = useTranslations("cadastro");
  const locale = useLocale();

  useEffect(() => {
    const posters = [
      "poster1.png", "poster2.png", "poster3.png",
      "poster4.png", "poster5.png", "poster6.png", "poster7.png",
    ];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem("");

    const response = await registerUser(name, email, senha);

    if (response.success) {
      toast.success(t("cadastro_sucesso"));
      router.push("/");
    } else {
      toast.error(t("cadastro_erro"));
    }

  };

  return (
    <PageTransition>
      <main className="w-full">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
            <div className="w-1/2 h-1/2 flex items-center justify-center">
              <img
                src={randomImage}
                alt="Poster"
                className="w-full object-cover rounded-lg shadow-lg"  
              />
            </div>
            <div className="w-1/2 h-screen flex flex-col items-center justify-center">
              <p className="text-white text-4xl mb-6">{t("titulo")}</p>
              <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 w-full">
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="text"
                  placeholder={t("nome")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="text"
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="password"
                  placeholder={t("senha")}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="text-white border border-emerald-500 rounded-md p-2 focus:outline-none w-80 bg-emerald-500 mt-4"
                >
                  {t("botao")}
                </button>
                <Link href="/login" className="text-emerald-400 hover:underline mt-4 " locale={locale as any}>
                  {t("possui_conta")}
                </Link>
              </form>
              {mensagem && <p className="text-gray-400 mt-2">{mensagem}</p>}
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
