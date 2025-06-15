export const sendVerificaEmail = async (email: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append("email", email);
  
      const response = await fetch("http://localhost:8080/member/confirm?token=${token}", {
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



export const ConfirmEmail = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:8080/member/confirm?token=${token}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Token invalido");
      }
  
      return { success: true, message: "Conta confirmada com sucesso!" };
    } catch (error: any) {
      return { success: false, message: "Falha ao confirmar a conta" };
    }
  };
