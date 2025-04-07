"use client";

import { useEffect, useState } from "react";
import { registerUser } from "../../services/service_cad";
import { Container } from "@/components/container";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/page-transition/PageTransition";

export default function Cadastro() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [randomImage, setRandomImage] = useState("/posters/poster1.png");
  const [mensagem, setMensagem] = useState("");

  const router = useRouter(); // Hook para redirecionamento

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem("");

    const response = await registerUser(name, email, senha);
    setMensagem(response.message);

    if(response.success){
      router.push("/")
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
              <p className="text-white text-4xl mb-6">Crie sua conta!</p>
              <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 w-full">
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="text"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="text-white border border-emerald-500 rounded-md p-2 focus:outline-none w-80 bg-emerald-500 mt-4"
                >
                  Cadastrar
                </button>
                <a href="/login" className="text-emerald-400 hover:underline mt-4">
                  Já possui conta?
                </a>
              </form>
              {mensagem && <p className="text-gray-400 mt-2">{mensagem}</p>}
            </div>
          </div>
        </Container>
      </main>
    </PageTransition>
    
  );
  
}
