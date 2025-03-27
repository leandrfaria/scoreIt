"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../service_login";

type Movie = {
  Poster: string;
};

export default function Login() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  const router = useRouter(); // Hook para navegação após login

  useEffect(() => {
    fetch("http://www.omdbapi.com/?apikey=74dffd09&s=batman")
      .then((response) => response.json())
      .then((data) => {
        if (data.Search) {
          setMovies(data.Search.slice(0, 1));
        } else {
          console.error("Erro na resposta da API:", data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar filmes:", error);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem("");
    setLoading(true); 

    const response = await loginUser(email, senha);

    if (response.success) {
      // Se o login for bem-sucedido, redireciona para a página principal
      console.log("Token JWT gerado:", response.token); // Exibe o token JWT gerado no console
      router.push("/");
    } else {
      setMensagem(response.message);
    }

    setLoading(false); 
  };

  return (
    <main className="w-full h-full flex">
      {/* Seção de Filmes - Ocupa 50% da tela */}
      <div className="w-1/2 h-1/2 flex items-center justify-center">
        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : movies.length > 0 ? (
          <img
            src={movies[0].Poster}
            className="w-4/5 h-auto"
          />
        ) : (
          <p className="text-gray-400">Nenhum filme encontrado.</p>
        )}
      </div>

      <div className="w-1/2 h-screen flex flex-col items-center justify-center">
        <p className="text-white text-4xl mb-6">Acesse sua conta!</p>
        <form onSubmit={handleLogin} className="flex flex-col items-center space-y-4 w-full">
          <input
            className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90"
            type="text"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="text-gray-400 border border-emerald-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-90 mt-4"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button
            type="submit"
            className="text-white border border-emerald-500 rounded-md p-2 focus:outline-none w-80 bg-emerald-500 mt-4"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <a href="/cadastro" className="text-emerald-400 hover:underline mt-4">
            Não possui conta? Crie uma aqui!
          </a>
        </form>
        {mensagem && <p className="text-gray-400 mt-2">{mensagem}</p>}
      </div>
    </main>
  );
}
