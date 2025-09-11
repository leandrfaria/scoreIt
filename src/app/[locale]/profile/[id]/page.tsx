"use client";

import { useEffect, useState } from "react";
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
import { CustomList } from "@/types/CustomList";
import { countFollowers, countFollowing } from "@/services/followers/countStats";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";
import { AnimatePresence, motion } from "framer-motion";
import { CustomListModal } from "@/components/features/user/CustomListModal";
import { fetchMemberLists } from "@/services/customList/list";
import { FollowButton } from "@/components/features/follow/FollowButton";
import { ProfileStats } from "@/components/features/user/ProfileStats";

// Mural de conquistas (público sem polling)
import BadgesWall from "@/components/features/badge/BadgesWall";

/** Normaliza o handle removendo @, minúsculas e permitido [a-z0-9._] */
function normalizeHandle(v: string) {
  return (v || "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

/** Sugere um handle a partir do Member (se handle estiver vazio) */
function suggestHandle(m?: Member | null) {
  if (!m) return "usuario";
  const fromHandle = normalizeHandle(m.handle || "");
  if (fromHandle) return fromHandle;

  const emailLeft = (m.email || "").split("@")[0] || "";
  const fromEmail = normalizeHandle(emailLeft);
  if (fromEmail) return fromEmail;

  const fromName = normalizeHandle((m.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;

  return `user${m.id || ""}`;
}

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

  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  // Buscar o membro
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const data = await fetchMemberById(id as string, { signal: controller.signal });
        setOtherMember(data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [id]);

  // Buscar contadores
  useEffect(() => {
    const run = async () => {
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
    run();
  }, [id]);

  // Redirecionar para perfil próprio caso o id seja do usuário logado
  useEffect(() => {
    if (member?.id && String(member.id) === id) {
      router.replace(`/${locale}/profile`);
    }
  }, [member, id, router, locale]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const lists = await fetchMemberLists(token, Number(id));
        setCustomLists(lists);
      } catch (err) {
        console.error("Erro ao buscar listas customizadas:", err);
      }
    };
    run();
    return () => controller.abort();
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
      {/* Header */}
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
      </Container>

      {/* 1) Favoritos */}
      <Container>
        <section className="mt-6 space-y-4">
          <h2 className="text-white text-xl font-semibold">Favoritos</h2>
          {activeTab == "filmes" && <FavouriteMoviesCarouselSection memberId={id as string} />}
          {activeTab == "musicas" && <FavouriteAlbumCarouselSection memberId={id as string} />}
          {activeTab == "series" && <FavouriteSeriesCarouselSection memberId={id as string} />}
        </section>
      </Container>

      {/* 2) Avaliações recentes */}
      <Container>
        <section className="mt-6 space-y-4">
          <h2 className="text-white text-xl font-semibold">Avaliações recentes</h2>
          <ReviewsCarouselSection memberId={id as string} />
        </section>
      </Container>

      {/* 3) Listas personalizadas */}
      <Container>
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-semibold">Listas personalizadas</h2>
            {/* público: sem botão de criar lista */}
          </div>

          <section className="mt-2">
            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full text-xl font-semibold text-white"
                onClick={() => setIsListsOpen(!isListsOpen)}
                aria-expanded={isListsOpen}
              >
                <span>Ver listas</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${isListsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                    <p className="text-gray-400 py-2">Este usuário não possui listas personalizadas!</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {customLists.map((list) => (
                        <div
                          key={list.id}
                          className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700 ring-1 ring-white/10"
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
        </section>
      </Container>

      {/* 4) Mural de conquistas */}
      <Container>
        <section className="mt-6">
          <h2 className="text-white text-xl font-semibold mb-3">Mural de conquistas</h2>
          <BadgesWall memberId={Number(id)} pollMs={0} />
        </section>
      </Container>

      {selectedList && (
        <CustomListModal
          isOpen={true}
          onClose={handleCloseListModal}
          id={selectedList.id}
          listName={selectedList.listName}
          listDescription={selectedList.list_description}
          member={otherMember}
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

const ProfileHeader = ({ member, t, followers, following, setFollowers }: ProfileHeaderProps) => {
  const displayHandle = `@${normalizeHandle(member?.handle || "") || suggestHandle(member)}`;

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
        <div className="w-16 h-16 rounded-full overflow-hidden relative ring-2 ring-white/10">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-medium">{member?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
              {displayHandle}
            </span>
          </div>
          <p className="text-gray-400 text-sm max-w-md">{member?.bio || t("no_bio")}</p>
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
        <ProfileStats t={t} followers={followers} following={following} memberId={member.id.toString()} />
      </div>
    </div>
  );
};
