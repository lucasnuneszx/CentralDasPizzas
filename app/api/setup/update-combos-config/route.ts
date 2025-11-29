import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para atualizar configurações dos combos existentes
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Atualizando configurações dos combos...')

    // Mapeamento de combos com suas configurações
    const combosConfig: { [key: string]: { pizzaQuantity: number; allowCustomization: boolean; showFlavors: boolean } } = {
      'COMBO DO DIA': { pizzaQuantity: 1, allowCustomization: true, showFlavors: true },
      'COMBO MASTER': { pizzaQuantity: 1, allowCustomization: true, showFlavors: true },
      'DOBRO DE PIZZA FAMÍLIA': { pizzaQuantity: 3, allowCustomization: true, showFlavors: true },
      'PIZZA + BATATA + COXINHAS': { pizzaQuantity: 1, allowCustomization: true, showFlavors: true },
      'DOBRO DE PIZZA MÉDIA': { pizzaQuantity: 2, allowCustomization: true, showFlavors: true },
      'COMBO SUPREMO': { pizzaQuantity: 2, allowCustomization: true, showFlavors: true },
      'DOBRO DE PIZZA GRANDE': { pizzaQuantity: 2, allowCustomization: true, showFlavors: true },
      'COMBO MEGA CHOCOLATE': { pizzaQuantity: 2, allowCustomization: true, showFlavors: true },
      'DOBRO DE PIZZA GRANDE COMPLETO': { pizzaQuantity: 3, allowCustomization: true, showFlavors: true }
    }

    const updatedCombos = []
    const notFoundCombos = []

    // Buscar todos os combos
    const allCombos = await prisma.combo.findMany({
      where: {
        category: {
          name: 'Combos'
        }
      }
    })

    for (const combo of allCombos) {
      const config = combosConfig[combo.name]
      
      if (config) {
        try {
          await prisma.combo.update({
            where: { id: combo.id },
            data: {
              allowCustomization: config.allowCustomization,
              pizzaQuantity: config.pizzaQuantity,
              showFlavors: config.showFlavors,
              isPizza: config.pizzaQuantity > 0
            }
          })
          updatedCombos.push({
            id: combo.id,
            name: combo.name,
            ...config
          })
          console.log(`✅ Combo atualizado: ${combo.name}`)
        } catch (error) {
          console.error(`❌ Erro ao atualizar ${combo.name}:`, error)
        }
      } else {
        // Para combos sem pizza, manter configurações padrão
        try {
          await prisma.combo.update({
            where: { id: combo.id },
            data: {
              allowCustomization: false,
              pizzaQuantity: 0,
              showFlavors: false,
              isPizza: false
            }
          })
          updatedCombos.push({
            id: combo.id,
            name: combo.name,
            pizzaQuantity: 0,
            allowCustomization: false,
            showFlavors: false
          })
        } catch (error) {
          console.error(`❌ Erro ao atualizar ${combo.name}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações dos combos atualizadas com sucesso!',
      updated: updatedCombos,
      summary: {
        total: allCombos.length,
        updated: updatedCombos.length
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao atualizar combos:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao atualizar combos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

