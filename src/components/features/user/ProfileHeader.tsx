"use client";

import Image from "next/image";
import { FiEdit2 } from "react-icons/fi";
import { Member } from "@/types/Member";
import { ProfileStats } from "@/components/features/user/ProfileStats";
import { FollowButton } from "@/components/features/follow/FollowButton";

function normalizeHandle(v: string) {
  return v.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function suggestHandle(m?: Member | null) {
  if (!m) return "usuario";
  const fromHandle = normalizeHandle(m.handle || "");
  if (fromHandle) return fromHandle;
  const emailLeft = m.email?.split("@")[0] || "";
  const fromEmail = normalizeHandle(emailLeft);
  if (fromEmail) return fromEmail;
  const fromName = normalizeHandle((m.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;
  return `user${m.id || ""}`;
}

type Props = {
  member: Member;
  loggedMember?: Member | null;
  t: any;
  followers: number;
  following: number;
  setFollowers: React.Dispatch<React.SetStateAction<number>>;
  onEditClick?: () => void;
};

export default function ProfileHeader({
  member,
  loggedMember,
  t,
  followers,
  following,
  setFollowers,
  onEditClick,
}: Props) {
  const displayHandle = `@${normalizeHandle(member.handle || "") || suggestHandle(member)}`;

  // Mostra FollowButton apenas se estiver logado e não for o mesmo usuário
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
            {onEditClick && (
              <button
                onClick={onEditClick}
                className="text-gray-400 hover:text-white ml-1"
                title={t("edit_profile")}
              >
                <FiEdit2 size={18} />
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm whitespace-pre-wrap break-words max-w-[40ch] md:max-w-[60ch]" title={member.bio}>
            {member.bio || t("no_bio")}
          </p>
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
        <ProfileStats t={t} followers={followers} following={following} memberId={member.id.toString()} />
      </div>
    </div>
  );
}
