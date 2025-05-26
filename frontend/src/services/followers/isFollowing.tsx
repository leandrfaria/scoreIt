export const isFollowing = async (followerId: string, followedId: string, token: string): Promise<boolean> => {

    console.log('ID SEGUIDOR:: ', followerId)
    console.log('ID PAGINA:: ', followedId)

    const res = await fetch(`http://localhost:8080/followers/isFollowing?followerId=${followerId}&followedId=${followedId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("RESULTADO :::", res)
    if (!res.ok) throw new Error("Erro ao verificar se está seguindo");
    return await res.json();
  };
  