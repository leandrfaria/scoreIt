export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("newPassword", newPassword);

    const response = await fetch("http://localhost:8080/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro ao atualizar a senha");
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
