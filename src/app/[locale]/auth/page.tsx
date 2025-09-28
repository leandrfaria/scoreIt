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
  const [signupConfirmText, setSignupConfirmText] = useState("");

  const [randomImage, setRandomImage] = useState("/posters/poster1.png");

  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const { loadMemberData, setIsLoggedIn } = useAuthContext();
  const t = useTranslations("cadastro");

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

  // ====== UI CLASSES ======
  const FORM_WRAP =
    "w-full max-w-xl rounded-2xl border border-[var(--color-darkgreen)] bg-black/55 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.55)] px-6 sm:px-8 py-7";
  const GROUP_CLS = "flex flex-col gap-1.5";
  const LABEL_CLS = "text-sm font-medium text-emerald-200";
  const INPUT_BASE =
    "w-full h-11 px-3 rounded-md border border-[var(--color-darkgreen)] bg-black/30 text-white placeholder-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70 transition disabled:opacity-60 disabled:cursor-not-allowed";
  const INPUT_CLS = INPUT_BASE;
  const BTN_PRIMARY =
    "w-full bg-darkgreen/95 hover:brightness-110 transition text-white font-semibold py-3 rounded-md disabled:opacity-60 disabled:cursor-not-allowed";
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
        toast.success(t("login_sucesso"));
        router.replace(`/${locale}`);
      }
    } catch (err: any) {
      const errorMessage = err?.message || t("login_erro");
      const finalMessage = errorMessage.includes(t("Credenciais"))
        ? t("Credenciais")
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

  // ===== Validações =====
  if (!nameRegex.test(name)) {
    toast.error(t("invalid_name"));
    return;
  }
  if (!handleRegex.test(handle)) {
    toast.error(t("usuario_invalido"));
    return;
  }
  if (!emailRegex.test(emailSign)) {
    toast.error(t("invalid_email"));
    return;
  }
  if (!passwordRegex.test(senhaSign)) {
    toast.error(t("invalid_senha"));
    return;
  }
  if (!isValidDate(date)) {
    toast.error(t("invalid_date"));
    return;
  }
  if (!gender) {
    toast.error(t("Select_Gender"));
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
      const confirmMsg = t("confirmaEmail", { email: emailSign.trim() });
      toast.success(confirmMsg);
      setSignupConfirmText(confirmMsg);
      setSignupDone(true);
    }
  } catch (err: any) {
    const errorMessage = (err?.message || t("falhaCadastro")) as string;

    // detector robusto para saber se é problema com handle/username
    const isHandleError = /(@|nome de usu[aá]rio|username|usu[aá]rio|já está sendo utilizado|já está sendo usado|esse @|já em uso)/i.test(
      errorMessage
    );

    if (isHandleError) {
      // exibe toast de "usuário já em uso" (use sua chave de tradução)
      toast.error(t("usuarioJaEmUso"));
      // coloca o foco no campo handle pra consertarem rápido
      const el = document.getElementById("handle") as HTMLElement | null;
      if (el) el.focus();
    } else {
      toast.error(t("usuarioJaEmUso"));
    }

    setMsgSign(errorMessage);
  } finally {
    setIsSubmitting(false);
  }

};



  // ====== segmented (corrigido com 'left' ao invés de translate) ======
  const Segmented = () => {
    const isLogin = tab === "login";
    return (
      <div className="w-full max-w-md mx-auto mb-6">
        <div
          className="
            relative grid grid-cols-2 items-center
            rounded-full h-12 p-1
            bg-gradient-to-b from-black/30 to-black/50
            border border-emerald-900/40
            shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
            backdrop-blur-sm overflow-hidden
          "
          role="tablist"
          aria-label="alternar entre entrar e criar conta"
        >
          {/* pill com posicionamento por 'left' para simetria perfeita */}
          <span
            className="
              pointer-events-none absolute top-1 bottom-1
              w-[calc(50%-0.5rem)]
              rounded-full
              bg-[var(--color-darkgreen)]
              shadow-[0_8px_32px_rgba(0,0,0,0.5)]
              transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            "
            style={{
              left: isLogin ? "0.25rem" : "calc(50% + 0.25rem)",
            }}
            aria-hidden
          />
          {/* botões */}
          <button
            type="button"
            onClick={() => setTab("login")}
            role="tab"
            aria-selected={isLogin}
            className={[
              "relative z-10 h-10 mx-1 rounded-full font-semibold px-3",
              "text-sm md:text-base",
              "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
              isLogin ? "text-white" : "text-emerald-300 hover:text-emerald-200",
            ].join(" ")}
          >
            {t("tituloLogin")}
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            role="tab"
            aria-selected={!isLogin}
            className={[
              "relative z-10 h-10 mx-1 rounded-full font-semibold px-3",
              "text-sm md:text-base",
              "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
              !isLogin ? "text-white" : "text-emerald-300 hover:text-emerald-200",
            ].join(" ")}
          >
            {t("titulo")}
          </button>
        </div>
      </div>
    );
  };

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
        {/* overlays */}
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
                        {t("email")} 
                      </label>
                      <input
                        id="emailLogin"
                        type="email"
                        placeholder={t("emailPlaceholder")}
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
                        {t("senha")}
                      </label>
                      <input
                        id="senhaLogin"
                        type="password"
                        placeholder="*****"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className={INPUT_CLS}
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <button type="submit" className={BTN_PRIMARY} disabled={loadingLogin}>
                      {loadingLogin ? t("carregando") : t("botaoLogin")}
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
                        {t("esqueceu_senha")}
                      </span>
                      <span
                        onClick={() => router.replace(`/${locale}/refaz_email`)}
                        className={LINK_CLS}
                        role="button"
                        tabIndex={0}
                      >
                        {t("ReenviaEmail")}
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
                      {signupConfirmText ||
                        "pronto! enviamos um e-mail de confirmação. confirme sua conta para entrar. (olhe o spam/lixo eletrônico.)"}
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className={GROUP_CLS}>
                        <label htmlFor="name" className={LABEL_CLS}>
                          {t("nome")} 
                        </label>
                        <input
                          id="name"
                          className={INPUT_CLS}
                          type="text"
                          placeholder={t("nomePlaceholder")}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="handle" className={LABEL_CLS}>
                          {t("Usuario")}
                        </label>
                        <input
                          id="handle"
                          className={INPUT_CLS}
                          type="text"
                          placeholder={t("UsuarioPlacehoalder")}
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          autoComplete="username"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="emailSign" className={LABEL_CLS}>
                          {t("email")}
                        </label>
                        <input
                          id="emailSign"
                          className={INPUT_CLS}
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          value={emailSign}
                          onChange={(e) => setEmailSign(e.target.value)}
                          autoComplete="email"
                          inputMode="email"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="senhaSign" className={LABEL_CLS}>
                          {t("senha")} 
                        </label>
                        <input
                          id="senhaSign"
                          className={INPUT_CLS}
                          type="password"
                          placeholder={t("senhaPlaceholder")}
                          value={senhaSign}
                          onChange={(e) => setSenhaSign(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>

                      <div className={GROUP_CLS}>
                        <label htmlFor="birth" className={LABEL_CLS}>
                          {t("birthday")}
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

                      {/* select de gênero */}
                      <div className={GROUP_CLS}>
                        <label htmlFor="gender" className={LABEL_CLS}>
                          {t("genero")}
                        </label>
                        <div className="relative">
                          <select
                            id="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value as BackendGender)}
                            className={[
                              INPUT_BASE,
                              "appearance-none pr-10",
                              "bg-gradient-to-b from-black/30 to-black/40",
                              "hover:bg-black/35",
                            ].join(" ")}
                          >
                            <option value="" disabled hidden>
                              {t("Select_Gender")}
                            </option>
                            <option value="MASC" className="bg-gray-900 text-white">{t("M_Gender")}</option>
                            <option value="FEM" className="bg-gray-900 text-white">{t("F_Gender")}</option>
                            <option value="OTHER" className="bg-gray-900 text-white">{t("O_Gender")}</option>
                          </select>

                          <svg
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-80"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                          </svg>
                        </div>
                      </div>

                      <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
                        {isSubmitting ? t("criandoConta") : t("botao")}
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
