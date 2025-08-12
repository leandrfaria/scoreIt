"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ConfirmEmail } from "@/services/user/verifica_email"
import PageTransition from "@/components/layout/PageTransition";

export default function ConfirmaConta() {
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const searchParams = useSearchParams();

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
    
  async function confirmar() {
    const token = searchParams.get("token");
    if (!token) {
      return;
    }

    try {
      const res = await ConfirmEmail(token);
    }catch{
        return; 
    }
  }

  confirmar();
    }, [searchParams]);


  return (
    <PageTransition>
      <main className="w-full">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
            <div className="w-full md:w-1/2 mb-10 md:mb-0">
              <img
                src={randomImage}
                alt="Poster aleatório"
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>
            <div className="w-full md:w-1/2 p-8 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-8">Email confirmado com sucesso! Pode fechar esta página</h1>
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
  );
}
