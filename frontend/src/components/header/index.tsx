import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="w-full h-20">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center h-20 px-6">
        {/* Logo */}
        <Link href="/" className="text-white text-lg font-semibold">ScoreIt</Link>

        {/* Navegação */}
        <nav className="flex gap-4 items-center">
          <Link href="/" className="bg-darkgreen text-white px-4 py-2 rounded-md">
            Filmes
          </Link>
          <Link href="/musicas" className="text-white">
            Músicas
          </Link>
        </nav>

        {/* Perfil */}
        <div className="flex items-center">
          <Link href="/profile" className="text-white">
          <Image
            src="/profile.jpg" 
            alt="Avatar"
            width={50}
            height={50}
            className="rounded-full"
          />
          </Link>
        </div>
      </div>
    </header>
  );
}
