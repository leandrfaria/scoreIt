export const sendResetNovoEmail = async (email: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append("email", email);
  
      const response = await fetch("http://localhost:8080/api/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
  
      return { success: true, message: "E-mail enviado com sucesso!" };
    } catch (error: any) {
      return { success: false, message: "Erro ao enviar e-mail de redefinição." };
    }
  };
  