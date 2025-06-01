import { jwtDecode, JwtPayload } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
    id: string; 
}

const fetchMembers = async (useJwtId = false) => {
    const token = localStorage.getItem('authToken'); 
    let url = 'http://localhost:8080/member/get';

    // Se useJwtId for true, tenta decodificar o ID do JWT
    if (useJwtId && token) {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        const memberId = decoded.id;
        url += `/${memberId}`;
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

const fetchMemberById = async (id: string) => {
    const token = localStorage.getItem('authToken'); 
    let url = 'http://localhost:8080/member/get';

    if (id && token) {
        url += `/${id}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar membro pelo id ${id}`);
    }

    const data = await response.json();
    return data;
};

const updateMember = async (memberId: string, payload: any) => {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`http://localhost:8080/member/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
    }

    const updatedMember = await response.json(); // Retorna o membro atualizado
    return updatedMember;
};

export { fetchMembers, updateMember, fetchMemberById };