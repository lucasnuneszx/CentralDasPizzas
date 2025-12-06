import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

// Configurar para funcionar em qualquer host/rede
const handler = NextAuth({
  ...authOptions,
  trustHost: true, // CRÍTICO: Permite funcionar em qualquer dispositivo/rede
  // Forçar uso da URL pública mesmo em diferentes hosts
  callbacks: {
    ...authOptions.callbacks,
    async signIn() {
      return true
    },
  },
})

export { handler as GET, handler as POST }


