import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Member } from "@/types/Member";
import { fetchFollowersList, fetchFollowingList } from "@/services/followers/list";
import { useLocale } from "next-intl";

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
  const locale = useLocale();

  const loadFollowers = async () => {
    try {
      const data = await fetchFollowersList(memberId);
      setFollowersList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar seguidores:", error);
    }
  };

  const loadFollowing = async () => {
    try {
      const data = await fetchFollowingList(memberId);
      setFollowingList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar seguindo:", error);
    }
  };

  useEffect(() => {
    if (showFollowers) loadFollowers();
  }, [showFollowers]);

  useEffect(() => {
    if (showFollowing) loadFollowing();
  }, [showFollowing]);

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

  const renderMemberList = (list: Member[]) => (
    <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
      {list.map((user) => (
        <li key={user.id} className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative ring-1 ring-white/10">
            <Image
              src={
                user.profileImageUrl ||
                "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
              }
              alt="Foto de perfil"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user.name}</span>
            <span className="text-xs text-gray-400">@{user.handle}</span>
            <Link
              href={`/${locale}/profile/${user.id}`}
              className="text-xs text-blue-400 hover:underline"
            >
              Ver perfil
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );

  const Modal = ({
    title,
    onClose,
    children,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-md text-white relative shadow-2xl ring-1 ring-white/10"
      >
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

  return (
    <div className="flex gap-8 text-center relative">
      <button onClick={() => setShowFollowers(true)} className="cursor-pointer group">
        <p className="text-sm text-white/80">{t("followers")}</p>
        <p className="text-2xl font-semibold text-white group-hover:text-darkgreen transition">
          {followers}
        </p>
      </button>

      <button onClick={() => setShowFollowing(true)} className="cursor-pointer group">
        <p className="text-sm text-white/80">{t("following")}</p>
        <p className="text-2xl font-semibold text-white group-hover:text-darkgreen transition">
          {following}
        </p>
      </button>

      {showFollowers && (
        <Modal title={t("followers")} onClose={() => setShowFollowers(false)}>
          {followersList.length > 0 ? (
            renderMemberList(followersList)
          ) : (
            <p className="text-gray-400">Você não possui seguidores para serem listados.</p>
          )}
        </Modal>
      )}

      {showFollowing && (
        <Modal title={t("following")} onClose={() => setShowFollowing(false)}>
          {followingList.length > 0 ? (
            renderMemberList(followingList)
          ) : (
            <p className="text-gray-400">Você ainda não segue outros usuários.</p>
          )}
        </Modal>
      )}
    </div>
  );
};
