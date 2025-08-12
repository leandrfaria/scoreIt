export const isFollowing = async (followerId: string, followedId: string, token: string): Promise<boolean> => {
    const res = await fetch(`http://localhost:8080/followers/isFollowing?followerId=${followerId}&followedId=${followedId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Erro ao verificar se está seguindo");
    return await res.json();
  };
  