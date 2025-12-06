import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para debug: mostra o valor BRUTO de DATABASE_URL
 * Acesse: /api/setup/debug-env
 */
export async function GET(request: NextRequest) {
  try {
    // Pegar o valor BRUTO sem nenhum processamento
    const rawDatabaseUrl = process.env.DATABASE_URL || ''
    
    // Análise detalhada
    const analysis = {
      exists: !!rawDatabaseUrl,
      length: rawDatabaseUrl.length,
      isEmpty: rawDatabaseUrl.length === 0,
      isWhitespaceOnly: rawDatabaseUrl.trim().length === 0 && rawDatabaseUrl.length > 0,
      
      // Primeiros caracteres com códigos
      first30Chars: rawDatabaseUrl.substring(0, 30).split('').map((c, i) => ({
        index: i,
        char: c,
        charCode: c.charCodeAt(0),
        hex: c.charCodeAt(0).toString(16),
        isWhitespace: /\s/.test(c),
        isPrintable: c >= ' ' && c <= '~',
        description: c === ' ' ? 'espaço' : 
                    c === '\n' ? 'quebra de linha' :
                    c === '\r' ? 'carriage return' :
                    c === '\t' ? 'tab' :
                    c >= ' ' && c <= '~' ? 'printável' : 'não printável'
      })),
      
      // Verificações de formato
      startsWithPostgresql: rawDatabaseUrl.startsWith('postgresql://'),
      startsWithPostgres: rawDatabaseUrl.startsWith('postgres://'),
      startsWithPostgresqlTrimmed: rawDatabaseUrl.trimStart().startsWith('postgresql://'),
      startsWithPostgresTrimmed: rawDatabaseUrl.trimStart().startsWith('postgres://'),
      
      // Comparação
      raw: rawDatabaseUrl,
      trimmed: rawDatabaseUrl.trim(),
      trimmedStart: rawDatabaseUrl.trimStart(),
      trimmedEnd: rawDatabaseUrl.trimEnd(),
      
      // Preview mascarado
      preview: rawDatabaseUrl.replace(/:[^:@]+@/, ':****@'),
      
      // Todos os caracteres não printáveis
      nonPrintableChars: rawDatabaseUrl.split('').map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        hex: c.charCodeAt(0).toString(16)
      })).filter(c => !(c.char >= ' ' && c.char <= '~')),
      
      // Verificar se tem caracteres invisíveis no início
      leadingWhitespace: rawDatabaseUrl.length > 0 && rawDatabaseUrl !== rawDatabaseUrl.trimStart(),
      trailingWhitespace: rawDatabaseUrl.length > 0 && rawDatabaseUrl !== rawDatabaseUrl.trimEnd(),
      
      // Verificar todas as variáveis DATABASE
      allDatabaseVars: Object.keys(process.env)
        .filter(k => k.includes('DATABASE'))
        .map(k => ({
          key: k,
          value: process.env[k] || '',
          length: (process.env[k] || '').length,
          preview: (process.env[k] || '').replace(/:[^:@]+@/, ':****@').substring(0, 80)
        }))
    }
    
    return NextResponse.json({
      success: true,
      message: 'Análise completa do DATABASE_URL',
      analysis,
      recommendations: !analysis.startsWithPostgresql && !analysis.startsWithPostgres ? [
        '❌ A URL não começa com postgresql:// ou postgres://',
        `Primeiros 30 caracteres: "${analysis.first30Chars.map(c => c.char).join('')}"`,
        analysis.leadingWhitespace ? '⚠️ Há espaços/caracteres invisíveis no INÍCIO da URL' : '',
        analysis.trailingWhitespace ? '⚠️ Há espaços/caracteres invisíveis no FIM da URL' : '',
        analysis.nonPrintableChars.length > 0 ? `⚠️ Encontrados ${analysis.nonPrintableChars.length} caracteres não printáveis` : '',
        '',
        '🔧 SOLUÇÃO:',
        '1. No Railway → Serviço web → Variables',
        '2. Edite DATABASE_URL',
        '3. Certifique-se de que começa EXATAMENTE com: postgresql://',
        '4. Não deve ter espaços antes ou depois',
        '5. Copie a URL de DATABASE_PUBLIC_URL do serviço PostgreSQL'
      ].filter(Boolean) : [
        '✅ A URL parece estar no formato correto',
        'Se ainda há erro, pode ser problema de senha ou conexão'
      ]
    }, { status: 200 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao analisar DATABASE_URL',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


