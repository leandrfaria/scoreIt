"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Others/Container";
import PageTransition from "@/components/layout/Others/PageTransition";
import { confirmAccount } from "@/services/user/accountEmail";
import toast from "react-hot-toast";

export default function ConfirmaConta() {
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const [statusMsg, setStatusMsg] = useState("Validando token...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const posters = [
      "poster1.png","poster2.png","poster3.png","poster4.png","poster5.png","poster6.png","poster7.png"
    ];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);

    (async () => {
      const raw = searchParams.get("token");
      if (!raw) {
        setStatusMsg("Token ausente.");
        return;
      }
      try {
        // importante: encodeURIComponent é aplicado no service
        await confirmAccount(raw);
        setStatusMsg("Email confirmado com sucesso! Você já pode fechar esta página.");
        toast.success("Conta confirmada!");
      } catch (err) {
        setStatusMsg("Token inválido ou expirado.");
        toast.error("Falha ao confirmar a conta.");
      }
    })();
  }, [searchParams]);

  return (
    <PageTransition>
      <main className="w-full">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
            <div className="w-full md:w-1/2 mb-10 md:mb-0">
              <img src={randomImage} alt="Poster aleatório" className="w-full h-[400px] object-cover rounded-lg shadow-lg" />
            </div>
            <div className="w-full md:w-1/2 p-8 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-8">{statusMsg}</h1>
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
