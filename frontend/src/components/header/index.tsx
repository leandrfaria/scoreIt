import Link from "next/link"

export function Header() {
    return (
        <header className="w-full h-20 px-2">
            <div className="max-w-screen-xl mx-auto flex px-8 justify-center sm:justify-between items-center h-20">
                <nav className="">
                    <Link href="/">ScoreIt</Link>
                    
                    <div>
                        <Link href="/filmes">Filmes</Link>
                        <Link href="/musicas">Músicas</Link>
                    </div>
                </nav>

                <div className="">
                    <Link href="/profile">
                    <p>Meu perfil</p>
                    </Link>

                    <button>
                        Logout
                    </button>
                </div>
            </div>
        </header>
    )
}