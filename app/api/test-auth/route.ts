import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

/**
 * Endpoint de teste para diagnosticar problemas de autenticação
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email e senha são obrigatórios'
      }, { status: 400 });
    }

    const results: any = {
      email,
      checks: []
    };

    // 1. Verificar se NEXTAUTH_SECRET está configurado
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    results.checks.push({
      check: 'NEXTAUTH_SECRET configurado',
      status: hasNextAuthSecret ? '✅ OK' : '❌ FALTANDO',
      value: hasNextAuthSecret ? 'Configurado' : 'Não configurado'
    });

    // 2. Verificar se NEXTAUTH_URL está configurado
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
    results.checks.push({
      check: 'NEXTAUTH_URL configurado',
      status: hasNextAuthUrl ? '✅ OK' : '❌ FALTANDO',
      value: process.env.NEXTAUTH_URL || 'Não configurado'
    });

    // 3. Verificar se DATABASE_URL está configurado
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    results.checks.push({
      check: 'DATABASE_URL configurado',
      status: hasDatabaseUrl ? '✅ OK' : '❌ FALTANDO',
      value: hasDatabaseUrl ? 'Configurado' : 'Não configurado'
    });

    // 4. Testar conexão com banco
    let dbConnected = false;
    try {
      await prisma.$connect();
      dbConnected = true;
      results.checks.push({
        check: 'Conexão com banco',
        status: '✅ OK',
        value: 'Conectado'
      });
    } catch (dbError) {
      results.checks.push({
        check: 'Conexão com banco',
        status: '❌ ERRO',
        value: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      });
    }

    // 5. Buscar usuário
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });
      results.checks.push({
        check: 'Usuário encontrado',
        status: user ? '✅ OK' : '❌ NÃO ENCONTRADO',
        value: user ? `Encontrado: ${user.name}` : 'Usuário não existe'
      });
    } catch (userError) {
      results.checks.push({
        check: 'Buscar usuário',
        status: '❌ ERRO',
        value: userError instanceof Error ? userError.message : 'Erro desconhecido'
      });
    }

    // 6. Verificar senha
    if (user) {
      if (!user.password) {
        results.checks.push({
          check: 'Senha do usuário',
          status: '❌ SEM SENHA',
          value: 'Usuário não tem senha cadastrada'
        });
      } else if (!user.isActive) {
        results.checks.push({
          check: 'Usuário ativo',
          status: '❌ INATIVO',
          value: 'Usuário está inativo'
        });
      } else {
        try {
          const isPasswordValid = await verifyPassword(password, user.password);
          results.checks.push({
            check: 'Senha válida',
            status: isPasswordValid ? '✅ OK' : '❌ INVÁLIDA',
            value: isPasswordValid ? 'Senha correta' : 'Senha incorreta'
          });
        } catch (pwdError) {
          results.checks.push({
            check: 'Verificar senha',
            status: '❌ ERRO',
            value: pwdError instanceof Error ? pwdError.message : 'Erro desconhecido'
          });
        }
      }
    }

    // Resumo
    const allOk = results.checks.every((c: { status: string }) => c.status.includes('✅'));
    results.summary = {
      success: allOk,
      message: allOk 
        ? 'Todos os checks passaram! O login deve funcionar.' 
        : 'Alguns checks falharam. Veja os detalhes acima.'
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}

