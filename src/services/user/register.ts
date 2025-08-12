export const registerUser = async (name: string, email: string, password: string, birth_date: string, gender: string) => {
  try {
    const response = await fetch("http://localhost:8080/member/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, birthDate: birth_date, gender }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn("Resposta do backend não é JSON:", jsonError);
    }

    if (response.ok) {
      return { success: true, message: "Usuário cadastrado com sucesso!" };
    } else {
      return {
        success: false,
        message: data?.message || `Erro ao cadastrar: status ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error("Erro na requisição:", error);
    return {
      success: false,
      message: "Erro ao cadastrar, verifique as informações preenchidas.",
    };
  }
};