export const fetchFollowersList = async (userId: string) => {

    const token = localStorage.getItem("authToken")

    const res = await fetch(`http://localhost:8080/followers/${userId}/followers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao buscar seguidores");
    return await res.json();
  };
  
  export const fetchFollowingList = async (userId: string) => {

    const token = localStorage.getItem("authToken")

    const res = await fetch(`http://localhost:8080/followers/${userId}/following`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Erro ao buscar seguindo");
    return await res.json();
  };
  