// services/authService.tsx

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8080/member/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Verificar se o token JWT foi retornado
    if (data.token) {
      localStorage.setItem("authToken", data.token);
      return { success: true, message: "Login bem-sucedido!", token: data.token };
    } else {
      throw new Error("Token JWT não gerado.");
    }
  } catch (error: any) {
    return { success: false, message: "Erro ao fazer login. Verifique seu email e senha" };
  }
};
