import { fail, ok } from "@/lib/humanexus-http";
import { createProfessionalToken, verifyProfessionalCredentials } from "@/lib/humanexus-security";

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();
    if (!verifyProfessionalCredentials(String(email ?? ""), String(senha ?? ""))) {
      return fail(new Error("E-mail ou senha inválidos."), 401);
    }
    return ok({ token_de_acesso: createProfessionalToken(email) });
  } catch (error) {
    return fail(error, 400);
  }
}
