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
import { fetchMemberByHandle } from "@/services/user/member";
import { useTabContext } from "@/context/TabContext";
import { useMember } from "@/context/MemberContext";
import { CustomList } from "@/types/CustomList";
import { countFollowers, countFollowing } from "@/services/followers/countStats";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";
import CustomListModal from "@/components/features/customList/CustomListModal";
import CustomListsSection from "@/components/features/customList/CustomListsSection";
import { fetchMemberLists } from "@/services/customList/list";
import { FollowButton } from "@/components/features/follow/FollowButton";
import { ProfileStats } from "@/components/features/user/ProfileStats";
import BadgesWall from "@/components/features/badge/BadgesWall";
import { getToken } from "@/lib/api";

function normalizeHandle(v: string) {
  return (v || "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function suggestHandle(m?: Member | null) {
  if (!m) return "user";
  const fromHandle = normalizeHandle(m?.handle || "");
  if (fromHandle) return fromHandle;
  const emailLeft = (m?.email || "").split("@")[0] || "";
  const fromEmail = normalizeHandle(emailLeft);
  if (fromEmail) return fromEmail;
  const fromName = normalizeHandle((m?.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;
  return `user${m?.id || ""}`;
}

export default function PublicProfilePage() {
  const [otherMember, setOtherMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const { member: loggedMember } = useMember();
  const { id: handle } = useParams();
  const t = useTranslations("profile");
  const { activeTab } = useTabContext();
  const router = useRouter();
  const locale = useLocale();
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);

  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  // Buscar dados do usuário pelo handle
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const data = await fetchMemberByHandle(handle as string, { signal: controller.signal });
        setOtherMember(data);
      } catch (error) {
        console.error(t("errorFetchingProfile"), error);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [handle, t]);

  // Contadores de seguidores e seguindo
  useEffect(() => {
    const run = async () => {
      if (!otherMember) return;
      try {
        const token = getToken();
        if (!token) return;
        const [followerCount, followingCount] = await Promise.all([
          countFollowers(otherMember.id.toString(), token),
          countFollowing(otherMember.id.toString(), token),
        ]);
        setFollowers(followerCount);
        setFollowing(followingCount);
      } catch (err) {
        console.error(t("errorFetchingCounts"), err);
      }
    };
    run();
  }, [otherMember, t]);

  // Redireciona para perfil próprio se handle for do usuário logado
  useEffect(() => {
    if (loggedMember?.id && otherMember?.id && loggedMember.id === otherMember.id) {
      router.replace(`/${locale}/profile`);
    }
  }, [loggedMember, otherMember, router, locale]);

  // Listas customizadas
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!otherMember) return;
      try {
        const token = getToken();
        if (!token) return;
        const lists = await fetchMemberLists(token, otherMember.id, locale, { signal: controller.signal });
        setCustomLists(lists);
      } catch (err) {
        console.error(t("errorFetchingCustomLists"), err);
      }
    };
    run();
    return () => controller.abort();
  }, [otherMember, locale, t]);

  if (loading) return <p className="text-white">{t("loading")}</p>;
  if (!otherMember) return <p className="text-white">{t("userNotFound")}</p>;

  const handleOpenListModal = (list: CustomList) => setSelectedList(list);
  const handleCloseListModal = () => setSelectedList(null);

  return (
    <main className="w-full">
      <Container>
        <div className="mt-5">
          <ProfileHeader
            member={otherMember}
            t={t}
            followers={followers}
            following={following}
            setFollowers={setFollowers}
            loggedMember={loggedMember}
          />
        </div>
      </Container>

      <Container>
        <section className="mt-6 space-y-4">
          <h2 className="text-white text-xl font-semibold">{t("favorites")}</h2>
          {activeTab === "filmes" && <FavouriteMoviesCarouselSection memberId={otherMember.id.toString()} />}
          {activeTab === "musicas" && <FavouriteAlbumCarouselSection memberId={otherMember.id.toString()} />}
          {activeTab === "series" && <FavouriteSeriesCarouselSection memberId={otherMember.id.toString()} />}
        </section>
      </Container>

      <Container>
        <section className="mt-6 space-y-4">
          <h2 className="text-white text-xl font-semibold">{t("recentReviews")}</h2>
          <ReviewsCarouselSection memberId={otherMember.id.toString()} />
        </section>
      </Container>

      <Container>
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-semibold">{t("customLists")}</h2>
          </div>
          <CustomListsSection
            isOpen={isListsOpen}
            onToggle={() => setIsListsOpen(!isListsOpen)}
            lists={customLists}
            onSelect={handleOpenListModal}
          />
        </section>
      </Container>

      <Container>
        <section className="mt-6">
          <h2 className="text-white text-xl font-semibold mb-3">{t("badgesWall")}</h2>
          <BadgesWall memberId={otherMember.id} pollMs={0} />
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
  followers: number;
  following: number;
  setFollowers: React.Dispatch<React.SetStateAction<number>>;
  loggedMember?: Member | null;
}

const ProfileHeader = ({
  member,
  t,
  followers,
  following,
  setFollowers,
  loggedMember,
}: ProfileHeaderProps) => {
  const displayHandle = `@${normalizeHandle(member.handle || "") || suggestHandle(member)}`;

  const showFollowButton = loggedMember?.id && loggedMember.id !== member.id;

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
        <div className="w-16 h-16 rounded-full overflow-hidden relative ring-2 ring-white/10">
          <Image
            src={member.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
            alt={t("profileImageAlt")}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col text-white space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-medium">{member.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
              {displayHandle}
            </span>
          </div>
          <p className="text-gray-400 text-sm max-w-md">{member.bio || t("no_bio")}</p>
        </div>

        {showFollowButton && (
          <div className="sm:ml-auto">
            <FollowButton
              targetId={member.id.toString()}
              onFollow={() => setFollowers((prev) => prev + 1)}
              onUnfollow={() => setFollowers((prev) => Math.max(prev - 1, 0))}
            />
          </div>
        )}
      </div>

      <div className="w-full md:w-auto mt-4 md:mt-0">
        <ProfileStats
          t={t}
          followers={followers}
          following={following}
          memberId={member.id.toString()}
        />
      </div>
    </div>
  );
};
