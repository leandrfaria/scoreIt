export const followUser = async (followerId: string, followedId: string, token: string) => {
    const res = await fetch(`http://localhost:8080/followers/follow?followerId=${followerId}&followedId=${followedId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao seguir usuário");
    return true;
  };
  