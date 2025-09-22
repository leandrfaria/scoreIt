import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Member } from "@/types/Member";
import { fetchFollowersList, fetchFollowingList } from "@/services/followers/list";
import { useLocale } from "next-intl";

// Skeleton simples para lista
function RowSkeleton() {
  return (
    <li className="flex items-center gap-3 border-b border-white/10 pb-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
    </li>
  );
}

function normalizeHandle(v: string) {
  return (v || "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

interface ProfileStatsProps {
  t: any;
  followers: number;
  following: number;
  memberId: string;
}

export const ProfileStats = ({ t, followers, following, memberId }: ProfileStatsProps) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [followersList, setFollowersList] = useState<Member[]>([]);
  const [followingList, setFollowingList] = useState<Member[]>([]);

  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const [errorFollowers, setErrorFollowers] = useState<string | null>(null);
  const [errorFollowing, setErrorFollowing] = useState<string | null>(null);

  const followersAbort = useRef<AbortController | null>(null);
  const followingAbort = useRef<AbortController | null>(null);

  const locale = useLocale();

  const loadFollowers = useCallback(async () => {
    followersAbort.current?.abort();
    const controller = new AbortController();
    followersAbort.current = controller;

    setLoadingFollowers(true);
    setErrorFollowers(null);

    try {
      const data = await fetchFollowersList(memberId, { signal: controller.signal });
      setFollowersList(Array.isArray(data) ? data : []);
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        console.error("Erro ao buscar seguidores:", error);
        setErrorFollowers("Erro ao carregar seguidores.");
      }
    } finally {
      setLoadingFollowers(false);
    }
  }, [memberId]);

  const loadFollowing = useCallback(async () => {
    followingAbort.current?.abort();
    const controller = new AbortController();
    followingAbort.current = controller;

    setLoadingFollowing(true);
    setErrorFollowing(null);

    try {
      const data = await fetchFollowingList(memberId, { signal: controller.signal });
      setFollowingList(Array.isArray(data) ? data : []);
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        console.error("Erro ao buscar seguindo:", error);
        setErrorFollowing("Erro ao carregar lista de seguindo.");
      }
    } finally {
      setLoadingFollowing(false);
    }
  }, [memberId]);

  // Abre modais on demand
  useEffect(() => {
    if (showFollowers) loadFollowers();
    return () => followersAbort.current?.abort();
  }, [showFollowers, loadFollowers]);

  useEffect(() => {
    if (showFollowing) loadFollowing();
    return () => followingAbort.current?.abort();
  }, [showFollowing, loadFollowing]);

  // Fecha modais com ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFollowers(false);
        setShowFollowing(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const renderMemberList = (list: Member[], loading: boolean, error: string | null) => {
    if (error) return <p className="text-red-400">{error}</p>;
    if (loading) {
      return (
        <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </ul>
      );
    }
    if (list.length === 0) {
      return <p className="text-gray-400">Nenhum usuário para listar.</p>;
    }

    return (
      <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {list.map((user) => (
          <li key={user.id} className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden relative ring-1 ring-white/10">
              <Image
                src={
                  user.profileImageUrl ||
                  "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
                }
                alt={`Foto de perfil de ${user.name}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user.name}</span>
              {user.handle && <span className="text-xs text-gray-400">@{user.handle}</span>}
              {user.handle && (
                <Link
                  href={`/${locale}/profile/${normalizeHandle(user.handle)}`}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Ver perfil
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const Modal = ({
    title,
    onClose,
    children,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
      aria-label={title}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md text-white relative shadow-2xl ring-1 ring-white/10">
        <button
          aria-label="Fechar"
          className="absolute top-2 right-3 text-xl hover:opacity-80"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );

  const followersCount = useMemo(() => followers ?? 0, [followers]);
  const followingCount = useMemo(() => following ?? 0, [following]);

  return (
    <div className="flex gap-8 text-center relative">
      <button
        onClick={() => setShowFollowers(true)}
        className="cursor-pointer group focus:outline-none focus:ring-2 focus:ring-darkgreen/60 rounded"
        aria-label={`${followersCount} ${t("followers")}`}
      >
        <p className="text-sm text-white/80">{t("followers")}</p>
        <p className="text-2xl font-semibold text-white group-hover:text-darkgreen transition">
          {followersCount}
        </p>
      </button>

      <button
        onClick={() => setShowFollowing(true)}
        className="cursor-pointer group focus:outline-none focus:ring-2 focus:ring-darkgreen/60 rounded"
        aria-label={`${followingCount} ${t("following")}`}
      >
        <p className="text-sm text-white/80">{t("following")}</p>
        <p className="text-2xl font-semibold text-white group-hover:text-darkgreen transition">
          {followingCount}
        </p>
      </button>

      {showFollowers && (
        <Modal title={t("followers")} onClose={() => setShowFollowers(false)}>
          {renderMemberList(followersList, loadingFollowers, errorFollowers)}
        </Modal>
      )}

      {showFollowing && (
        <Modal title={t("following")} onClose={() => setShowFollowing(false)}>
          {renderMemberList(followingList, loadingFollowing, errorFollowing)}
        </Modal>
      )}
    </div>
  );
};
