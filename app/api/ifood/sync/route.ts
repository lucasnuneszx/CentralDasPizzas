import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/constants'

interface IfoodOrder {
  id: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    description?: string
  }>
  total: number
  deliveryFee: number
  paymentMethod: string
  deliveryType: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  notes?: string
  createdAt: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !(await hasAnyRole(['ADMIN', 'MANAGER', 'CASHIER']))) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { orders } = await request.json()

    if (!Array.isArray(orders)) {
      return NextResponse.json({ message: 'Formato de dados inválido' }, { status: 400 })
    }

    const syncedOrders = []

    for (const ifoodOrder of orders) {
      try {
        // Verificar se o pedido já existe
        const existingOrder = await prisma.order.findFirst({
          where: { ifoodOrderId: ifoodOrder.id }
        })

        if (existingOrder) {
          continue // Pular pedidos já sincronizados
        }

        // Criar ou encontrar cliente
        let user = await prisma.user.findUnique({
          where: { email: ifoodOrder.customer.email || `${ifoodOrder.customer.phone}@ifood.com` }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: ifoodOrder.customer.name,
              email: ifoodOrder.customer.email || `${ifoodOrder.customer.phone}@ifood.com`,
              phone: ifoodOrder.customer.phone,
              role: 'CLIENT'
            }
          })
        }

        // Criar endereço se necessário
        let address = null
        if (ifoodOrder.address) {
          address = await prisma.address.create({
            data: {
              userId: user.id,
              street: ifoodOrder.address.street,
              number: ifoodOrder.address.number,
              complement: ifoodOrder.address.complement,
              neighborhood: ifoodOrder.address.neighborhood,
              city: ifoodOrder.address.city,
              state: ifoodOrder.address.state,
              zipCode: ifoodOrder.address.zipCode,
              isDefault: true
            }
          })
        }

        // Criar pedido
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            addressId: address?.id,
            total: ifoodOrder.total,
            status: 'PENDING',
            paymentMethod: ifoodOrder.paymentMethod,
            deliveryType: ifoodOrder.deliveryType,
            notes: ifoodOrder.notes,
            ifoodOrderId: ifoodOrder.id
          }
        })

        // Criar itens do pedido (buscar combos existentes ou criar genéricos)
        for (const item of ifoodOrder.items) {
          // Busca simples por substring (SQLite não suporta 'mode: insensitive' aqui)
          // Usar select explícito para evitar erro de coluna não existente
          let combo = await prisma.combo.findFirst({
            where: { name: { contains: item.name } },
            select: { id: true, name: true, price: true, isActive: true, categoryId: true }
          })

          if (!combo) {
            // Criar combo genérico se não existir
            let defaultCategory = await prisma.category.findFirst()
            if (!defaultCategory) {
              await prisma.category.create({
                data: {
                  name: 'iFood',
                  description: 'Produtos do iFood'
                }
              })
              defaultCategory = await prisma.category.findFirst()
            }

            combo = await prisma.combo.create({
              data: {
                name: item.name,
                description: item.description || 'Produto do iFood',
                price: item.price,
                categoryId: defaultCategory?.id || '',
                isActive: true
              }
            })
          }

          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              comboId: combo.id,
              quantity: item.quantity,
              price: item.price
            }
          })
        }

        // Registrar no caixa
        await prisma.cashLog.create({
          data: {
            orderId: order.id,
            type: 'ORDER',
            amount: ifoodOrder.total,
            description: `Pedido iFood #${ifoodOrder.id}`
          }
        })

        // IMPRESSÃO AUTOMÁTICA para pedidos do iFood
        try {
          const orderForPrint = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
              items: {
                include: {
                  combo: true
                }
              },
              address: true,
              user: true
            }
          })

          if (orderForPrint) {
            // Chamar API de impressão para cozinha (usar URL relativa)
            await fetch('/api/print', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: order.id,
                printType: 'kitchen'
              })
            }).catch(err => {
              console.error('Erro ao imprimir pedido iFood:', err)
            })

            // Registrar impressão no log
            await prisma.cashLog.create({
              data: {
                orderId: order.id,
                type: 'ORDER_PRINTED',
                amount: 0,
                description: `Pedido iFood impresso automaticamente - #${order.id.slice(-8)}`
              }
            })
          }
        } catch (printError) {
          console.error('Erro na impressão automática do pedido iFood:', printError)
          // Não bloquear o fluxo se a impressão falhar
        }

        syncedOrders.push({
          id: order.id,
          ifoodOrderId: ifoodOrder.id,
          customer: ifoodOrder.customer.name,
          total: ifoodOrder.total
        })

      } catch (error) {
        console.error(`Erro ao sincronizar pedido ${ifoodOrder.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: `${syncedOrders.length} pedidos sincronizados com sucesso`,
      syncedOrders
    })

  } catch (error) {
    console.error('Erro na sincronização iFood:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}

