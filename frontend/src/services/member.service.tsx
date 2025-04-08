import { jwtDecode, JwtPayload } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
    id: string; 
}

const fetchMembers = async (useJwtId = false) => {
    const token = localStorage.getItem('authToken'); 
    let url = 'http://localhost:8080/member/get';

    // Se useJwtId for true, tenta decodificar o ID do JWT
    if (useJwtId && token) {
        const decoded = jwtDecode<CustomJwtPayload>(token); // Use a interface CustomJwtPayload
        const memberId = decoded.id; // Supondo que o ID do membro esteja no payload como 'id'
        url += `/${memberId}`;
        console.log('ID :::: ', memberId)
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar membros');
    }

    const data = await response.json();
    return data;
};

export { fetchMembers };