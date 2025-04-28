export const resetEmail = async (token: string, newEmail: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("newEmail", newEmail);

    const response = await fetch("http://localhost:8080/api/reset-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const text = await response.text();
    console.log(text); 

    if (!response.ok) {
      return { success: false, message: text || "Erro ao atualizar o email" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: "Erro ao atualizar o email" };
  }
};
