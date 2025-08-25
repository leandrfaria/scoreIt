// services/movie/add_fav_movie.ts
export const addFavouriteMovie = async (token: string, memberId: number, movieId: number, language: string) => {
  try {
    const response = await fetch(`/members/favorites/${memberId}?language=${language}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movieId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error adding favorite movie:', error);
    return false;
  }
};
