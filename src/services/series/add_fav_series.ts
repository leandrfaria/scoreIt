export const addFavouriteSeries = async (token: string, memberId: number, seriesId: number,language: string) =>{
    try {
    const response = await fetch(`/members/favorites/${memberId}?language=${language}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        memberId, 
        mediaId: seriesId, 
        mediaType: 'series' 
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error adding favorite series:', error);
    return false;
  }
};
