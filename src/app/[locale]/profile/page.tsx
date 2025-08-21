"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Others/Container";
import { ProtectedRoute } from "@/components/layout/Others/ProtectedRoute";
import { FiEdit2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

import ProfileEditModal from "@/components/features/user/ProfileEditModal";
import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";
import { CustomListModal } from "@/components/features/user/CustomListModal";
import { ProfileStats } from "@/components/features/user/ProfileStats";

import { useMember } from "@/context/MemberContext";
import { useTabContext } from "@/context/TabContext";

import { updateMember } from "@/services/user/member";
import { countFollowers, countFollowing } from "@/services/followers/countStats";
import { fetchMemberLists } from "@/services/customList/add_content_list";
import { CustomList } from "@/types/CustomList";
import { Member } from "@/types/Member";

// ------------------- API HELPERS -------------------

async function uploadProfileImage(token: string, memberId: number, imageFile: File) {
  const formDataImage = new FormData();
  formDataImage.append("file", imageFile);

  const res = await fetch(`http://localhost:8080/api/images/upload/${memberId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formDataImage,
  });

  if (!res.ok) throw new Error("Erro ao fazer upload da imagem");
}

async function createCustomList(token: string, memberId: number, name: string, description: string) {
  const res = await fetch("http://localhost:8080/customList/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberId, listName: name, description }),
  });

  if (!res.ok) throw new Error("Erro ao criar lista");
}

// ------------------- COMPONENT -------------------

type ModalType = "edit" | "createList" | "viewList" | null;

export default function Profile() {
  const { member, setMember } = useMember();
  const { activeTab } = useTabContext();
  const t = useTranslations("profile");

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [isListsOpen, setIsListsOpen] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  // ----------- Data Fetching -----------
  const loadCustomLists = async (token: string, memberId: number) => {
    try {
      const lists = await fetchMemberLists(token, memberId);
      setCustomLists(lists);
    } catch (err) {
      console.error("Erro ao carregar listas:", err);
      toast.error("Erro ao carregar listas");
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
    const token = localStorage.getItem("authToken");
    if (!token) return;

    Promise.all([fetchStats(token, member.id), loadCustomLists(token, member.id)]).catch(
      console.error
    );
  }, [member]);

  // ----------- Handlers -----------

  const handleUpdateMember = async (
    formData: { name: string; bio: string; birthDate: string; gender: string; handle: string },
    imageFile: File | null
  ) => {
    if (!member) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      if (imageFile) {
        await uploadProfileImage(token, member.id, imageFile);
      }

      const payload = {
        id: member.id,
        name: formData.name,
        email: member.email,
        bio: formData.bio,
        birthDate: formData.birthDate,
        gender: formData.gender,
        handle: formData.handle, // novo atributo
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

  const handleCreateList = async (formData: { name: string; description: string }) => {
    if (!member) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      await createCustomList(token, member.id, formData.name, formData.description);
      toast.success("Lista criada");
      setActiveModal(null);
      await loadCustomLists(token, member.id);
    } catch (error) {
      toast.error("Erro ao criar lista");
      console.error(error);
    }
  };

  // ----------- Render -----------

  return (
    <ProtectedRoute>
      <main className="w-full">
        <Container>
          <div className="mt-5 space-y-4">
            <ProfileHeader
              member={member}
              onEditClick={() => setActiveModal("edit")}
              t={t}
              followers={followers}
              following={following}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal("createList")}
                className="bg-darkgreen text-white px-4 py-2 rounded hover:brightness-110"
              >
                + Criar Lista
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
          </div>
        </Container>

        <Container>
          {activeTab === "filmes" && <FavouriteMoviesCarouselSection />}
          {activeTab === "musicas" && <FavouriteAlbumCarouselSection />}
          {activeTab === "series" && <FavouriteSeriesCarouselSection />}
        </Container>

        <Container>
          <ReviewsCarouselSection />
        </Container>

        {/* ----------- Modals ----------- */}
        {activeModal === "edit" && member && (
          <ProfileEditModal
            member={member}
            onUpdateMember={handleUpdateMember}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "createList" && member && (
          <CustomListModal
            onClose={() => setActiveModal(null)}
            onCreate={handleCreateList}
            member={member}
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
              const token = localStorage.getItem("authToken");
              if (token) loadCustomLists(token, member.id);
            }}
            onListUpdated={() => {
              const token = localStorage.getItem("authToken");
              if (token) loadCustomLists(token, member.id);
            }}
            member={member}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}

// ------------------- SUBCOMPONENTS -------------------

interface ProfileHeaderProps {
  member: Member | null;
  onEditClick: () => void;
  t: any;
  followers: number;
  following: number;
}

const ProfileHeader = ({ member, onEditClick, t, followers, following }: ProfileHeaderProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-4">
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
      <div className="flex flex-col text-white space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-medium">{member?.name}</span>
          {member?.handle && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
              @{member.handle}
            </span>
          )}
          <button
            onClick={onEditClick}
            className="text-gray-400 hover:text-white ml-1"
            title={t("edit_profile")}
          >
            <FiEdit2 size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-sm max-w-md">{member?.bio || t("no_bio")}</p>
      </div>
    </div>
    {member && (
      <ProfileStats t={t} followers={followers} following={following} memberId={member.id.toString()} />
    )}
  </div>
);

interface CustomListsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  lists: CustomList[];
  onSelect: (list: CustomList) => void;
}

const CustomListsSection = ({ isOpen, onToggle, lists, onSelect }: CustomListsSectionProps) => (
  <section className="mt-6">
    <div className="mb-2">
      <button
        className="flex items-center justify-between w-full text-xl font-semibold text-white"
        onClick={onToggle}
      >
        <span>Suas Listas</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, overflow: "hidden" }}
          animate={{ opacity: 1, height: "auto", overflow: "visible" }}
          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {lists.length === 0 ? (
            <p className="text-gray-400 py-2">Você não possui nenhuma lista!</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700 ring-1 ring-white/10"
                  onClick={() => onSelect(list)}
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
);
