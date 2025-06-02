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
  const locale = useLocale();
  const [followingList, setFollowingList] = useState<Member[]>([]);

  const loadFollowers = async () => {
    try {
      const data = await fetchFollowersList(memberId);
      setFollowersList(data);
    } catch (error) {
      console.error("Erro ao buscar seguidores:", error);
    }
  };

  const loadFollowing = async () => {
    try {
      const data = await fetchFollowingList(memberId);
      setFollowingList(data);
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

  const renderMemberList = (list: Member[]) => (
    <ul className="space-y-4 max-h-80 overflow-y-auto">
      {list.map((user) => (
        <li key={user.id} className="flex items-center gap-3 border-b border-gray-700 pb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative">
            <Image
              src={
                user.profileImageUrl ||
                "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
              }
              alt="Foto"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <Link href={`/${locale}/profile/${user.id}`} className="text-xs text-blue-400 hover:underline">
              Ver perfil
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex gap-6 text-center relative">
      <div onClick={() => setShowFollowers(true)} className="cursor-pointer">
        <p className="text-sm text-white">{t("followers")}</p>
        <p className="text-lg font-semibold text-white">{followers}</p>
      </div>

      <div onClick={() => setShowFollowing(true)} className="cursor-pointer">
        <p className="text-sm text-white">{t("following")}</p>
        <p className="text-lg font-semibold text-white">{following}</p>
      </div>

      {showFollowers && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md text-white relative">
            <button className="absolute top-2 right-3 text-xl" onClick={() => setShowFollowers(false)}>×</button>
            <h2 className="text-lg font-semibold mb-4">{t("followers")}</h2>
            {followersList.length > 0 ? (
              renderMemberList(followersList)
            ) : (
              <p className="text-gray-400">Você não possui seguidores para serem listados.</p>
            )}
          </div>
        </div>
      )}

      {showFollowing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md text-white relative">
            <button className="absolute top-2 right-3 text-xl" onClick={() => setShowFollowing(false)}>×</button>
            <h2 className="text-lg font-semibold mb-4">{t("following")}</h2>
            {followingList.length > 0 ? (
              renderMemberList(followingList)
            ) : (
              <p className="text-gray-400">Você ainda não segue outros usuários.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
