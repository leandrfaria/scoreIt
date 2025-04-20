export const registerUser = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8080/member/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    return { success: true, message: "Usuário cadastrado com sucesso!" };
  } catch (error: any) {
    return { success: false, message: "Erro ao cadastrar, verifique as informações preenchidas"};
  }
};