"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Member } from "@/types/Member";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { useLocale, useTranslations } from "next-intl";
import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import { fetchMemberById } from "@/services/user/member";
import { useTabContext } from "@/context/TabContext";
import { useMember } from "@/context/MemberContext";

export default function PublicProfilePage() {
    const [otherMember, setOtherMember] = useState<Member | null>(null);
    const { member } = useMember();
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const t = useTranslations("profile");
    const { activeTab } = useTabContext();
    const router = useRouter();
    const locale = useLocale();

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

    useEffect(() => {
        if (member?.id && String(member.id) === id) {
            router.replace(`/${locale}/profile`);
        }
    }, [member, id, router]);

    if (member?.id && String(member.id) === id) { return null; }
    if (loading) return <p className="text-white">Carregando...</p>;
    if (!otherMember) return <p className="text-white">Usuário não encontrado.</p>;

    return (
        <main className="w-full">
            <Container>
                <div className="mt-5">
                    <ProfileHeader member={otherMember} t={t} isEditable={false} />
                </div>
            </Container>
            <Container>
                {activeTab == "filmes" && <FavouriteMoviesCarouselSection memberId={id as string} />}
                {activeTab == "musicas" && <FavouriteAlbumCarouselSection memberId={id as string} />}
                {activeTab == "series" && <FavouriteSeriesCarouselSection memberId={id as string} />}
            </Container>
        </main>
    );
}

interface ProfileHeaderProps {
    member: Member;
    t: any;
    isEditable: boolean;
}

const ProfileHeader = ({ member, t }: ProfileHeaderProps) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
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
            <div className="flex flex-col text-white space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">{member?.name}</span>
                </div>
                <p className="text-gray-400 text-sm max-w-md">
                    {member?.bio || t("no_bio")}
                </p>
            </div>
            <div className="flex ml-6">
                <button
                    type="submit"
                    className={"bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded"}
                >
                    Seguir
                </button>
            </div>
        </div>
        <ProfileStats t={t} />
    </div>
);

interface ProfileStatsProps {
    t: any;
}

const ProfileStats = ({ t }: ProfileStatsProps) => (
    <div className="flex gap-6 text-center">
        <Stat label={t("movies")} value="7" />
        <Stat label={t("followers")} value="25" />
        <Stat label={t("following")} value="14" />
    </div>
);

interface StatProps {
    label: string;
    value: string;
}

const Stat = ({ label, value }: StatProps) => (
    <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
    </div>
);