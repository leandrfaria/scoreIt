// File: app/(routes)/[id]/page.tsx (PublicProfilePage) - i18n updated

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
import { getToken, apiFetch } from "@/lib/api";
import toast from "react-hot-toast";

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

  // report modal state
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Buscar dados do usuário pelo handle
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const data = await fetchMemberByHandle(handle as string, { signal: controller.signal });
        setOtherMember(data);
      } catch (error) {
        console.error(t("errorFetchingProfile"), error);
        toast.error(t("errorFetchingProfile"));
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
        toast.error(t("errorFetchingCounts"));
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
        toast.error(t("errorFetchingCustomLists"));
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
            onOpenReport={() => setIsReportOpen(true)}
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

      {isReportOpen && otherMember && (
        <ReportModal
          onClose={() => setIsReportOpen(false)}
          reported={otherMember}
          reporter={loggedMember}
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
  onOpenReport?: () => void;
}

const ProfileHeader = ({
  member,
  t,
  followers,
  following,
  setFollowers,
  loggedMember,
  onOpenReport,
}: ProfileHeaderProps) => {
  const displayHandle = `@${normalizeHandle(member.handle || "") || suggestHandle(member)}`;

  const showFollowButton = loggedMember?.id && loggedMember.id !== member.id;
  const showReportButton = showFollowButton && !!onOpenReport;

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
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">{displayHandle}</span>
          </div>
          <p className="text-gray-400 text-sm max-w-md">{member.bio || t("no_bio")}</p>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {showFollowButton && (
            <FollowButton
              targetId={member.id.toString()}
              onFollow={() => setFollowers((prev) => prev + 1)}
              onUnfollow={() => setFollowers((prev) => Math.max(prev - 1, 0))}
            />
          )}

          {showReportButton && (
            <button
              onClick={() => onOpenReport && onOpenReport()}
              className="ml-2 px-3 py-1 bg-red-700 rounded hover:bg-red-600 text-white"
              title={t("report_reportButtonTitle")}
            >
              {t("report_openButton")}
            </button>
          )}
        </div>
      </div>

      <div className="w-full md:w-auto mt-4 md:mt-0">
        <ProfileStats t={t} followers={followers} following={following} memberId={member.id.toString()} />
      </div>
    </div>
  );
};
interface ReportModalProps {
  onClose: () => void;
  reported: Member;
  reporter?: Member | null;
}

const ReportModal = ({ onClose, reported, reporter }: ReportModalProps) => {
  const t = useTranslations("profile");
  const [reason, setReason] = useState<string>(""); // agora textarea único
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!reason.trim()) {
      toast.error(t("report_errors_empty"));
      return;
    }
    if (!reporter?.id) {
      toast.error(t("report_errors_unauthenticated"));
      return;
    }

    setSubmitting(true);
    try {
      // Monta query string conforme sua API requisita
      const params = new URLSearchParams();
      params.set("reporterId", String(reporter.id));
      params.set("reportedId", String(reported.id));
      params.set("reason", reason.trim());

      const path = `/reports?${params.toString()}`;

      // Chamada usando query params — método POST (se sua API aceitar GET, troque para "GET")
      await apiFetch(path, {
        method: "POST",
        auth: true,
      });

      toast.success(t("report_success"));
      onClose();
      setReason("");
    } catch (err) {
      console.error("Erro ao enviar denúncia:", err);
      toast.error(t("report_errors_submit"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && onClose()} />

      <div className="relative w-full max-w-lg bg-zinc-900 p-6 rounded-xl shadow-2xl ring-1 ring-white/10 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("report_title")}</h3>
          <button onClick={() => !submitting && onClose()} className="text-white/80 hover:text-white" aria-label={t("report_closeAria")}>
            ✕
          </button>
        </div>

        <p className="text-sm mb-4">
          {t("report_intro", { name: reported?.name ?? "" })}
        </p>
        <label className="block mb-2 text-sm">{t("report_label")}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={6}
          placeholder={t("report_placeholder")}
          className="w-full mb-4 rounded px-3 py-2 bg-zinc-800 text-white resize-none"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => !submitting && onClose()}
            className="px-3 py-1 border border-gray-600 text-gray-200 rounded-lg hover:bg-white/5"
            disabled={submitting}
          >
            {t("report_cancel")}
          </button>
          <button onClick={submitReport} className="px-4 py-1 bg-red-700 rounded hover:bg-red-600 text-white" disabled={submitting}>
            {submitting ? t("report_sending") : t("report_submit")}
          </button>
        </div>
      </div>
    </div>
  );
};
