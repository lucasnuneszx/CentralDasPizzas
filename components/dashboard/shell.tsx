'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Home, ShoppingCart, Package, Users, BarChart3, Settings, Smartphone, LogOut, Sun, Moon, Printer, ChefHat, MessageSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSession } from 'next-auth/react'
import { UserRole } from '@/lib/constants'

type NavItem = { href: string; label: string; icon: React.ComponentType<any>; roles: UserRole[] }

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
  { href: '/cashier/cash', label: 'Caixa', icon: ShoppingCart, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
  { href: '/admin/combos', label: 'Produtos', icon: Package, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
  { href: '/admin/users', label: 'Usuários', icon: Users, roles: [UserRole.ADMIN] },
  { href: '/admin/reports', label: 'Relatórios', icon: BarChart3, roles: [UserRole.ADMIN] },
  { href: '/admin/settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN] },
  { href: '/admin/print', label: 'Impressão', icon: Printer, roles: [UserRole.ADMIN] },
  { href: '/admin/chatbot', label: 'Chatbot', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { href: '/admin/ifood/dashboard', label: 'iFood', icon: Smartphone, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER] },
  { href: '/client/menu', label: 'Cardápio', icon: Package, roles: [UserRole.CLIENT] },
  { href: '/client/orders', label: 'Meus Pedidos', icon: ShoppingCart, roles: [UserRole.CLIENT] },
  { href: '/kitchen/orders', label: 'Cozinha', icon: ChefHat, roles: [UserRole.KITCHEN] },
]

export function DashboardShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const visibleItems = useMemo(() => {
    const role = session?.user?.role as UserRole | undefined
    if (!role) return []
    return allNavItems.filter(item => item.roles.includes(role))
  }, [session])

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-card fixed inset-y-0 left-0 z-40 w-64 -translate-x-full lg:translate-x-0 lg:static lg:w-auto transition-transform">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center mr-2">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">Central das Pizzas</div>
            <div className="text-xs text-muted-foreground">Sistema PDV</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="block">
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground ${active ? 'bg-accent text-accent-foreground' : ''}`}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card/80 backdrop-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="font-semibold hidden lg:block">Dashboard</div>
          <Button className="lg:hidden" variant="ghost" onClick={() => {
            const sb = document.querySelector('aside') as HTMLElement
            if (!sb) return
            const isOpen = sb.style.transform === 'translateX(0px)'
            sb.style.transform = isOpen ? '' : 'translateX(0)'
          }}>Menu</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/ifood/dashboard')}>
              <Smartphone className="h-4 w-4 mr-2" /> iFood
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => router.push('/auth/signin')}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
        
        {/* Footer */}
        <footer className="border-t bg-card/50 backdrop-blur py-4 px-4 sm:px-6">
          <div className="flex justify-center">
            <p className="text-muted-foreground text-xs">
              Powered By: <span className="font-semibold text-foreground">Lucas Nunes</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}


