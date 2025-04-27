"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { registerUser } from "@/services/service_cadastro";
import { Container } from "@/components/container";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/page-transition/PageTransition";
import toast from 'react-hot-toast';
import IMask from 'imask';

export default function Cadastro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [date, setDate] = useState("");
  const [gender, setGender] = useState("");
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const [mensagem, setMensagem] = useState("");

  const router = useRouter(); // Hook para redirecionamento
  const t = useTranslations("cadastro");
  const locale = useLocale();

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

  const nameRegex = /^[A-Za-zÀ-ÿ\s]{3,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*\d).{5,}$/;

  const isValidDate = (date: string): boolean => {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;

    if (!dateRegex.test(date)) return false;

    const [day, month, year] = date.split("/").map(Number);

    if (year < 1900 || year > 2025) return false;

    const parsedDate = new Date(`${year}-${month}-${day}`);
    return (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() + 1 === month &&
      parsedDate.getDate() === day
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = IMask.createMask({
      mask: '00/00/0000',
    });
    masked.resolve(e.target.value);
    setDate(masked.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem("");

    const [day, month, year] = date.split('/');
    const birthDate = `${year}-${month}-${day}`;

    if (!nameRegex.test(name)) {
      toast.error(t("invalid_name"));
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error(t("invalid_email"));
      return;
    }

    if (!passwordRegex.test(senha)) {
      toast.error(t("invalid_senha"));
      return;
    }

    if (!isValidDate(date)) {
      toast.error(t("invalid_date"));
      return;
    }

    const response = await registerUser(name, email, senha, birthDate, gender);

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
                alt="Poster aleatório"
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
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="text"
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="password"
                  placeholder={t("senha")}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  placeholder={t("birthday")}
                  value={date}
                  onChange={handleDateChange}
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                >
                  <option value="" disabled hidden>{t("Select_Gender")}</option>
                  <option value="MASC" className="text-emerald-500 bg-black">{t("M_Gender")}</option>
                  <option value="FEM" className="text-emerald-500 bg-black">{t("F_Gender")}</option>
                  <option value="OTHER" className="text-emerald-500 bg-black">{t("O_Gender")}</option>
                </select>
                <button
                  type="submit"
                  className="text-white- border border-emerald-500 rounded-md p-2 focus:outline-none w-80 bg-emerald-500 mt-4"
                >
                  {t("botao")}
                </button>
                <span
                  onClick={() => router.push(`/${locale}/login`)}
                  className="text-emerald-400 hover:underline mt-4 cursor-pointer"
                >
                  {t("possui_conta")}
                </span>
              </form>
              {mensagem && <p className="text-gray-400 mt-2">{mensagem}</p>}
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
