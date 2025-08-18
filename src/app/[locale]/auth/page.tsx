"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageTransition from "@/components/layout/PageTransition";
import { Container } from "@/components/layout/Container";
import toast from "react-hot-toast";
import IMask from "imask";
import { useAuthContext } from "@/context/AuthContext";
import { loginUser, registerUser } from "@/services/user/auth";

type Tab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");

  // LOGIN state
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [msgLogin, setMsgLogin] = useState("");

  // SIGNUP state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [emailSign, setEmailSign] = useState("");
  const [senhaSign, setSenhaSign] = useState("");
  const [date, setDate] = useState("");
  const [gender, setGender] = useState("");
  const [msgSign, setMsgSign] = useState("");

  const [randomImage, setRandomImage] = useState("/posters/poster1.png");

  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const tLogin = useTranslations("login");
  const tSign = useTranslations("cadastro");
  const { loadMemberData } = useAuthContext();

  useEffect(() => {
    const q = (params.get("tab") || "").toLowerCase();
    if (q === "signup" || q === "cadastro") setTab("signup");
    if (q === "login") setTab("login");
  }, [params]);

  useEffect(() => {
    const posters = ["poster1.png","poster2.png","poster3.png","poster4.png","poster5.png","poster6.png","poster7.png"];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
  }, []);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgLogin("");
    setLoadingLogin(true);

    if (typeof window !== "undefined") localStorage.removeItem("authToken");

    try {
      const { success } = await loginUser(emailLogin.trim(), senhaLogin);
      if (success) {
        await loadMemberData();
        toast.success(tLogin("login_sucesso"));
        router.push("/");
      }
    } catch (err: any) {
      toast.error(tLogin("login_erro"));
      setMsgLogin(err?.message || "Erro ao fazer login.");
    } finally {
      setLoadingLogin(false);
    }
  };

  // SIGNUP
  const nameRegex = useMemo(() => /^[A-Za-zÀ-ÿ\s]{3,}$/, []);
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const passwordRegex = useMemo(() => /^(?=.*\d).{5,}$/, []);

  const isValidDate = (str: string) => {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
    if (!dateRegex.test(str)) return false;
    const [day, month, year] = str.split("/").map(Number);
    const parsed = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - parsed.getFullYear();
    return (
      parsed instanceof Date &&
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() + 1 === month &&
      parsed.getDate() === day &&
      (age > 18 ||
        (age === 18 &&
          (today.getMonth() > parsed.getMonth() ||
            (today.getMonth() === parsed.getMonth() && today.getDate() >= parsed.getDate())))) &&
      age < 120
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = IMask.createMask({ mask: "00/00/0000" });
    masked.resolve(e.target.value);
    setDate(masked.value);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setMsgSign("");

    if (!nameRegex.test(name)) { toast.error(tSign("invalid_name")); return; }
    if (!emailRegex.test(emailSign)) { toast.error(tSign("invalid_email")); return; }
    if (!passwordRegex.test(senhaSign)) { toast.error(tSign("invalid_senha")); return; }
    if (!isValidDate(date)) { toast.error(tSign("invalid_date")); return; }
    if (!gender) { toast.error(tSign("Select_Gender")); return; }

    const [d, m, y] = date.split("/");
    const birthDate = `${y}-${m}-${d}`;

    setIsSubmitting(true);
    try {
      const resp = await registerUser({
        name: name.trim(),
        email: emailSign.trim(),
        password: senhaSign,
        birthDate,
        gender,
      });
      if (resp.success) {
        toast.success(tSign("cadastro_sucesso"));
        setTab("login");
      }
    } catch (err: any) {
      toast.error(tSign("cadastro_erro"));
      setMsgSign(err?.message || "Falha no cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Segmented control (corrigido) ===
  const Segmented = () => (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="relative flex bg-black/30 border border-[var(--color-darkgreen)] rounded-full p-1 backdrop-blur-sm overflow-hidden">
        {/* slider com largura exata e movimento por 'left' */}
        <span
          className={[
            "absolute top-1 bottom-1",
            "w-[calc(50%-0.25rem)]", // 50% menos o padding (p-1 = 0.25rem)
            "rounded-full bg-darkgreen shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            tab === "login" ? "left-1" : "left-[calc(50%+0.25rem)]",
          ].join(" ")}
          aria-hidden
        />
        {/* buttons */}
        <button
          type="button"
          onClick={() => setTab("login")}
          className={[
            "relative z-10 flex-1 py-2 text-sm md:text-base font-semibold rounded-full",
            "transition-colors duration-300",
            tab === "login" ? "text-white" : "text-emerald-300 hover:text-emerald-200",
          ].join(" ")}
          aria-pressed={tab === "login"}
        >
          {tLogin("titulo")}
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={[
            "relative z-10 flex-1 py-2 text-sm md:text-base font-semibold rounded-full",
            "transition-colors duration-300",
            tab === "signup" ? "text-white" : "text-emerald-300 hover:text-emerald-200",
          ].join(" ")}
          aria-pressed={tab === "signup"}
        >
          {tSign("titulo")}
        </button>
      </div>
    </div>
  );

  return (
    <PageTransition>
      {/* BACKGROUND com imagem e overlay */}
      <main
        className="relative w-full overflow-hidden min-h-[calc(100vh-5rem)]"
        style={{
          backgroundImage: `url(${randomImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 -z-10 bg-black/80" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(transparent_62%,rgba(0,0,0,0.75))]" />

        <Container>
          <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-8">
            <div
              className={[
                "w-full max-w-xl",
                "rounded-2xl border border-[var(--color-darkgreen)]",
                "bg-black/40 backdrop-blur-md",
                "shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
                "px-6 sm:px-8 py-7",
              ].join(" ")}
            >
              <Segmented />
              <div className="relative">
                {/* LOGIN */}
                <div className={["transition-opacity duration-300", tab === "login" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute inset-0"].join(" ")}>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      type="email"
                      placeholder={tLogin("email")}
                      value={emailLogin}
                      onChange={(e) => setEmailLogin(e.target.value)}
                      className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <input
                      type="password"
                      placeholder={tLogin("senha")}
                      value={senhaLogin}
                      onChange={(e) => setSenhaLogin(e.target.value)}
                      className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-darkgreen hover:brightness-110 transition text-white font-semibold py-3 rounded-md disabled:opacity-60"
                      disabled={loadingLogin}
                    >
                      {loadingLogin ? tLogin("carregando") : tLogin("botao")}
                    </button>
                    {msgLogin && <p className="text-red-400 text-sm text-center mt-2">{msgLogin}</p>}
                    <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                      <span onClick={() => router.push(`/${locale}/envia_email`)} className="text-emerald-300 hover:text-emerald-200 transition cursor-pointer">
                        {tLogin("esqueceu_senha")}
                      </span>
                      <span onClick={() => router.push(`/${locale}/refaz_email`)} className="text-emerald-300 hover:text-emerald-200 transition cursor-pointer">
                        {tLogin("mudar_email")}
                      </span>
                    </div>
                  </form>
                </div>

                {/* SIGNUP */}
                <div className={["transition-opacity duration-300", tab === "signup" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute inset-0"].join(" ")}>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <input className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" placeholder={tSign("nome")} value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" placeholder={tSign("email")} value={emailSign} onChange={(e) => setEmailSign(e.target.value)} />
                    <input className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" type="password" placeholder={tSign("senha")} value={senhaSign} onChange={(e) => setSenhaSign(e.target.value)} />
                    <input className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={tSign("birthday")} value={date} onChange={handleDateChange} />
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="" disabled hidden className="bg-black">{tSign("Select_Gender")}</option>
                      <option value="MASC" className="text-emerald-500 bg-black">{tSign("M_Gender")}</option>
                      <option value="FEM" className="text-emerald-500 bg-black">{tSign("F_Gender")}</option>
                      <option value="OTHER" className="text-emerald-500 bg-black">{tSign("O_Gender")}</option>
                    </select>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-darkgreen hover:brightness-110 transition text-white font-semibold py-3 rounded-md disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmitting ? "Enviando..." : tSign("botao")}
                    </button>
                    {msgSign && <p className="text-red-400 text-sm text-center mt-2">{msgSign}</p>}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
