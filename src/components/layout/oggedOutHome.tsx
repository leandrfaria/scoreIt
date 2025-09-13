"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/layout/Others/Container";
import PageTransition from "@/components/layout/Others/PageTransition";

/** Ícone minimalista do Instagram (branco por padrão) */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function LoggedOutHome() {
  const [randomImage, setRandomImage] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);
  const locale = useLocale();
  const t = useTranslations("cadastro");


  useEffect(() => {
    setHasMounted(true);
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

  const devs = [
    { name: "Bruno Feliciano", role: "Back end", ig: "brufell" },
    { name: "Leandro Faria", role: "Front end", ig: "leandrfaria" },
    { name: "Thiago Luz", role: "Front end", ig: "thiago.luzr" },
  ];

  return (
    <PageTransition>
      {/* HERO — agora centralizado e com sobreposição preta bem forte */}
      <section
        className="relative w-full min-h-[calc(100vh-5rem)] flex items-center justify-center text-center"
        style={{
          backgroundImage: hasMounted && randomImage ? `url(${randomImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "50% 40%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Camadas de escurecimento (bem agressivas) */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-black/92" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/85 to-black/95" />
        <div className="pointer-events-none absolute inset-0 -z-10 mix-blend-multiply bg-black/90" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.65)_55%,_rgba(0,0,0,0.92)_100%)]" />

        {/* Conteúdo centralizado */}
        <div className="px-5 sm:px-8 md:px-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="headline-reveal text-[46px] sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.55)]">
              <span className="headline-shine-green">ScoreIt</span>
            </h1>

            <p className="mt-4 md:mt-6 text-xl sm:text-2xl md:text-[28px] text-emerald-100/95">
              {t("telaInicial")}
            </p>

            <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/auth?tab=signup`}
                className="px-6 py-3 rounded-md font-semibold text-white bg-darkgreen hover:brightness-110 transition"
              >
                {t("botao")}
              </Link>
              <Link
                href={`/${locale}/auth?tab=login`}
                className="px-6 py-3 rounded-md font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition"
              >
                {t("botaoLogin")}
              </Link>
            </div>
          </div>
        </div>

        {/* Fade no rodapé do hero */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-black/95" />
      </section>

      {/* SOBRE  */}
      <section id="sobre" className="relative w-full bg-black py-14 md:py-20">
  <Container>
    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-14">
      <div className="flex justify-center md:justify-end">
        <div className="w-full max-w-[px]"> 
          <img
            src="/logo/logo.png"
            alt="Logo ScoreIt"
            className="w-full h-auto object-contain mx-auto"
          />
        </div>
      </div>

            <div className="rounded-2xl p-6 md:p-8 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Sobre o ScoreIt</h2>
              <p className="mt-4 text-emerald-100/90 leading-relaxed">
                O ScoreIt é um projeto para quem ama cultura pop. Aqui você pode descobrir novidades, criar listas e{" "}
                <span className="font-semibold text-emerald-300">avaliar</span> o que assiste e ouve — filmes, séries e
                álbuns. Nosso objetivo é reunir a sua experiência em um só lugar, com uma interface rápida e elegante.
                Construa seu perfil, compartilhe gostos com amigos e acompanhe o que está bombando agora.
              </p>
              <ul className="mt-5 space-y-2 text-emerald-100/80">
                <li>• Acompanhe lançamentos e tendências</li>
                <li>• Monte listas e diário de assistidos/ouvintes</li>
                <li>• Dê notas, escreva reviews e compare gostos</li>
              </ul>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/${locale}/auth?tab=signup`}
                  className="px-5 py-2.5 rounded-md font-semibold text-white bg-darkgreen hover:brightness-110 transition"
                >
                  começar agora
                </Link>
                <a
                  href="#topo"
                  className="px-5 py-2.5 rounded-md font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition"
                >
                  ver topo
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* DESENVOLVEDORES — nova seção */}
      <section
        id="devs"
        className="relative w-full py-16 md:py-20 bg-[radial-gradient(1200px_600px_at_50%_-10%,_rgba(16,185,129,0.06),_transparent_60%)]"
      >
        <Container>
          <h2 className="text-center text-3xl md:text-4xl font-bold text-white">Desenvolvedores</h2>
          <p className="mt-3 text-center text-emerald-100/80">
            Quem está por trás do projeto.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devs.map((d) => (
              <div
                key={d.ig}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] hover:border-emerald-500/30 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                    <p className="text-sm text-emerald-200/90">{d.role}</p>
                  </div>

                  <Link
                    href={`https://instagram.com/${d.ig}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 px-3 py-2 text-sm font-medium text-white/95 bg-emerald-600/20 hover:bg-emerald-600/30 hover:border-emerald-400/60 transition"
                    aria-label={`Instagram de ${d.name}`}
                  >
                    <InstagramIcon className="h-4 w-4 text-white" />
                    <span>@{d.ig}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Estilos/Animações (headline mais lenta e suave) */}
      <style jsx global>{`
        .headline-reveal {
          opacity: 0;
          transform: translateY(12px) scale(0.985);
          filter: blur(6px);
          animation: headline-in 1400ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes headline-in {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .headline-shine-green {
          background: linear-gradient(
            90deg,
            #ffffff 0%,
            #ffffff 28%,
            #0a5a46 45%,
            #0f7a5d 50%,
            #0a5a46 55%,
            #ffffff 72%,
            #ffffff 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          background-size: 220% 100%;
          animation: shine-green 11000ms linear infinite 1600ms;
          position: relative;
        }
        @keyframes shine-green {
          0% {
            background-position: 220% 0%;
          }
          100% {
            background-position: -220% 0%;
          }
        }
      `}</style>
    </PageTransition>
  );
}
