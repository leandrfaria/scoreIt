export const sendResetEmail = async (email: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append("email", email);

    const response = await fetch("http://localhost:8080/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro ao enviar e-mail de redefinição.");
    }

    return { success: true, message: "E-mail enviado com sucesso!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
