import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint de teste para verificar se as categorias estão sendo retornadas
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      include: {
        combos: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    const sortedCategories = categories.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });

    const totalCombos = sortedCategories.reduce((total, cat) => total + cat.combos.length, 0);

    return NextResponse.json({
      success: true,
      totalCategories: sortedCategories.length,
      totalCombos: totalCombos,
      categories: sortedCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        combosCount: cat.combos.length,
        combos: cat.combos.map(combo => ({
          id: combo.id,
          name: combo.name,
          price: combo.price,
          isActive: combo.isActive
        }))
      })),
      raw: sortedCategories
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Erro no teste de categorias:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

