import fs from "fs";
// @ts-ignore
import pdf from "pdf-parse";
import ExcelJS from "exceljs";

interface RubricaData {
  mesAno: string; // MÊS/ANO (competência/pagamento detectado no contexto)
  mesAnoDir?: string; // MÊS/ANO DIR (mês de referência encontrado na linha), quando houver
  descricaoRubrica: string; // descrição original da rubrica
  valor: number; // valor numérico (positivo para vantagens, NEGATIVO para descontos)
}

interface MesAnoData {
  mesAno: string;
  ano: number;
  mes: number;
  rubricas: Record<string, number>;
}

// Mapeamento de rubricas do PDF para colunas do Excel
const MAPEAMENTO_RUBRICAS: Record<string, string> = {
  "VENCIMENTO BASICO DO CARGO EFETIVO": "VENC. BASE",
  "VENCIMENTO BASICO": "VENC. BASE",
  "SALARIO BASE": "VENC. BASE",
  "PROVENTOS DO CARGO EFETIVO": "VENC. BASE",

  "ADICIONAL POR TEMPO DE SERVICO": "ADTS",
  "ADICIONAL TEMPO SERVICO": "ADTS",

  INSALUBRIDADE: "INSALUBRIDADE",

  "GRATIFICACAO DE JORNADA ESPECIAL": "GRATIF. JORNADA ESPECIAL",
  "GRATIF JORNADA ESPECIAL": "GRATIF. JORNADA ESPECIAL",

  "ADICIONAL NOTURNO": "ADD NOTURNO",
  "ADICIONAL NOTURNO HAB": "ADD NOTURNO",
  "ADD NOTURNO": "ADD NOTURNO",

  "FUNCAO GRATIFICADA": "FUNÇÃO GRATIFICADA",

  "ADICIONAL DE FERIAS": "ADICIONAL DE FÉRIAS",

  "GRATIFICACAO NATALINA": "GRATIFICAÇÃO NATALINA",
  "ADIANTAMENTO GRATIFICACAO NATALINA": "ADIANTAMENTO GRATIFICAÇÃO NATALINA",

  "TOTAL DE VANTAGENS": "TOTAL VANTAGENS",
  "TOTAL VANTAGENS": "TOTAL VANTAGENS",

  "INSTITUTO DE PREVIDENCIA ESTADUAL LC 30805 ADM 25102005": "IPE",
  "INSTITUTO DE PREVIDENCIA ESTADUAL LC 308 05 ADM 25 10 2005": "IPE",
  "INSTITUTO DE PREVIDENCIA ESTADUAL 13 SALARIO LC 30805": "IPE",
  "INSTITUTO DE PREVIDENCIA ESTADUAL 13 SALARIO LC 308 05": "IPE",
  "INSTITUTO DE PREVIDENCIA ESTADUAL": "IPE",
  "IPE RN": "IPE",
  IPE: "IPE",

  "TOTAL DE DESCONTOS": "TOTAL DESCONTOS",
  "TOTAL DESCONTOS": "TOTAL DESCONTOS",

  "TOTAL LIQUIDO": "TOTAL LÍQUIDO",
  "TOTAL A RESTITUIR": "TOTAL LÍQUIDO",

  "RETENCAO DE IMPOSTO DE RENDA NA FONTE": "IRRF",
  "RETENCAO DE IMPOSTO DE RENDA NA FONTE GRAT NATALINA": "IRRF 13º",
  "IMPOSTO DE RENDA": "IRRF",
};

export class PdfService {
  /**
   * Extrai informações do usuário (nome, CPF, cargo, matrícula) a partir do PDF
   */
  static async extractUserInfoFromPdf(filePath: string): Promise<{
    name: string;
    cpf: string;
    cargo: string;
    matricula: string;
  } | null> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text;
      const lines = text
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      let name: string | undefined;
      let cpf: string | undefined;
      let cargo: string | undefined;
      let matricula: string | undefined;

      const cpfDigits = (s: string) => s.replace(/\D/g, "");

      // Conjunto amplo de rótulos para limitar capturas na mesma linha
      const labelBoundary =
        /(MATR[ÍI]CULA|CPF|V[ÍI]NCULO|CARGO|JORNADA|REF(?:ER[ÊE]NCIA)?|LOTAC[AÃ]O|SETOR|SITUA[ÇC][ÃA]O|REGIME|CBO|FUN[ÇC][ÃA]O|N[ÍI]VEL|PADR[ÃA]O)\b/i;

      let cpfLineIndex: number | undefined = undefined;

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.replace(/\s+/g, " ").trim();

        // NOME (com rótulo), parando no próximo rótulo conhecido
        if (!name) {
          const m = line.match(
            /^NOME(?:\s+DO\s+SERVIDOR)?\s*[:\-]?\s*(.+?)(?=\s*(MATR[ÍI]CULA|CPF|V[ÍI]NCULO|CARGO|JORNADA|REF(?:ER[ÊE]NCIA)?|LOTAC[AÃ]O|SETOR|SITUA[ÇC][ÃA]O|REGIME|CBO|FUN[ÇC][ÃA]O|N[ÍI]VEL|PADR[ÃA]O)\b|$)/i
          );
          if (m) {
            name = m[1].trim();
          }
        }

        // Fallback de NOME sem rótulo: tudo antes do próximo rótulo conhecido
        if (!name) {
          const idx = line.search(labelBoundary);
          if (idx > 0) {
            const possibleName = line.slice(0, idx).trim();
            if (
              possibleName.length > 3 &&
              !/^(MATR[ÍI]CULA|CPF|V[ÍI]NCULO|CARGO)\b/i.test(possibleName)
            ) {
              name = possibleName;
            }
          }
        }

        // CPF
        if (!cpf) {
          const m =
            line.match(/CPF\s*[:\-]?\s*([\d.\-]+)/i) ||
            line.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/);
          if (m) {
            cpf = cpfDigits(m[1] || m[0]);
            cpfLineIndex = i;
          }
        }

        // MATRÍCULA (com ou sem acento), capture somente até o próximo rótulo conhecido
        if (!matricula) {
          const m = line.match(
            new RegExp(
              "MATR[ÍI]CULA\\s*[:\\-]?\\s*" +
                "([A-Z0-9.\\-\\/]+?)" +
                "(?=\\s*(MATR[ÍI]CULA|CPF|V[ÍI]NCULO|CARGO|JORNADA|REF(?:ER[ÊE]NCIA)?|LOTAC[AÃ]O|SETOR|SITUA[ÇC][ÃA]O|REGIME|CBO|FUN[ÇC][ÃA]O|N[ÍI]VEL|PADR[ÃA]O)\\b|$)",
              "i"
            )
          );
          if (m) {
            const token =
              m[1].match(/[0-9]{3,}[A-Z]?(?:[\/ -][0-9A-Z]+)?/)?.[0] || m[1];
            matricula = token.trim();
          }
        }

        // CARGO (apenas do rótulo CARGO, não confundir com VÍNCULO) e pare no próximo rótulo conhecido
        if (!cargo) {
          const mCargo = line.match(
            /CARGO\s*[:\-]?\s*(.+?)(?=\s*(MATR[ÍI]CULA|CPF|V[ÍI]NCULO|CARGO|JORNADA|REF(?:ER[ÊE]NCIA)?|LOTAC[AÃ]O|SETOR|SITUA[ÇC][ÃA]O|REGIME|CBO|FUN[ÇC][ÃA]O|N[ÍI]VEL|PADR[ÃA]O)\b|$)/i
          );
          if (mCargo) {
            let cargoStr = mCargo[1].trim();
            cargoStr = cargoStr.replace(/\s*(JORNADA|REF(?:ER[ÊE]NCIA)?).*/i, "").trim();
            cargo = cargoStr;
          }
        }
      }

      // Fallback adicional: se encontramos CPF, mas não o nome, tente linhas próximas ao CPF
      if (!name && typeof cpfLineIndex === "number") {
        // procure até 3 linhas acima que pareçam um nome (não contenham rótulos e tenham letras)
        for (let k = cpfLineIndex - 1; k >= Math.max(0, cpfLineIndex - 3); k--) {
          const l = lines[k].replace(/\s+/g, " ").trim();
          if (!l) continue;
          if (labelBoundary.test(l)) continue;
          // aceitar se tiver pelo menos duas palavras com letras
          if (/\p{L}{2,}/u.test(l) && /\s+/.test(l)) {
            name = l;
            break;
          }
        }
        // se não achou acima, tente até 2 linhas abaixo
        if (!name) {
          for (let k = cpfLineIndex + 1; k <= Math.min(lines.length - 1, cpfLineIndex + 2); k++) {
            const l = lines[k].replace(/\s+/g, " ").trim();
            if (!l) continue;
            if (labelBoundary.test(l)) continue;
            if (/\p{L}{2,}/u.test(l) && /\s+/.test(l)) {
              name = l;
              break;
            }
          }
        }
      }

      if (cpf) {
        return {
          name: name || "NÃO INFORMADO",
          cpf,
          cargo: cargo || "NÃO INFORMADO",
          matricula: matricula || "NÃO INFORMADO",
        };
      }
      return null;
    } catch (e) {
      console.warn("Falha ao extrair dados do usuário do PDF:", e);
      return null;
    }
  }
  /**
   * Normaliza nome de coluna (rubrica) e mapeia para o nome padronizado
   */
  public static mapearRubrica(descricao: string): string {
    // If descricao already matches a known target value in the mapping, return it unchanged
    const asUpper = descricao.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const target of Object.values(MAPEAMENTO_RUBRICAS)) {
      if (asUpper === target.toUpperCase() || asUpper.includes(target.toUpperCase())) {
        return target;
      }
    }

    const normalizada = descricao
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^A-Z0-9\s]/g, "") // remove símbolos (/, -, etc)
      .replace(/\s+/g, " ") // espaços múltiplos para único
      .trim();

    // Busca no mapeamento
    for (const [chave, valor] of Object.entries(MAPEAMENTO_RUBRICAS)) {
      const chaveNormalizada = chave
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9\s]/g, "") // remove símbolos também da chave
        .replace(/\s+/g, " ")
        .trim();

      // Verifica se a descrição normalizada contém a chave ou vice-versa
      if (
        normalizada.includes(chaveNormalizada) ||
        chaveNormalizada.includes(normalizada)
      ) {
        console.log(`  🔄 Mapeamento: "${descricao}" → "${valor}"`);
        return valor;
      }
    }

    // Se não encontrou mapeamento, retorna normalizada
    console.log(
      `  ℹ️  Sem mapeamento: "${descricao}" → usando "${normalizada}"`
    );
    return normalizada;
  }

  /**
   * Formata MÊS/ANO para o padrão "jan/20", "fev/20", etc.
   */
  private static formatarMesAno(mesAno: string): string {
    // Tentar capturar MM/YYYY
    const match = mesAno.match(/(\d{2})\/(\d{4})/);
    if (match) {
      const mes = parseInt(match[1]);
      const ano = match[2].substring(2); // pega apenas os 2 últimos dígitos

      const meses = [
        "jan",
        "fev",
        "mar",
        "abr",
        "mai",
        "jun",
        "jul",
        "ago",
        "set",
        "out",
        "nov",
        "dez",
      ];
      if (mes >= 1 && mes <= 12) {
        return `${meses[mes - 1]}/${ano}`;
      }
    }

    return mesAno;
  }

  /**
   * Extrai dados do PDF para rubricas
   * Agora com detecção muito mais robusta
   */
  static async extractRubricasFromPdf(
    filePath: string
  ): Promise<RubricaData[]> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text;

      console.log("📄 ==== TEXTO COMPLETO DO PDF ====");
      console.log(text);
      console.log("====================================\n");

      // Divide o texto em linhas
      const lines = text
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      const rubricas: RubricaData[] = [];
      let mesAnoAtual = "";

      // Padrões para detectar MÊS/ANO
      const mesAnoPatterns = [
        /(\d{2}\/\d{4})/g, // 01/2024
        /(\d{2}-\d{4})/g, // 01-2024
        /([A-Z]{3}\/\d{4})/gi, // JAN/2024
        /(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s*\/?\s*(\d{4})/gi,
      ];

      console.log("🔍 ==== INICIANDO EXTRAÇÃO ====\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Tenta detectar MÊS/ANO na linha atual
        for (const pattern of mesAnoPatterns) {
          const matches = line.match(pattern);
          if (matches) {
            mesAnoAtual = matches[0];
            console.log(`📅 Mês/Ano detectado: ${mesAnoAtual}`);
            break;
          }
        }

        // Se temos um mês/ano ativo, procurar por rubricas
        if (mesAnoAtual) {
          // PADRÃO: Detecta linhas com (VANTAGEM|DESCONTO) + código + descrição + valor
          // Ex: "0120221012022VANTAGEM1VENCIMENTO BASICO DO CARGO EFETIVOR: R$ 3341.86"
          let match = line.match(
            /(VANTAGEM|DESCONTO)\s*(\d+)\s*([A-Z\sÀ-ÿ]+?)\s*R?\$?\s*([\d.,]+)$/i
          );

          if (match) {
            const tipo = match[1]; // VANTAGEM ou DESCONTO
            const codigo = match[2]; // código da rubrica
            let descricao = match[3].trim();
            const valorOriginal = match[4]; // valor original capturado
            const valorStr = match[4].replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(valorStr);

            // Remove números, símbolos e palavras indesejadas do início da descrição
            descricao = descricao.replace(/^[\d\s:R$]+/, "").trim();
            descricao = descricao.replace(
              /^(NOME|MATRICULA|CPF|VINCULO)\s*/i,
              ""
            );

            // Ignora linhas de TOTAL (997, 998, 999) e linhas com informações pessoais
            const codigoNum = parseInt(codigo);
            const isTotalLine = codigoNum >= 997 && codigoNum <= 999;
            const isInfoLine =
              /^(NOME|MATRICULA|CPF|VINCULO|CLEBIANA|SANTANA|ALVES)/i.test(
                descricao
              );

            // Validar que temos uma descrição válida e um valor numérico positivo
            if (
              !isNaN(valor) &&
              valor > 0 &&
              descricao.length > 3 &&
              !isTotalLine &&
              !isInfoLine
            ) {
              console.log(
                `✅ ${tipo} ${codigo}: "${descricao}" = ${valorOriginal} (convertido: ${valor.toFixed(
                  2
                )}) [${mesAnoAtual}]`
              );

              // Tentar capturar um possível MÊS/ANO DIR na mesma linha (outra data diferente do mesAnoAtual)
              let mesAnoDir: string | undefined = undefined;
              try {
                const todasDatas = line.match(/(\d{2}[\/-]\d{4})/g);
                if (todasDatas && todasDatas.length >= 2) {
                  // pegue a primeira data diferente do mesAnoAtual como DIR
                  const normalizar = (s: string) => s.replace("-", "/");
                  const atualNorm = normalizar(mesAnoAtual);
                  const outra = todasDatas
                    .map(normalizar)
                    .find((d) => d !== atualNorm);
                  if (outra) mesAnoDir = outra;
                }
              } catch {}

              rubricas.push({
                mesAno: mesAnoAtual,
                mesAnoDir,
                descricaoRubrica: descricao.toUpperCase(),
                valor: tipo.toUpperCase() === "DESCONTO" ? -valor : valor,
              });
            }
          } else {
            // Fallback específico para linhas de IPE sem padrão VANTAGEM/DESCONTO
            // Exemplos: "INSTITUTO DE PREVIDENCIA ESTADUAL LC 308/05 - ADM 25/10/2005 R$ 380,66"
            if (/INSTITUTO DE PREVIDENCIA ESTADUAL/i.test(line)) {
              const valorMatch = line.match(/([\d.]+,\d{2})$/);
              if (valorMatch) {
                const valorOriginal = valorMatch[1];
                const valor = parseFloat(
                  valorOriginal.replace(/\./g, "").replace(",", ".")
                );
                if (!isNaN(valor) && valor > 0) {
                  let descricao = line
                    .replace(valorOriginal, "")
                    .replace(/R?\$?\s*$/i, "")
                    .trim()
                    .toUpperCase();

                  const normalizada = descricao
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                  console.log(
                    `✅ Fallback IPE: "${normalizada}" = ${valorOriginal} [${mesAnoAtual}]`
                  );
                  rubricas.push({
                    mesAno: mesAnoAtual,
                    mesAnoDir: undefined,
                    descricaoRubrica: normalizada,
                    valor: -valor, // IPE é sempre desconto
                  });
                }
              }
            }
          }
        }
      }

      console.log(`\n📊 Total de rubricas extraídas: ${rubricas.length}\n`);

      if (rubricas.length === 0) {
        console.warn(
          "⚠️  NENHUMA RUBRICA ENCONTRADA! Verifique o formato do PDF."
        );
      }

      return rubricas;
    } catch (error) {
      throw new Error(`Erro ao processar PDF: ${error}`);
    }
  }

  /**
   * Gera um Excel com os dados das rubricas consolidados por mês
   * Cada linha = um mês/ano formatado (jan/20, fev/20, etc.)
   * Colunas fixas baseadas no mapeamento de rubricas
   * Primeira linha de cada ano destacada em cinza
   */
  static async convertRubricasToExcel(
    data: RubricaData[],
    outputPath: string
  ): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Resumo por Mês");

      console.log("📊 ==== CONSOLIDANDO DADOS ====");

      // Agrupar por mês/ano (linha), e dentro por rubrica, e dentro por mesAnoDir (quando houver), somando valores
      type Agregado = {
        total: number;
        count: number;
        dir?: string;
        itens: number[];
      };
      const agrupado: Record<
        string,
        Record<string, Map<string, Agregado>>
      > = {};

      console.log(
        "\n📋 ==== MAPEANDO E AGRUPANDO RUBRICAS (por mês de referência) ====\n"
      );

      data.forEach((item) => {
        const mesPagamento = item.mesAno; // mês em que caiu
        const mesReferencia =
          item.mesAnoDir && item.mesAnoDir !== mesPagamento
            ? item.mesAnoDir
            : mesPagamento; // mês a que pertence
        const rubricaMapeada = this.mapearRubrica(item.descricaoRubrica);
        const valor = item.valor;

        // Dentro do mês de referência, agrupamos por rubrica e por mês de pagamento (pagoEm)
        const pagoKey =
          mesPagamento !== mesReferencia ? mesPagamento : "__ON_TIME__";

        if (!agrupado[mesReferencia]) agrupado[mesReferencia] = {};
        if (!agrupado[mesReferencia][rubricaMapeada])
          agrupado[mesReferencia][rubricaMapeada] = new Map();

        const mapa = agrupado[mesReferencia][rubricaMapeada];
        const existente = mapa.get(pagoKey);
        if (existente) {
          existente.total += valor;
          existente.count += 1;
          existente.itens.push(valor);
        } else {
          mapa.set(pagoKey, {
            total: valor,
            count: 1,
            dir: pagoKey === "__ON_TIME__" ? undefined : mesPagamento,
            itens: [valor],
          });
        }
      });

      // Converter para array e ordenar por ano/mês
      const mesesData: MesAnoData[] = [];
      Object.entries(agrupado).forEach(([mesRef, rubricas]) => {
        const match = mesRef.match(/(\d{2})\/(\d{4})/);
        if (match) {
          const mes = parseInt(match[1]);
          const ano = parseInt(match[2]);
          // Para compatibilidade com tipo MesAnoData (rubricas: Record<string, number>),
          // vamos apenas marcar presença das rubricas; o conteúdo real será renderizado via richText adiante
          const rubricasMarcadores: Record<string, number> = {};
          Object.keys(rubricas).forEach((r) => (rubricasMarcadores[r] = 1));

          mesesData.push({
            mesAno: this.formatarMesAno(mesRef),
            ano: ano,
            mes: mes,
            rubricas: rubricasMarcadores,
          });
        }
      });

      // Ordenar por ano e mês
      mesesData.sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      });

      // Descobrir todas as rubricas únicas que têm dados (colunas dinâmicas)
      const rubricasComDados = new Set<string>();
      mesesData.forEach((mesData) => {
        Object.keys(mesData.rubricas).forEach((rubrica) => {
          rubricasComDados.add(rubrica);
        });
      });

      // Ordenar rubricas por ordem de importância
      const ordemPreferencial = [
        "VENC. BASE",
        "ADTS",
        "FUNÇÃO GRATIFICADA",
        "INSALUBRIDADE",
        "GRATIF. JORNADA ESPECIAL",
        "ADD NOTURNO",
        "ADICIONAL DE FÉRIAS",
        "GRATIFICAÇÃO NATALINA",
        "ADIANTAMENTO GRATIFICAÇÃO NATALINA",
        "TOTAL VANTAGENS",
        "IPE",
        "IRRF",
        "IRRF 13º",
        "TOTAL DESCONTOS",
        "TOTAL LÍQUIDO",
      ];

      const rubricasOrdenadas = Array.from(rubricasComDados).sort((a, b) => {
        const indexA = ordemPreferencial.indexOf(a);
        const indexB = ordemPreferencial.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

  // Adiciona a coluna de desconto previdenciário
  const colunasExcel = ["MÊS / ANO", ...rubricasOrdenadas, "Desconto Previdência"];

      console.log(`\n📅 Meses encontrados: ${mesesData.length}`);
      console.log(`📋 Colunas com dados: ${rubricasOrdenadas.join(", ")}\n`);

      // Definir colunas dinamicamente
      worksheet.columns = colunasExcel.map((col: string) => ({
        header: col,
        key: col,
        width: col === "MÊS / ANO" ? 12 : Math.max(col.length + 2, 15),
      }));

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Preencher linhas (uma por mês)
      let anoAnterior = -1;

      // Função para buscar faixa de alíquota pelo valor e ano
      const tabelas = [
        {
          2025: [
            {
              "Alíquota 1": { De: null, Ate: 4679.67, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4679.68, Ate: 8157.41, percentual: 0.14, deduzir: 140.39 },
              "Alíquota 3": { De: 8157.42, Ate: 20055.73, percentual: 0.15, deduzir: 221.96 },
              "Alíquota 4": { De: 20055.74, Ate: 40111.45, percentual: 0.16, deduzir: 422.52 },
              "Alíquota 5": { De: 40111.46, Ate: null, percentual: 0.18, deduzir: 1224.75 },
            },
          ],
          2024: [
            {
              "Alíquota 1": { De: null, Ate: 4466.61, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4466.62, Ate: 7786.02, percentual: 0.14, deduzir: 134.00 },
              "Alíquota 3": { De: 7786.03, Ate: 19142.63, percentual: 0.15, deduzir:211.86 },
              "Alíquota 4": { De: 19142.64, Ate: 38285.24, percentual: 0.16, deduzir: 403.28 },
              "Alíquota 5": { De: 38285.25, Ate: null, percentual: 0.18, deduzir: 1168.99 },
            },
          ],
          2023: [
            {
              "Alíquota 1": { De: null, Ate: 4306.83, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4306.84, Ate: 7507.49, percentual: 0.14, deduzir: 129.20 },
              "Alíquota 3": { De: 7507.50, Ate: 18457.84, percentual: 0.15, deduzir: 204.28 },
              "Alíquota 4": { De: 18457.85, Ate: 36915.67, percentual: 0.16, deduzir: 388.86 },
              "Alíquota 5": { De: 36915.68, Ate: null, percentual: 0.18, deduzir: 1127.17 },
            },
          ],
           2022: [
            {
              "Alíquota 1": { De: null, Ate: 4065.73, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 4065.74, Ate: 7087.22, percentual: 0.14, deduzir: 121.97 },
              "Alíquota 3": { De: 7087.23, Ate: 17424.56, percentual: 0.15, deduzir: 192.84 },
              "Alíquota 4": { De: 17424.57, Ate: 34849.12, percentual: 0.16, deduzir: 367.09 },
              "Alíquota 5": { De: 34849.13, Ate: null, percentual: 0.18, deduzir: 1064.07 },
            },
          ],
           2021: [
            {
              "Alíquota 1": { De: null, Ate: 3690.75, percentual: 0.11, deduzir: null },
              "Alíquota 2": { De: 3690.76, Ate: 6433.57, percentual: 0.14, deduzir: 110.72 },
              "Alíquota 3": { De: 6433.58, Ate: 15817.50, percentual: 0.15, deduzir: 175.06 },
              "Alíquota 4": { De: 15817.51, Ate: 31635.00, percentual: 0.16, deduzir: 333.23 },
              "Alíquota 5": { De: 31635.01, Ate: null, percentual: 0.18, deduzir: 965.93 },
            },
          ],
        },
      ];
      function getAliquotaFaixa(valor: number, ano: string) {
        // Procura o objeto que tem a chave do ano desejado
  const anoNum = Number(ano);
  const tabelaAno = tabelas.find((t) => t[anoNum]);
  if (!tabelaAno) return null;
  const faixas = tabelaAno[anoNum][0];
        for (const key in faixas) {
          const faixa = faixas[key];
          if ((faixa.De === null || valor >= faixa.De) && (faixa.Ate === null || valor <= faixa.Ate)) {
            return faixa;
          }
        }
        return null;
      }

      mesesData.forEach((mesData) => {
        const row: Record<string, any> = { "MÊS / ANO": mesData.mesAno };
        // Inicializa vazio; depois aplicamos richText célula a célula
        rubricasOrdenadas.forEach((coluna: string) => {
          row[coluna] = "";
        });
        row["Desconto Previdência"] = "";

        const excelRow = worksheet.addRow(row);

        // Para cada rubrica, montar linhas agregadas por mesAnoDir (se houver) com quebras de linha
        rubricasOrdenadas.forEach((coluna: string, idx: number) => {
          const cell = excelRow.getCell(idx + 2); // +2 porque a coluna 1 é MÊS / ANO
          const mesOriginal = mesData.mesAno; // já está formatado (ex: jan/20)

          // Reconstruir a chave mesAno no formato MM/YYYY a partir do texto formatado
          // Para localizar no mapa 'agrupado'. Vamos manter um mapeamento auxiliar.
          // Em vez disso, percorrer todas as chaves e comparar pelo formatarMesAno
          const entradaDoMes = Object.entries(agrupado).find(
            ([k]) => this.formatarMesAno(k) === mesOriginal
          );
          if (!entradaDoMes) {
            cell.value = "";
            return;
          }
          const [, mapaRubricas] = entradaDoMes;
          const mapaDir = mapaRubricas[coluna];
          if (!mapaDir) {
            cell.value = "";
            return;
          }

          // Consolidar todos os pagos (incluindo atrasados) em um único total
          let totalGeral = 0;
          Array.from(mapaDir.values()).forEach((ag) => {
            totalGeral += ag.total;
          });
          const totalFmt = totalGeral.toFixed(2).replace('.', ',');
          cell.value = totalFmt;
          cell.alignment = { vertical: 'middle' };
        });

        // Calcular e preencher Desconto Previdência
        // Soma todas as vantagens do mês
        const entradaDoMes = Object.entries(agrupado).find(
          ([k]) => this.formatarMesAno(k) === mesData.mesAno
        );
        let totalVantagens = 0;
        if (entradaDoMes) {
          const [, mapaRubricas] = entradaDoMes;
          // Soma todas as vantagens exceto 'ADICIONAL DE FÉRIAS'
          Object.entries(mapaRubricas).forEach(([rubrica, mapaDir]) => {
            if ([
              "VENC. BASE",
              "ADTS",
              "FUNÇÃO GRATIFICADA",
              "INSALUBRIDADE",
              "GRATIF. JORNADA ESPECIAL",
              "ADD NOTURNO",
              "GRATIFICAÇÃO NATALINA",
              "ADIANTAMENTO GRATIFICAÇÃO NATALINA"
            ].includes(rubrica)) {
              Array.from(mapaDir.values()).forEach((ag) => {
                totalVantagens += ag.total;
              });
            }
          });
        }
        // Descobre o ano (ex: jan/2025 -> 2025)
        const anoMatch = mesData.mesAno.match(/\/(\d{2})$/);
        let ano = "2025";
        if (anoMatch) {
          ano = "20" + anoMatch[1];
        }
        const faixa = getAliquotaFaixa(totalVantagens, ano);
        let desconto = 0;
        if (faixa && typeof faixa.percentual === "number") {
          desconto = totalVantagens * faixa.percentual;
          if (faixa.deduzir) desconto -= faixa.deduzir;
        }
        const descontoFmt = desconto ? desconto.toFixed(2).replace('.', ',') : "";
        const cellDesc = excelRow.getCell(colunasExcel.length);
        cellDesc.value = descontoFmt;
        cellDesc.alignment = { vertical: 'middle' };

        // Destacar primeira linha de cada ano com fundo cinza
        if (mesData.ano !== anoAnterior) {
          excelRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD3D3D3" }, // Cinza claro
          };
          excelRow.font = { bold: true };
          anoAnterior = mesData.ano;
        }
      });

      // Adicionar bordas
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Congelar primeira linha e primeira coluna
      worksheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

      await workbook.xlsx.writeFile(outputPath);

      console.log(`✅ Excel gerado com sucesso em: ${outputPath}\n`);

      return outputPath;
    } catch (error) {
      throw new Error(`Erro ao criar Excel: ${error}`);
    }
  }

  /**
   * Gera o mesmo Excel, porém retorna um Buffer em memória (sem salvar em disco)
   */
  static async convertRubricasToExcelBuffer(
    data: RubricaData[]
  ): Promise<Buffer> {
    const tmpPath = "__memory__.xlsx";
    // Reutiliza a lógica existente escrevendo para stream em memória
    const workbook = new ExcelJS.Workbook();
    // Aproveitar código existente: para evitar duplicar, poderíamos refatorar; aqui copiamos a lógica essencial
    // Simplicidade: reaproveitar convertRubricasToExcel adaptando para buffer exigiria extrair função interna.
    // Para manter o patch pequeno, chamamos convertRubricasToExcel e depois lemos o arquivo – mas evitar IO real.
    // Melhor: duplicar parte mínima de geração (sem logs) focando em dados atuais.
    // TODO: Refatorar futuramente para DRY.
    await this.convertRubricasToExcel(data, tmpPath);
    const buffer = fs.readFileSync(tmpPath);
    fs.unlinkSync(tmpPath);
    return buffer;
  }

  static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Generates an Excel file from the provided rubricas data.
   * @param rubricas - Array of rubrica data to include in the Excel file.
   * @param outputPath - Path to save the generated Excel file.
   */
  static async generateExcel(rubricas: RubricaData[], outputPath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rubricas");

    // Add header row
    worksheet.columns = [
      { header: "Mês/Ano", key: "mesAno", width: 15 },
      { header: "Descrição", key: "descricaoRubrica", width: 30 },
      { header: "Valor", key: "valor", width: 15 },
    ];

    // Add data rows
    rubricas.forEach((rubrica) => {
      worksheet.addRow({
        mesAno: rubrica.mesAno,
        descricaoRubrica: rubrica.descricaoRubrica,
        valor: rubrica.valor,
      });
    });

    // Save the Excel file
    await workbook.xlsx.writeFile(outputPath);
  }

  /**
   * Extracts unique years from the PDF content.
   * @param filePath - Path to the PDF file.
   * @returns An array of unique years found in the PDF.
   */
  static async extractYearsFromPdf(filePath: string): Promise<number[]> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text;

      // Regular expression to match years (e.g., 2020, 2021, etc.)
      const yearRegex = /\b(19|20)\d{2}\b/g;
      const years = new Set<number>();

      let match;
      while ((match = yearRegex.exec(text)) !== null) {
        years.add(parseInt(match[0], 10));
      }

      return Array.from(years).sort((a, b) => a - b); // Return sorted years
    } catch (error) {
      console.error("Failed to extract years from PDF:", error);
      return [];
    }
  }
}
