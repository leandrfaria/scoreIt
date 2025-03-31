// services/memberService.js

const fetchMembers = async () => {

    const token = localStorage.getItem('authToken'); 

    const response = await fetch('http://localhost:8080/member/get', {
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