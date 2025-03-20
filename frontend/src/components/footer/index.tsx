import Link from "next/link";


export function Footer() {
    return (
      <footer className="w-full  text-white py-6">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
          {/* Logo e Direitos Autorais */}
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} ScoreIt. Todos os direitos reservados.
          </div>
  
          {/* Links úteis */}
          <nav className="flex gap-4 mt-4 md:mt-0">
            <Link href="/sobre" className="text-gray-300 hover:text-white">
              Sobre
            </Link>
            <Link href="/contato" className="text-gray-300 hover:text-white">
              Contato
            </Link>
            
          </nav>
        </div>
      </footer>
    );
  }
  