"use client";

import Image from "next/image";
import { FiEdit2 } from "react-icons/fi";
import { Member } from "@/types/Member";
import { ProfileStats } from "@/components/features/user/ProfileStats";

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
  member: Member | null;
  t: any;
  followers: number;
  following: number;
  onEditClick?: () => void;
};

export default function ProfileHeader({ member, t, followers, following, onEditClick }: Props) {
  const displayHandle = `@${normalizeHandle(member?.handle || "") || suggestHandle(member)}`;

  return (
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
          <p className="text-gray-400 text-sm max-w-md">{member?.bio || t("no_bio")}</p>
        </div>
      </div>
      {member && (
        <ProfileStats
          t={t}
          followers={followers}
          following={following}
          memberId={member.id.toString()}
        />
      )}
    </div>
  );
}
