import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para popular áreas de entrega com os bairros da lista
 * 
 * IMPORTANTE: Este endpoint deve ser protegido em produção!
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Populando áreas de entrega...')

    // Lista de bairros com seus respectivos valores
    const deliveryAreas = [
      { name: 'Gleba E', deliveryFee: 7 },
      { name: 'Gleba C', deliveryFee: 7 },
      { name: 'Gleba A', deliveryFee: 9 },
      { name: 'Gleba H', deliveryFee: 10 },
      { name: 'Parque V. I', deliveryFee: 6 },
      { name: 'Parque V. II', deliveryFee: 7 },
      { name: 'Brumado', deliveryFee: 10 },
      { name: 'Massaranduba', deliveryFee: 12 },
      { name: 'Praça Verde', deliveryFee: 7 },
      { name: 'Sítio Verde', deliveryFee: 7 },
      { name: 'Novo Coops', deliveryFee: 7 },
      { name: 'Novo Horizonte', deliveryFee: 9 },
      { name: 'Nova Vitória', deliveryFee: 9 },
      { name: 'Bairro Natal', deliveryFee: 10 },
      { name: 'Bairro Novo', deliveryFee: 12 },
      { name: 'Barra Satuba', deliveryFee: 9 },
      { name: 'Phae. I', deliveryFee: 7 },
      { name: 'Phae. II', deliveryFee: 7 },
      { name: 'Puma Preta', deliveryFee: 10 },
      { name: 'Cristo Redentor', deliveryFee: 10 },
      { name: 'Polo', deliveryFee: 25 },
      { name: 'Parafuso', deliveryFee: 18 },
      { name: 'Cascalheira', deliveryFee: 12 },
      { name: 'Gravatá', deliveryFee: 10 },
      { name: 'Camaçari de Dentro', deliveryFee: 9 },
      { name: 'Bairros 46', deliveryFee: 7 },
      { name: 'Nova Aliança', deliveryFee: 7 },
      { name: 'Algarobas', deliveryFee: 10 },
      { name: 'Lameirão', deliveryFee: 10 },
      { name: 'Santo Antônio', deliveryFee: 15 },
      { name: 'Dois de Julho', deliveryFee: 7 },
      { name: 'Parque das Palmeiras', deliveryFee: 12 },
      { name: 'Polo Plástico', deliveryFee: 10 },
      { name: 'Polo Petroquímico', deliveryFee: 25 },
      { name: 'Parque Satélite', deliveryFee: 10 },
      { name: 'Alto da Cruz', deliveryFee: 10 },
      { name: 'Centro', deliveryFee: 8 },
      { name: 'Jardim Brasília', deliveryFee: 9 },
      { name: 'Duo Hortência', deliveryFee: 12 },
      { name: 'Fricarm', deliveryFee: 10 },
      { name: 'Santa Maria', deliveryFee: 12 },
      { name: 'Triângulo', deliveryFee: 10 },
      { name: 'Hospital Geral', deliveryFee: 10 },
      { name: 'Parque das Mangabas. I', deliveryFee: 12 },
      { name: 'Parque das Mangabas. Parte II', deliveryFee: 15 },
      { name: 'Mangueiral', deliveryFee: 10 },
      { name: 'Bairros Industrial', deliveryFee: 9 },
      { name: 'Gleba B', deliveryFee: 10 },
      { name: 'Alphaville', deliveryFee: 12 }
    ]

    // Cidade e estado padrão (assumindo Camaçari/BA baseado nos bairros)
    const defaultCity = 'Camaçari'
    const defaultState = 'BA'

    const createdAreas = []
    const existingAreas = []
    const errors = []

    for (const areaData of deliveryAreas) {
      try {
        // Verificar se já existe uma área com o mesmo nome na mesma cidade
        const existingArea = await prisma.deliveryArea.findUnique({
          where: {
            name_city_state: {
              name: areaData.name,
              city: defaultCity,
              state: defaultState
            }
          }
        })

        if (!existingArea) {
          const area = await prisma.deliveryArea.create({
            data: {
              name: areaData.name,
              city: defaultCity,
              state: defaultState,
              deliveryFee: areaData.deliveryFee,
              isActive: true
            }
          })
          createdAreas.push({
            name: area.name,
            city: area.city,
            state: area.state,
            deliveryFee: area.deliveryFee
          })
          console.log(`✅ Área criada: ${area.name} - Taxa: R$ ${area.deliveryFee}`)
        } else {
          existingAreas.push({
            name: existingArea.name,
            city: existingArea.city,
            state: existingArea.state,
            deliveryFee: existingArea.deliveryFee
          })
          console.log(`⚠️ Área já existe: ${areaData.name}`)
        }
      } catch (error) {
        errors.push({
          name: areaData.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        console.error(`❌ Erro ao criar ${areaData.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Processo de criação de áreas de entrega concluído',
      created: createdAreas,
      existing: existingAreas,
      errors: errors,
      summary: {
        total: deliveryAreas.length,
        created: createdAreas.length,
        existing: existingAreas.length,
        errors: errors.length
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao popular áreas de entrega:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao popular áreas de entrega',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

