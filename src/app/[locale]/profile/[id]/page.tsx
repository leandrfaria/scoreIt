"use client";

import { useEffect, useState } from "react"
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Member } from "@/types/Member";
import { Container } from "@/components/layout/Others/Container";
import { useLocale, useTranslations } from "next-intl";
import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import { fetchMemberById } from "@/services/user/member";
import { useTabContext } from "@/context/TabContext";
import { useMember } from "@/context/MemberContext";
import { CustomList } from "@/types/CustomList"; // ajuste o caminho conforme necessário
import {
  countFollowers,
  countFollowing,
} from "@/services/followers/countStats";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";
import { AnimatePresence, motion } from "framer-motion";
import { CustomListModal } from "@/components/features/user/CustomListModal";
import { fetchMemberLists } from "@/services/customList/add_content_list"; // ajuste o caminho conforme seu projeto
import { FollowButton } from "@/components/features/follow/FollowButton";
import { ProfileStats } from "@/components/features/user/ProfileStats";

export default function PublicProfilePage() {
  const [otherMember, setOtherMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const { member } = useMember();
  const { id } = useParams();
  const t = useTranslations("profile");
  const { activeTab } = useTabContext();
  const router = useRouter();
  const locale = useLocale();
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);


  // Estado para listas customizadas
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  // Buscar o membro
  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await fetchMemberById(id as string);
        setOtherMember(data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  // Buscar contadores
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !id) return;

        const [followerCount, followingCount] = await Promise.all([
          countFollowers(id as string, token),
          countFollowing(id as string, token),
        ]);

        setFollowers(followerCount);
        setFollowing(followingCount);
      } catch (err) {
        console.error("Erro ao buscar contadores:", err);
      }
    };

    fetchCounts();
  }, [id]);

  // Redirecionar para perfil próprio caso o id seja do usuário logado
  useEffect(() => {
    if (member?.id && String(member.id) === id) {
      router.replace(`/${locale}/profile`);
    }
  }, [member, id, router, locale]);

  useEffect(() => {
    const fetchLists = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("authToken"); // <-- Agora está declarado corretamente
        if (!token) return;
        console.log("ID MEMBRO LISTA: ", id)
        const lists = await fetchMemberLists(token, Number(id));
        setCustomLists(lists);
      } catch (err) {
        console.error("Erro ao buscar listas customizadas:", err);
      }
    };

    fetchLists();
  }, [id]);


  if (member?.id && String(member.id) === id) return null;
  if (loading) return <p className="text-white">Carregando...</p>;
  if (!otherMember) return <p className="text-white">Usuário não encontrado.</p>;

  function handleOpenListModal(list: CustomList) {
  setSelectedList(list);
}

  function handleCloseListModal() {
    setSelectedList(null);
  }

  return (
    <main className="w-full">
      <Container>
        <div className="mt-5">
          <ProfileHeader
            member={otherMember}
            t={t}
            isEditable={false}
            followers={followers}
            following={following}
            setFollowers={setFollowers}
          />
        </div>

        {/* Seção das Listas Customizadas */}
        <section className="mt-6">
          <div className="mb-4">
            <button
              className="flex items-center justify-between w-full text-xl font-semibold text-white"
              onClick={() => setIsListsOpen(!isListsOpen)}
              aria-expanded={isListsOpen}
            >
              <span>Listas Personalizadas</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isListsOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {isListsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {customLists.length === 0 ? (
                  <p className="text-gray-400 py-2">
                    Este usuário não possui listas personalizadas!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {customLists.map((list) => (
                      <div
                        key={list.id}
                        className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700"
                        onClick={() => handleOpenListModal(list)}
                      >
                        <h3 className="text-lg font-semibold">{list.listName}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </Container>

      <Container>
        {activeTab == "filmes" && (
          <FavouriteMoviesCarouselSection memberId={id as string} />
        )}
        {activeTab == "musicas" && (
          <FavouriteAlbumCarouselSection memberId={id as string} />
        )}
        {activeTab == "series" && (
          <FavouriteSeriesCarouselSection memberId={id as string} />
        )}
      </Container>

      <Container>
        <ReviewsCarouselSection memberId={id as string} />
      </Container>

      {selectedList && (
        <CustomListModal
          isOpen={true}
          onClose={handleCloseListModal}
          id={selectedList.id}
          listName={selectedList.listName}
          listDescription={selectedList.list_description}
          member={otherMember}
          // Bloqueia edição pois é perfil público (outro usuário)
        />
      )}
    </main>
  );
}


interface ProfileHeaderProps {
  member: Member;
  t: any;
  isEditable: boolean;
  followers: number;
  following: number;
  setFollowers: React.Dispatch<React.SetStateAction<number>>;
}

const ProfileHeader = ({
  member,
  t,
  followers,
  following,
  setFollowers,
}: ProfileHeaderProps) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
      <div className="w-16 h-16 rounded-full bg-gray-400 overflow-hidden relative">
        <Image
          src={
            member?.profileImageUrl ||
            "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
          }
          alt="Foto de perfil"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col text-white space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">{member?.name}</span>
        </div>
        <p className="text-gray-400 text-sm max-w-md">
          {member?.bio || t("no_bio")}
        </p>
      </div>

      <div className="sm:ml-auto">
        <FollowButton
          targetId={member.id.toString()}
          onFollow={() => setFollowers((prev) => prev + 1)}
          onUnfollow={() => setFollowers((prev) => Math.max(prev - 1, 0))}
        />
      </div>
    </div>

    <div className="w-full md:w-auto">
      <ProfileStats
        t={t}
        followers={followers}
        following={following}
        memberId={member.id.toString()}
      />
    </div>
  </div>
);