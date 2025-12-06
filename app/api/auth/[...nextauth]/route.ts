import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

// Configurar para funcionar em qualquer host/rede
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }


