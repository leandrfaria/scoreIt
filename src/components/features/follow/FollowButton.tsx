"use client";

import { useEffect, useState } from "react";
import { followUser } from "@/services/followers/followUser";
import { unfollowUser } from "@/services/followers/unfollowUser";
import { isFollowing } from "@/services/followers/isFollowing";
import { useMember } from "@/context/MemberContext";

interface FollowButtonProps {
    targetId: string;
    onFollow?: () => void;
    onUnfollow?: () => void;
  }
    
  export const FollowButton = ({ targetId, onFollow, onUnfollow }: FollowButtonProps) => {
    const { member } = useMember();
    const [isFollowed, setIsFollowed] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const checkFollow = async () => {
        if (!member?.id || String(member.id) === targetId) return;
  
        const token = localStorage.getItem("authToken");
        if (!token) return;
  
        try {
          const result = await isFollowing(member.id.toString(), targetId, token);
          setIsFollowed(result);
        } catch (err) {
          console.error("Erro ao verificar follow:", err);
        } finally {
          setLoading(false);
        }
      };
  
      checkFollow();
    }, [member, targetId]);
  
    const handleToggleFollow = async () => {
      if (!member?.id) return;
      const token = localStorage.getItem("authToken");
      if (!token) return;
  
      try {
        if (isFollowed) {
          await unfollowUser(member.id.toString(), targetId, token);
          setIsFollowed(false);
          onUnfollow?.(); // ✅ callback para atualizar contador
        } else {
          await followUser(member.id.toString(), targetId, token);
          setIsFollowed(true);
          onFollow?.(); // ✅ callback para atualizar contador
        }
      } catch (err) {
        console.error("Erro ao seguir/deixar de seguir:", err);
      }
    };
  
    if (loading || isFollowed === null) return null;
  
    return (
      <button
        onClick={handleToggleFollow}
        className="bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded"
      >
        {isFollowed ? "Deixar de seguir" : "Seguir"}
      </button>
    );
  };
  