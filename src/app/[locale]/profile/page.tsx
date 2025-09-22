"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Others/Container";
import { ProtectedRoute } from "@/components/layout/Others/ProtectedRoute";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";

import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";
import CustomListModal from "@/components/features/customList/CustomListModal";
import CreateCustomListModal from "@/components/features/customList/CreateCustomListModal";
import CustomListsSection from "@/components/features/customList/CustomListsSection";
import ProfileHeader from "@/components/features/user/ProfileHeader";
import { ProfileStats } from "@/components/features/user/ProfileStats";
import ProfileEditModal from "@/components/features/user/ProfileEditModal";

import { useMember } from "@/context/MemberContext";
import { useTabContext } from "@/context/TabContext";

import { updateMember } from "@/services/user/member";
import { countFollowers, countFollowing } from "@/services/followers/countStats";
import { fetchMemberLists } from "@/services/customList/list";
import { CustomList } from "@/types/CustomList";
import { Member } from "@/types/Member";
import BadgesWall from "@/components/features/badge/BadgesWall";
import { apiBase, getToken } from "@/lib/api";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";

function normalizeHandle(v: string) {
  return v.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function suggestHandle(m?: Member | null) {
  if (!m) return "usuario";
  const fromHandle = normalizeHandle(m?.handle || "");
  if (fromHandle) return fromHandle;
  const emailLeft = m?.email?.split("@")[0] || "";
  const fromEmail = normalizeHandle(emailLeft);
  if (fromEmail) return fromEmail;
  const fromName = normalizeHandle((m?.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;
  return `user${m?.id || ""}`;
}

type ModalType = "edit" | "createList" | "viewList" | null;

export default function Profile() {
  const { member, setMember } = useMember();
  const { activeTab } = useTabContext();
  const t = useTranslations("profile");
  const locale = useLocale();

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isListsOpen, setIsListsOpen] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  const loadCustomLists = async (token: string, memberId: number, locale: string) => {
    try {
      const lists = await fetchMemberLists(token, memberId, locale);
      setCustomLists(lists);
    } catch (err) {
      console.error("Erro ao carregar listas:", err);
      toast.error(t("error_loading_lists"));
    }
  };

  const fetchStats = async (token: string, memberId: number) => {
    try {
      const [followerCount, followingCount] = await Promise.all([
        countFollowers(memberId.toString(), token),
        countFollowing(memberId.toString(), token),
      ]);
      setFollowers(followerCount);
      setFollowing(followingCount);
    } catch (err) {
      console.error("Erro ao buscar contadores:", err);
    }
  };

  useEffect(() => {
    if (!member) return;
    const token = getToken();
    if (!token) return;
    Promise.all([fetchStats(token, member.id), loadCustomLists(token, member.id, locale)]).catch(console.error);
  }, [member, locale]); // adicionei locale porque loadCustomLists depende dele

  const handleUpdateMember = async (
    formData: { name: string; bio: string; birthDate: string; gender: string; handle: string },
    imageFile: File | null
  ) => {
    if (!member) return;

    try {
      const token = getToken();
      if (!token) return;

      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);

        const uploadUrl = `${apiBase}/api/images/upload/${member.id}`;

        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // NÃO setar Content-Type aqui
          },
          body: formDataImage,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Upload failed: ${res.status} ${text || res.statusText}`);
        }
      }

      const payload = {
        id: member.id,
        name: formData.name,
        email: member.email,
        bio: formData.bio,
        birthDate: formData.birthDate,
        gender: formData.gender,
        handle: normalizeHandle(formData.handle) || suggestHandle(member),
      };

      const updated = await updateMember(member.id.toString(), payload);
      setMember(updated);

      toast.success(t("success_updating_profile"));
      setActiveModal(null);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(t("error_updating_profile"));
    }
  };


  return (
    <ProtectedRoute>
      <main className="w-full">
        {/* Header */}
        <Container>
          <div className="mt-5">
            <ProfileHeader
              member={member!}
              t={t}
              followers={followers}
              following={following}
              onEditClick={() => setActiveModal("edit")}
              setFollowers={setFollowers}
            />
          </div>
        </Container>

        {/* 1) Favoritos */}
        <Container>
          <section className="mt-6 space-y-4">
            {activeTab === "filmes" && <FavouriteMoviesCarouselSection />}
            {activeTab === "musicas" && <FavouriteAlbumCarouselSection />}
            {activeTab === "series" && <FavouriteSeriesCarouselSection />}
          </section>
        </Container>

        {/* 2) Avaliações recentes */}
        <Container>
          <section className="mt-6 space-y-4">
            <h2 className="text-white text-xl font-semibold">{t("recent_reviews")}</h2>
            <ReviewsCarouselSection />
          </section>
        </Container>

        {/* 3) Listas personalizadas */}
        <Container>
          <section className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-semibold">{t("custom_lists")}</h2>
              <button
                onClick={() => setActiveModal("createList")}
                className="bg-darkgreen text-white px-4 py-2 rounded hover:brightness-110"
              >
                {t("create_list")}
              </button>
            </div>

            <CustomListsSection
              isOpen={isListsOpen}
              onToggle={() => setIsListsOpen(!isListsOpen)}
              lists={customLists}
              onSelect={(list) => {
                setSelectedList(list);
                setActiveModal("viewList");
              }}
            />
          </section>
        </Container>

        <Container>
          <section className="mt-6">
            <h2 className="text-white text-xl font-semibold mb-3">{t("badges_wall")}</h2>
            {member && <BadgesWall memberId={member.id} />}
          </section>
        </Container>

        {activeModal === "edit" && (
          <ProfileEditModal
            member={member}
            onUpdateMember={handleUpdateMember}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "createList" && member && (
          <CreateCustomListModal
            isOpen
            onClose={() => setActiveModal(null)}
            memberId={member.id}
            onCreated={() => {
              const token = getToken();
              if (token) loadCustomLists(token, member.id, locale);
            }}
          />
        )}

        {activeModal === "viewList" && selectedList && member && (
          <CustomListModal
            isOpen
            onClose={() => setActiveModal(null)}
            id={selectedList.id}
            listName={selectedList.listName}
            listDescription={selectedList.list_description}
            onListDeleted={() => {
              const token = getToken();
              if (token) loadCustomLists(token, member.id, locale);
            }}
            onListUpdated={() => {
              const token = getToken();
              if (token) loadCustomLists(token, member.id, locale);
            }}
            member={member}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}
