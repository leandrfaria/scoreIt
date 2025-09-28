"use client";

import { useEffect, useState } from "react";
import { followUser } from "@/services/followers/followUser";
import { unfollowUser } from "@/services/followers/unfollowUser";
import { isFollowing } from "@/services/followers/isFollowing";
import { useMember } from "@/context/MemberContext";
import { getToken } from "@/lib/api";
import { useTranslations } from "next-intl";

interface FollowButtonProps {
  targetId: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

export const FollowButton = ({ targetId, onFollow, onUnfollow }: FollowButtonProps) => {
  const t = useTranslations("followButton");
  const { member } = useMember();
  const [isFollowed, setIsFollowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica se já segue (só se tiver token)
  useEffect(() => {
    const checkFollow = async () => {
      const token = getToken();
      if (!member?.id || String(member.id) === targetId || !token) {
        setIsFollowed(false); // assume que não segue se não houver token
        setLoading(false);
        return;
      }

      try {
        const result = await isFollowing(member.id.toString(), targetId, token);
        setIsFollowed(result);
      } catch (err) {
        console.error(t("errorCheckingFollow"), err);
        setIsFollowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkFollow();
  }, [member, targetId, t]);

  const handleToggleFollow = async () => {
    const token = getToken();
    if (!member?.id || !token) return alert(t("loginRequired"));

    try {
      if (isFollowed) {
        await unfollowUser(member.id.toString(), targetId, token);
        setIsFollowed(false);
        onUnfollow?.();
      } else {
        await followUser(member.id.toString(), targetId, token);
        setIsFollowed(true);
        onFollow?.();
      }
    } catch (err) {
      console.error(t("errorFollowUnfollow"), err);
    }
  };

  if (loading || isFollowed === null) return (
    <button className="bg-gray-700 text-white px-4 py-1 rounded cursor-not-allowed">
      {t("loading")}
    </button>
  );

  return (
    <button
      onClick={handleToggleFollow}
      className="bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded"
    >
      {isFollowed ? t("unfollow") : t("follow")}
    </button>
  );
};
