import { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdfService';
import { UserService } from '../services/userService';
import { AdvantageService } from '../services/advantageService';
import { DataCacheService } from '../services/dataCacheService';
import path from 'path';
import fs from 'fs';

export class PdfController {
  private static sanitizeFileName(input?: string) {
    if (!input) return "";
    // remove accents, keep alphanumeric, dash, underscore and spaces; then replace spaces with underscore
    const normalized = input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\-_. ]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    // limit length
    return normalized.substring(0, 120);
  }
  // Normaliza representações de mês/ano para o formato MM/YYYY
  private static normalizeMonthYear(input: string): string {
    if (!input) return '';
    let t = input.toUpperCase().replace('-', '/').trim();
    // Já no formato 02/2024
    const m1 = t.match(/^(\d{2})\/(\d{4})$/);
    if (m1) return `${m1[1]}/${m1[2]}`;
    // Formato 2/2024 -> 02/2024
    const m1b = t.match(/^(\d{1})\/(\d{4})$/);
    if (m1b) return `${m1b[1].padStart(2, '0')}/${m1b[2]}`;
    // Formato JAN/2024
    const mesMap: Record<string, string> = {
      JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
      JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12'
    };
    const m2 = t.match(/^([A-Z]{3})\/(\d{4})$/);
    if (m2 && mesMap[m2[1]]) return `${mesMap[m2[1]]}/${m2[2]}`;
    // Formatos com ano de 2 dígitos -> assumir século 2000: 01/20, 1/20, JAN/20
    const m3 = t.match(/^(\d{2})\/(\d{2})$/); // 01/20
    if (m3) return `${m3[1]}/${`20${m3[2]}`}`;
    const m3b = t.match(/^(\d{1})\/(\d{2})$/); // 1/20
    if (m3b) return `${m3b[1].padStart(2, '0')}/${`20${m3b[2]}`}`;
    const m4 = t.match(/^([A-Z]{3})\/(\d{2})$/); // JAN/20
    if (m4 && mesMap[m4[1]]) return `${mesMap[m4[1]]}/${`20${m4[2]}`}`;
    // Último recurso: retorna como veio (mas com /)
    return t;
  }
  /**
   * Upload e processa um único PDF
   */
  static async uploadAndProcess(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado',
        });
      }

      const filePath = req.file.path;
      const userInfo = await PdfService.extractUserInfoFromPdf(filePath);
      const extractedData = await PdfService.extractRubricasFromPdf(filePath);

      const defaults = { name: 'NÃO INFORMADO', cpf: '', cargo: 'NÃO INFORMADO', matricula: 'NÃO INFORMADO' };
      const u = userInfo ? { ...defaults, ...userInfo } : defaults;
      const tipoServidor = req.body?.tipoServidor === 'aposentado' ? 'aposentado' : 'ativo';

      const advantages = extractedData
        .filter((r) => r.valor > 0)
        .map((r) => ({
          name: PdfService.mapearRubrica(r.descricaoRubrica),
          amount: r.valor,
          monthYear: PdfController.normalizeMonthYear(r.mesAno),
        }));

      const discounts = extractedData
        .filter((r) => r.valor < 0)
        .map((r) => ({
          name: PdfService.mapearRubrica(r.descricaoRubrica),
          amount: r.valor,
          monthYear: PdfController.normalizeMonthYear(r.mesAno),
        }));

      const responsePayload = {
        user: u,
        advantages,
        discounts,
      };

      // DEBUG: log extracted user info and payload to help diagnose missing names
      console.log('� extraction: userInfo from PDF ->', userInfo);
      console.log('� extraction: payload to cache ->', {
        user: u,
        advantagesCount: advantages.length,
        discountsCount: discounts.length,
      });

      // Cache the extracted data (store with top-level fields expected by DataCacheService)
      try {
        DataCacheService.setForCpf(u.cpf || DataCacheService.generateKey(), {
          cpf: u.cpf,
          name: u.name,
          cargo: u.cargo,
          matricula: u.matricula,
          tipoServidor,
          advantages,
          discounts,
        } as any);
      } catch (cacheErr) {
        console.error('Failed to cache extracted data:', cacheErr);
      }

      // Generate Excel buffer for this single-upload and return it as an attachment
      try {
        const buffer = await PdfService.convertRubricasToExcelBuffer(extractedData);
        // Use client's name as filename when available (sanitized), fallback to cpf or timestamp
        const baseName = PdfController.sanitizeFileName(u.name) || u.cpf || `extracted-${Date.now()}`;
        const fileName = `${baseName}.xlsx`;

        // Ensure excels directory exists and save file so later downloads by filename work
        try {
          const excelsDir = path.join(__dirname, '../../excels');
          if (!fs.existsSync(excelsDir)) fs.mkdirSync(excelsDir, { recursive: true });
          const outPath = path.join(excelsDir, fileName);
          fs.writeFileSync(outPath, buffer);
        } catch (saveErr) {
          console.error('Failed to save generated Excel to disk:', saveErr);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      } catch (excelErr) {
        console.error('Failed to generate Excel for upload:', excelErr);
        // Fallback: return the parsed payload as JSON so the client still receives extracted data
        return res.status(200).json({ success: true, data: responsePayload });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate and download Excel file on demand
   */
  static async generateExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { cpf } = req.params;
      if (!cpf) {
        return res.status(400).json({ success: false, message: 'CPF is required' });
      }

      const cachedData = await DataCacheService.getCachedData(cpf);
      if (!cachedData) {
        return res.status(404).json({ success: false, message: 'No cached data found for the given CPF' });
      }

      // Build rubricas array from cached advantages/discounts
      const rubricas: any[] = [];
      if (Array.isArray((cachedData as any).advantages)) {
        for (const a of (cachedData as any).advantages) {
          rubricas.push({ mesAno: a.monthYear || '', descricaoRubrica: a.name || '', valor: a.amount });
        }
      }
      if (Array.isArray((cachedData as any).discounts)) {
        for (const d of (cachedData as any).discounts) {
          rubricas.push({ mesAno: d.monthYear || '', descricaoRubrica: d.name || '', valor: d.amount });
        }
      }

  const excelBuffer = await PdfService.convertRubricasToExcelBuffer(rubricas as any[]);
  // Use cached name if available
  const cachedName = (cachedData as any).name;
  const baseName = PdfController.sanitizeFileName(cachedName) || cpf || `extracted-${Date.now()}`;
  const fileName = `${baseName}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(excelBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload e processa múltiplos PDFs
   */
  static async uploadAndProcessMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
      }

  const files = req.files as any[];
  const allData: any[] = [];
  const tipoServidor = (req.body as any)?.tipoServidor === 'aposentado' ? 'aposentado' : ((req.body as any)?.tipoServidor === 'ativo' ? 'ativo' : undefined);
  // Acúmulo por CPF dentro desta requisição
  const byCpf: Record<string, { name: string; cargo: string; matricula: string; advantages: any[]; discounts: any[] } > = {};

      // Processar cada PDF
      for (const file of files) {
        try {
          const userInfo = await PdfService.extractUserInfoFromPdf(file.path);
          const extractedData = await PdfService.extractRubricasFromPdf(file.path);
          allData.push(...extractedData); // Spread porque extractRubricasFromPdf retorna array
          // Cachear dados por usuário detectado neste PDF
          try {
            const defaults = { name: 'NÃO INFORMADO', cpf: '', cargo: 'NÃO INFORMADO', matricula: 'NÃO INFORMADO' };
            const u = userInfo ? { ...defaults, ...userInfo } : defaults;
            const keyCpf = u.cpf || DataCacheService.generateKey();
            if (!byCpf[keyCpf]) {
              byCpf[keyCpf] = { name: u.name, cargo: u.cargo, matricula: u.matricula, advantages: [], discounts: [] };
            }
            for (const r of extractedData) {
              const name = PdfService.mapearRubrica(r.descricaoRubrica);
              const refRaw = r.mesAnoDir && r.mesAnoDir !== r.mesAno ? r.mesAnoDir : r.mesAno;
              const monthYear = PdfController.normalizeMonthYear(refRaw.replace('-', '/'));
              const paidMonthYear = PdfController.normalizeMonthYear((r.mesAno || '').replace('-', '/'));
              if (r.valor > 0) byCpf[keyCpf].advantages.push({ name, amount: r.valor, monthYear, paidMonthYear });
              if (r.valor < 0) byCpf[keyCpf].discounts.push({ name, amount: r.valor, monthYear, paidMonthYear });
            }
          } catch {}
          // DESABILITADO: criação de usuário e vantagens no banco a partir de cada PDF
          // if (userInfo && userInfo.cpf) {
          //   const exists = await UserService.getUserByCpf(userInfo.cpf);
          //   if (!exists) {
          //     try {
          //       const created = await UserService.createUser(userInfo);
          //       const items = extractedData
          //         .filter(r => r.valor > 0)
          //         .map(r => {
          //           const refRaw = r.mesAnoDir && r.mesAnoDir !== r.mesAno ? r.mesAnoDir : r.mesAno;
          //           const monthYear = PdfController.normalizeMonthYear(refRaw.replace('-', '/'));
          //           return {
          //             name: PdfService.mapearRubrica(r.descricaoRubrica),
          //             amount: r.valor,
          //             monthYear,
          //           };
          //         });
          //       await AdvantageService.createMany(created.id, items);
          //     } catch {}
          //   }
          // }
          
          // Deletar o PDF original
          PdfService.deleteFile(file.path);
        } catch (error) {
          console.error(`Erro ao processar ${file.originalname}:`, error);
        }
      }

      if (allData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum PDF foi processado com sucesso'
        });
      }

      // No final, consolidar por CPF dentro desta requisição e sobrescrever o cache para refletir exatamente o Excel
      for (const [cpf, entry] of Object.entries(byCpf)) {
        // DEBUG: log what we'll cache per CPF
        console.log('� upload-multiple: preparing cache for CPF ->', cpf, {
          name: entry.name,
          advantages: entry.advantages.length,
          discounts: entry.discounts.length,
        });
        const aggregate = (arr: any[]) => {
          const map = new Map<string, number>();
          for (const it of arr) {
            const k = `${it.name}|${it.monthYear}`;
            map.set(k, (map.get(k) || 0) + it.amount);
          }
          return Array.from(map.entries()).map(([k, amount]) => {
            const [name, monthYear] = k.split('|');
            return { name, monthYear, amount };
          });
        };
        DataCacheService.setForCpf(cpf, {
          cpf,
          name: entry.name,
          cargo: entry.cargo,
          matricula: entry.matricula,
          tipoServidor,
          advantages: aggregate(entry.advantages),
          discounts: aggregate(entry.discounts),
        } as any);
      }

      const buffer = await PdfService.convertRubricasToExcelBuffer(allData);
      const excelFileName = `extracted-${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Lista usuários no cache (resumo)
  static async listCachedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = DataCacheService.listSummaries();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  // Obtem dados completos por CPF
  static async getCachedUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { cpf } = req.params as { cpf: string };
      const it = DataCacheService.getByCpf(cpf);
      if (!it) return res.status(404).json({ success: false, message: 'Cache expirado ou CPF não encontrado' });
      res.json({ success: true, data: it });
    } catch (error) { next(error); }
  }

  // Remove um CPF do cache
  static async deleteCachedUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { cpf } = req.params as { cpf: string };
      DataCacheService.deleteByCpf(cpf);
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  /**
   * Download do arquivo Excel gerado
   */
  static async downloadExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(__dirname, '../../excels', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado'
        });
      }

      res.download(filePath, fileName, (err: any) => {
        if (err) {
          next(err);
        } else {
          // Não deletar mais automaticamente para permitir visualização
          // O usuário pode abrir o arquivo Excel diretamente da pasta "excels"
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista arquivos disponíveis para download
   */
  static async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const excelsDir = path.join(__dirname, '../../excels');
      
      if (!fs.existsSync(excelsDir)) {
        return res.json({
          success: true,
          data: []
        });
      }

      const files = fs.readdirSync(excelsDir)
        .filter(file => file.endsWith('.xlsx'))
        .map(file => ({
          name: file,
          downloadUrl: `/api/pdf/download/${file}`,
          fullPath: path.join(excelsDir, file),
          createdAt: fs.statSync(path.join(excelsDir, file)).mtime
        }));

      res.json({
        success: true,
        data: files,
        message: `Os arquivos Excel estão salvos em: ${excelsDir}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract and return unique years from a PDF file.
   */
  static async extractYears(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado',
        });
      }

      const filePath = req.file.path;
      const years = await PdfService.extractYearsFromPdf(filePath);

      res.status(200).json({ success: true, data: years });
    } catch (error) {
      next(error);
    }
  }
}
