export const unfollowUser = async (followerId: string, followedId: string, token: string) => {
    const res = await fetch(`http://localhost:8080/followers/unfollow?followerId=${followerId}&followedId=${followedId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao deixar de seguir usuário");
    return true;
  };
  