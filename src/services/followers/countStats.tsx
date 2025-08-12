export const countFollowers = async (memberId: string, token: string): Promise<number> => {
    const res = await fetch(`http://localhost:8080/followers/${memberId}/countFollowers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao contar seguidores");
    return await res.json();
  };
  
  export const countFollowing = async (memberId: string, token: string): Promise<number> => {
    const res = await fetch(`http://localhost:8080/followers/${memberId}/countFollowing`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao contar seguindo");
    return await res.json();
  };
  