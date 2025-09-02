"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageTransition from "@/components/layout/Others/PageTransition";
import { Container } from "@/components/layout/Others/Container";
import toast from "react-hot-toast";
import IMask from "imask";
import { useAuthContext } from "@/context/AuthContext";
import { loginUser, registerUser, verifyToken } from "@/services/user/auth";

type Tab = "login" | "signup";
type BackendGender = "MASC" | "FEM" | "OTHER";

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
  const [gender, setGender] = useState<BackendGender | "">("");
  const [handle, setHandle] = useState("");
  const [msgSign, setMsgSign] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  const [randomImage, setRandomImage] = useState("/posters/poster1.png");

  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const tLogin = useTranslations("login");
  const tSign = useTranslations("cadastro");
  const { loadMemberData, setIsLoggedIn } = useAuthContext();

  useEffect(() => {
    const q = (params.get("tab") || "").toLowerCase();
    if (q === "signup" || q === "cadastro") setTab("signup");
    if (q === "login") setTab("login");
  }, [params]);

  useEffect(() => {
    const posters = [
      "poster1.png","poster2.png","poster3.png","poster4.png","poster5.png",
      "poster6.png","poster7.png","poster8.png","poster9.png","poster10.png",
      "poster11.png","poster12.png","poster13.png","poster14.png","poster15.png",
      "poster16.png","poster17.png","poster18.png","poster19.png","poster20.png",
      "poster21.png",
    ];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
  }, []);

  // ====== UI CLASSES (padronização visual) ======
  const FORM_WRAP =
    "w-full max-w-xl rounded-2xl border border-[var(--color-darkgreen)] bg-black/50 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.55)] px-6 sm:px-8 py-7";
  const GROUP_CLS = "flex flex-col gap-1.5";
  const LABEL_CLS = "text-sm font-medium text-emerald-200";
  const INPUT_CLS =
    "w-full h-11 px-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70 transition disabled:opacity-60 disabled:cursor-not-allowed";
  const BTN_PRIMARY =
    "w-full bg-darkgreen hover:brightness-110 transition text-white font-semibold py-3 rounded-md disabled:opacity-60 disabled:cursor-not-allowed";
  const LINK_CLS = "text-emerald-300 hover:text-emerald-200 transition cursor-pointer";

  // ====== LOGIN ======
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgLogin("");
    setLoadingLogin(true);

    if (typeof window !== "undefined") localStorage.removeItem("authToken");

    try {
      const { success, token } = await loginUser(emailLogin.trim(), senhaLogin);
      if (success) {
        await verifyToken(token);
        await loadMemberData();
        setIsLoggedIn(true);

        toast.success(tLogin("login_sucesso"));
        router.replace(`/${locale}`);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao fazer login.";
      const finalMessage = errorMessage.includes("Credenciais inválidas ou conta não confirmada")
        ? tLogin("login_erro")
        : errorMessage;
      toast.error(finalMessage);
      setMsgLogin(finalMessage);
    } finally {
      setLoadingLogin(false);
    }
  };

  // ====== SIGNUP ======
  const nameRegex = useMemo(() => /^[A-Za-zÀ-ÿ\s]{3,}$/, []);
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const passwordRegex = useMemo(() => /^(?=.*\d).{5,}$/, []);
  const handleRegex = useMemo(() => /^[a-zA-Z0-9_]{3,15}$/, []);

  const isValidDate = (str: string) => {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
    if (!dateRegex.test(str)) return false;
    const [day, month, year] = str.split("/").map(Number);
    const parsed = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) age--;
    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() + 1 === month &&
      parsed.getDate() === day &&
      age >= 18 &&
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

    if (!nameRegex.test(name)) {
      toast.error(tSign("invalid_name"));
      return;
    }
    if (!handleRegex.test(handle)) {
      toast.error("Handle inválido. Use 3-15 caracteres (letras, números ou _).");
      return;
    }
    if (!emailRegex.test(emailSign)) {
      toast.error(tSign("invalid_email"));
      return;
    }
    if (!passwordRegex.test(senhaSign)) {
      toast.error(tSign("invalid_senha"));
      return;
    }
    if (!isValidDate(date)) {
      toast.error(tSign("invalid_date"));
      return;
    }
    if (!gender) {
      toast.error(tSign("Select_Gender"));
      return;
    }

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
        handle: handle.trim(),
      });
      if (resp.success) {
        toast.success(tSign("cadastro_sucesso"));
        setSignupDone(true);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Falha no cadastro.";
      toast.error(tSign("cadastro_erro"));
      setMsgSign(errorMessage); // mensagem vinda do backend
    } finally {
      setIsSubmitting(false);
    }
  };

  const Segmented = () => (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="relative flex bg-black/40 border border-[var(--color-darkgreen)] rounded-full p-1 backdrop-blur-sm overflow-hidden">
        <span
          className={[
            "absolute top-1 bottom-1 w-[calc(50%-0.25rem)]",
            "rounded-full bg-darkgreen shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            tab === "login" ? "left-1" : "left-[calc(50%+0.25rem)]",
          ].join(" ")}
          aria-hidden
        />
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
      <main
        className="relative w-full overflow-hidden min-h-[calc(100vh-5rem)]"
        style={{
          backgroundImage: `url(${randomImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* overlays para contraste e leitura */}
        <div className="absolute inset-0 -z-10 bg-black/75" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(transparent_60%,rgba(0,0,0,0.8))]" />

        <Container>
          <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-8">
            <div className={FORM_WRAP}>
              <Segmented />
              <div className="relative">
                {/* LOGIN */}
                <section
                  className={[
                    "transition-opacity duration-300",
                    tab === "login"
                      ? "opacity-100 pointer-events-auto relative"
                      : "opacity-0 pointer-events-none absolute inset-0",
                  ].join(" ")}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className={GROUP_CLS}>
                      <label className={LABEL_CLS} htmlFor="emailLogin">
                        {tLogin("email")}
                      </label>
                      <input
                        id="emailLogin"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className={INPUT_CLS}
                        autoComplete="email"
                        inputMode="email"
                        required
                      />
                    </div>

                    <div className={GROUP_CLS}>
                      <label className={LABEL_CLS} htmlFor="senhaLogin">
                        {tLogin("senha")}
                      </label>
                      <input
                        id="senhaLogin"
                        type="password"
                        placeholder="********"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className={INPUT_CLS}
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <button type="submit" className={BTN_PRIMARY} disabled={loadingLogin}>
                      {loadingLogin ? tLogin("carregando") : tLogin("botao")}
                    </button>

                    {msgLogin && (
                      <p className="text-red-400 text-sm text-center mt-2" aria-live="polite">
                        {msgLogin}
                      </p>
                    )}

                    <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                      <span
                        onClick={() => router.replace(`/${locale}/envia_email`)}
                        className={LINK_CLS}
                        role="button"
                        tabIndex={0}
                      >
                        {tLogin("esqueceu_senha")}
                      </span>
                      <span
                        onClick={() => router.replace(`/${locale}/refaz_email`)}
                        className={LINK_CLS}
                        role="button"
                        tabIndex={0}
                      >
                        {tLogin("mudar_email")}
                      </span>
                    </div>
                  </form>
                </section>

                {/* SIGNUP */}
                <section
                  className={[
                    "transition-opacity duration-300",
                    tab === "signup"
                      ? "opacity-100 pointer-events-auto relative"
                      : "opacity-0 pointer-events-none absolute inset-0",
                  ].join(" ")}
                >
                  {signupDone ? (
                    <div className="text-center text-emerald-300 font-semibold py-10">
                      {/* mensagem de confirmação clara e curta */}
                      {tSign("cadastro_sucesso") || "Cadastro realizado! Verifique seu e-mail para ativar a conta."}
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className={GROUP_CLS}>
                        <label htmlFor="name" className={LABEL_CLS}>
                          {tSign("nome")}
                        </label>
                        <input
                          id="name"
                          className={INPUT_CLS}
                          type="text"
                          placeholder="Seu nome completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="handle" className={LABEL_CLS}>
                          @ de usuário
                        </label>
                        <input
                          id="handle"
                          className={INPUT_CLS}
                          type="text"
                          placeholder="@usuario"
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          autoComplete="username"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="emailSign" className={LABEL_CLS}>
                          {tSign("email")}
                        </label>
                        <input
                          id="emailSign"
                          className={INPUT_CLS}
                          type="email"
                          placeholder="email@exemplo.com"
                          value={emailSign}
                          onChange={(e) => setEmailSign(e.target.value)}
                          autoComplete="email"
                          inputMode="email"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="senhaSign" className={LABEL_CLS}>
                          {tSign("senha")}
                        </label>
                        <input
                          id="senhaSign"
                          className={INPUT_CLS}
                          type="password"
                          placeholder="Mínimo de 5 caracteres e 1 número"
                          value={senhaSign}
                          onChange={(e) => setSenhaSign(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="birth" className={LABEL_CLS}>
                          {tSign("birthday")}
                        </label>
                        <input
                          id="birth"
                          className={INPUT_CLS}
                          type="text"
                          placeholder="dd/mm/aaaa"
                          value={date}
                          onChange={handleDateChange}
                          inputMode="numeric"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="gender" className={LABEL_CLS}>
                          {tSign("Select_Gender")}
                        </label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value as BackendGender)}
                          className={INPUT_CLS}
                        >
                          <option value="" disabled hidden>
                            {tSign("Select_Gender")}
                          </option>
                          <option value="MASC" className="bg-gray-900">
                            {tSign("M_Gender")}
                          </option>
                          <option value="FEM" className="bg-gray-900">
                            {tSign("F_Gender")}
                          </option>
                          <option value="OTHER" className="bg-gray-900">
                            {tSign("O_Gender")}
                          </option>
                        </select>
                      </div>

                      <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
                        {isSubmitting ? "Finalizando cadastro..." : tSign("botao")}
                      </button>

                      {msgSign && (
                        <p className="text-red-400 text-sm text-center mt-2" aria-live="polite">
                          {msgSign}
                        </p>
                      )}
                    </form>
                  )}
                </section>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        select:-webkit-autofill {
          -webkit-text-fill-color: #ffffff;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #ffffff;
        }
      `}</style>
    </PageTransition>
  );
}
