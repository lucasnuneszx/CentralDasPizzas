import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, cpf } = await request.json()

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se o CPF já existe (se fornecido)
    // Remove formatação do CPF para busca
    let cleanCpf = cpf ? cpf.replace(/[^\d]/g, '') : null
    
    if (cleanCpf && cleanCpf.length === 11) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: cleanCpf }
      })

      if (existingCpf) {
        return NextResponse.json(
          { message: 'CPF já cadastrado' },
          { status: 400 }
        )
      }
    } else if (cleanCpf && cleanCpf.length !== 11) {
      return NextResponse.json(
        { message: 'CPF inválido' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone ? phone.replace(/[^\d]/g, '') : null, // Remove formatação do telefone
        cpf: cleanCpf || null, // CPF sem formatação
        role: 'CLIENT',
        isActive: true
      }
    })

    // Remover a senha da resposta
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    
    // Mensagens de erro mais específicas
    if (error instanceof Error) {
      // Erro do Prisma
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: 'Email ou CPF já cadastrado' },
          { status: 400 }
        )
      }
      
      // Outros erros do Prisma
      if (error.message.includes('prisma') || error.message.includes('database')) {
        return NextResponse.json(
          { message: 'Erro ao conectar com o banco de dados. Verifique a configuração.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Erro desconhecido') : undefined
      },
      { status: 500 }
    )
  }
}



