// Importação dos módulos e bibliotecas necessárias para o funcionamento do componente
import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Interface para os dados de uma NFe (Nota Fiscal Eletrônica)
interface NFeData {
  numero: string;
  cnpjEmitente: string;
  nomeEmitente: string;
  dataEmissao: string;
  cnpjDestinatario: string;
  nomeDestinatario: string;
  produto: string;
  ncm: string;
  cfop: string;
  cst: string;
  quantidade: string;
  valorUnitario: string;
  pis: string;
  cofins: string;
  icms: string;
  cstPis: string;
  cstCofins: string;
  tipoDocumento: 'NFe' | 'NFCe' | 'NFSe';
}

// Interface para os dados de uma NFCe (Nota Fiscal de Consumidor Eletrônica)
interface NFCeData {
  numero: string;
  cnpjEmitente: string;
  nomeEmitente: string;
  dataEmissao: string;
  cnpjDestinatario: string;
  nomeDestinatario: string;
  produto: string;
  ncm: string;
  cfop: string;
  cst: string;
  quantidade: string;
  valorUnitario: string;
  pis: string;
  cofins: string;
  icms: string;
  cstPis: string;
  cstCofins: string;
  tipoDocumento: 'NFe' | 'NFCe' | 'NFSe';
}

// Interface para os dados de uma NFSe (Nota Fiscal de Serviço Eletrônica)
interface NFSeData {
  numero: string;
  cnpjEmitente: string;
  nomeEmitente: string;
  dataEmissao: string;
  cnpjDestinatario: string;
  nomeDestinatario: string;
  produto: string;
  ncm: string;
  cfop: string;
  cst: string;
  quantidade: string;
  valorUnitario: string;
  pis: string;
  cofins: string;
  icms: string;
  cstPis: string;
  cstCofins: string;
  tipoDocumento: 'NFe' | 'NFCe' | 'NFSe';
  valorServico: string;
  valorIss: string;
}

// Tipo unificado para facilitar o processamento de qualquer documento
// Pode ser NFe, NFCe ou NFSe
// Permite trabalhar com listas de documentos de tipos diferentes
//
type DocumentData = NFeData | NFCeData | NFSeData;

// Interface para o resumo por NCM (código de produto)
interface NCMResume {
  ncm: string;
  totalQuantidade: number;
  totalValor: number;
  totalPis: number;      // Soma do PIS
  totalCofins: number;   // Soma do COFINS
  totalIcms: number;     // Soma do ICMS
  pisPercentage: string; // Percentual de PIS sobre o total
  cofinsPercentage: string; // Percentual de COFINS sobre o total
  icmsPercentage: string;  // Percentual de ICMS sobre o total
}

// Interface para o resumo mensal de faturamento
interface MonthlyRevenue {
  monthYear: string; // Ex: 2024-06
  totalRevenue: number;
  totalIcms: number;
  totalPis: number;
  totalCofins: number;
}

// Componente principal do leitor de XML
const LeitorXML: React.FC = () => {
  // Estado para armazenar os arquivos carregados pelo usuário
  const [files, setFiles] = useState<File[]>([]);
  // Estado para armazenar a lista de documentos processados
  const [documentList, setDocumentList] = useState<DocumentData[]>([]);
  // Estado para armazenar o nome da empresa analisada
  const [nomeEmpresaAnalise, setNomeEmpresaAnalise] = useState<string>('');
  // Estado para armazenar o CNPJ da empresa analisada
  const [cnpjEmpresaAnalise, setCnpjEmpresaAnalise] = useState<string>('');
  // Estado para armazenar o resumo por NCM
  const [ncmResumeList, setNcmResumeList] = useState<NCMResume[]>([]);
  // Estado para armazenar os NCMs disponíveis para filtro
  const [availableNcms, setAvailableNcms] = useState<string[]>([]);
  // Estado para armazenar o NCM selecionado no filtro
  const [selectedNcm, setSelectedNcm] = useState<string>(''); 
  // Estado para armazenar o resumo mensal de faturamento
  const [monthlyRevenueList, setMonthlyRevenueList] = useState<MonthlyRevenue[]>([]);
  // Estado para armazenar o mês/ano selecionado no filtro
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(''); 
  // Estado para armazenar os meses/anos disponíveis para filtro
  const [availableMonthYears, setAvailableMonthYears] = useState<string[]>([]);
  // Estado para indicar se está processando arquivos
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Estado para armazenar notas fiscais puladas (avisos)
  const [skippedNotes, setSkippedNotes] = useState<{ cnpj: string; serie: string; skipped: string[] }[]>([]); // NOVO ESTADO






  // Função chamada ao selecionar arquivos pelo input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };





  // Função para permitir arrastar arquivos para a área de upload
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Função chamada ao sair da área de drag-and-drop
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Função chamada ao soltar arquivos na área de drag-and-drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.xml') || 
      file.name.toLowerCase().endsWith('.zip')
    );
    
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  // Função para remover um arquivo da lista
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Função para limpar todos os arquivos selecionados
  const clearAllFiles = () => {
    setFiles([]);
    setDocumentList([]);
    setNomeEmpresaAnalise('');
    setCnpjEmpresaAnalise('');
    setNcmResumeList([]);
    setAvailableNcms([]);
    setSelectedNcm('');
    setMonthlyRevenueList([]);
    setAvailableMonthYears([]);
    setSelectedMonthYear('');
    setSkippedNotes([]);
  };





  // Função utilitária para formatar números no padrão brasileiro
  const formatNumber = (value: string | number): string => {
    const num = parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Função utilitária para converter string para número
  const parseNumber = (value: string | null): number => {
    if (!value) return 0;
    const cleanedValue = value.replace(',', '.');
    const num = parseFloat(cleanedValue);
    return isNaN(num) ? 0 : num;
  };

  // Função para detectar o tipo de documento fiscal no XML
  // Retorna 'NFe', 'NFCe' ou 'NFSe' conforme o conteúdo do XML
  const detectDocumentType = (xmlDoc: Document): 'NFe' | 'NFCe' | 'NFSe' => {
    // Verifica se é NFe
    if (xmlDoc.querySelector('NFe')) {
      return 'NFe';
    }
    // Verifica se é NFCe
    if (xmlDoc.querySelector('NFCe')) {
      return 'NFCe';
    }
    // Verifica se é NFSe (ampliado para mais padrões)
    if (
      xmlDoc.querySelector('NFSe') ||
      xmlDoc.querySelector('Nfse') ||
      xmlDoc.querySelector('CompNfse') ||
      xmlDoc.querySelector('Rps') ||
      xmlDoc.querySelector('GerarNfseResposta') ||
      xmlDoc.querySelector('ConsultarNfseResposta') ||
      xmlDoc.querySelector('xmlNfpse') // <- Adicionado para seu padrão
    ) {
      return 'NFSe';
    }
    // Padrão é NFe
    return 'NFe';
  };

  // Função para processar NFe (Nota Fiscal Eletrônica)
  // Extrai todos os dados relevantes do XML e retorna uma lista de produtos/documentos
  const processNFe = (xmlDoc: Document): DocumentData[] => {
    const numero = xmlDoc.querySelector('nNF')?.textContent || '';
    const cnpjEmitente = xmlDoc.querySelector('emit > CNPJ')?.textContent || '';
    const nomeEmitente = xmlDoc.querySelector('emit > xNome')?.textContent || '';
    const dataEmissaoRaw = xmlDoc.querySelector('dhEmi')?.textContent || ''; 
    const cnpjDestinatario = xmlDoc.querySelector('dest > CNPJ')?.textContent || '';
    const nomeDestinatario = xmlDoc.querySelector('dest > xNome')?.textContent || '';
    const serie = xmlDoc.querySelector('serie')?.textContent || '1';

    const dets = xmlDoc.getElementsByTagName('det');
    const produtos: DocumentData[] = [];

    for (let i = 0; i < dets.length; i++) {
      const prod = dets[i].getElementsByTagName('prod')[0];
      const imposto = dets[i].getElementsByTagName('imposto')[0];
      
      const produto = prod?.getElementsByTagName('xProd')[0]?.textContent || '';
      const ncm = prod?.getElementsByTagName('NCM')[0]?.textContent || '';
      const cfop = prod?.getElementsByTagName('CFOP')[0]?.textContent || '';
      
      const quantidadeRaw = prod?.getElementsByTagName('qCom')[0]?.textContent || '0';
      const valorUnitarioRaw = prod?.getElementsByTagName('vUnCom')[0]?.textContent || '0';
      
      const quantidade = formatNumber(quantidadeRaw);
      const valorUnitario = formatNumber(valorUnitarioRaw);

      let cst = '';
      let icms = '';
      const icmsTag = imposto?.getElementsByTagName('ICMS')[0];
      if (icmsTag) {
        const icmsChild = icmsTag.children[0];
        cst = icmsChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vIcmsRaw = icmsChild?.getElementsByTagName('vICMS')[0]?.textContent || '0';
        icms = formatNumber(vIcmsRaw);
      }
      
      let pis = '';
      let cstPis = '';
      const pisTag = imposto?.getElementsByTagName('PIS')[0];
      if (pisTag) {
        const pisChild = pisTag.children[0];
        cstPis = pisChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vPisRaw = pisChild?.getElementsByTagName('vPIS')[0]?.textContent || '0';
        pis = formatNumber(vPisRaw);
      }
      
      let cofins = '';
      let cstCofins = '';
      const cofinsTag = imposto?.getElementsByTagName('COFINS')[0];
      if (cofinsTag) {
        const cofinsChild = cofinsTag.children[0];
        cstCofins = cofinsChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vCofinsRaw = cofinsChild?.getElementsByTagName('vCOFINS')[0]?.textContent || '0';
        cofins = formatNumber(vCofinsRaw);
      }
      
      produtos.push({
        numero,
        cnpjEmitente,
        nomeEmitente,
        dataEmissao: dataEmissaoRaw, 
        cnpjDestinatario,
        nomeDestinatario,
        produto,
        ncm,
        cfop,
        cst,
        quantidade,
        valorUnitario,
        pis,
        cofins,
        icms,
        cstPis,
        cstCofins,
        tipoDocumento: 'NFe'
      });
    }

    return produtos;
  };

  // Função para processar NFCe (Nota Fiscal de Consumidor Eletrônica)
  // Extrai todos os dados relevantes do XML e retorna uma lista de produtos/documentos
  const processNFCe = (xmlDoc: Document): DocumentData[] => {
    const numero = xmlDoc.querySelector('nNF')?.textContent || '';
    const cnpjEmitente = xmlDoc.querySelector('emit > CNPJ')?.textContent || '';
    const nomeEmitente = xmlDoc.querySelector('emit > xNome')?.textContent || '';
    const dataEmissaoRaw = xmlDoc.querySelector('dhEmi')?.textContent || ''; 
    const cnpjDestinatario = xmlDoc.querySelector('dest > CNPJ')?.textContent || '';
    const nomeDestinatario = xmlDoc.querySelector('dest > xNome')?.textContent || '';
    const serie = xmlDoc.querySelector('serie')?.textContent || '1';

    const dets = xmlDoc.getElementsByTagName('det');
    const produtos: DocumentData[] = [];

    for (let i = 0; i < dets.length; i++) {
      const prod = dets[i].getElementsByTagName('prod')[0];
      const imposto = dets[i].getElementsByTagName('imposto')[0];
      
      const produto = prod?.getElementsByTagName('xProd')[0]?.textContent || '';
      const ncm = prod?.getElementsByTagName('NCM')[0]?.textContent || '';
      const cfop = prod?.getElementsByTagName('CFOP')[0]?.textContent || '';
      
      const quantidadeRaw = prod?.getElementsByTagName('qCom')[0]?.textContent || '0';
      const valorUnitarioRaw = prod?.getElementsByTagName('vUnCom')[0]?.textContent || '0';
      
      const quantidade = formatNumber(quantidadeRaw);
      const valorUnitario = formatNumber(valorUnitarioRaw);

      let cst = '';
      let icms = '';
      const icmsTag = imposto?.getElementsByTagName('ICMS')[0];
      if (icmsTag) {
        const icmsChild = icmsTag.children[0];
        cst = icmsChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vIcmsRaw = icmsChild?.getElementsByTagName('vICMS')[0]?.textContent || '0';
        icms = formatNumber(vIcmsRaw);
      }
      
      let pis = '';
      let cstPis = '';
      const pisTag = imposto?.getElementsByTagName('PIS')[0];
      if (pisTag) {
        const pisChild = pisTag.children[0];
        cstPis = pisChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vPisRaw = pisChild?.getElementsByTagName('vPIS')[0]?.textContent || '0';
        pis = formatNumber(vPisRaw);
      }
      
      let cofins = '';
      let cstCofins = '';
      const cofinsTag = imposto?.getElementsByTagName('COFINS')[0];
      if (cofinsTag) {
        const cofinsChild = cofinsTag.children[0];
        cstCofins = cofinsChild?.getElementsByTagName('CST')[0]?.textContent || '';
        const vCofinsRaw = cofinsChild?.getElementsByTagName('vCOFINS')[0]?.textContent || '0';
        cofins = formatNumber(vCofinsRaw);
      }
      
      produtos.push({
        numero,
        cnpjEmitente,
        nomeEmitente,
        dataEmissao: dataEmissaoRaw, 
        cnpjDestinatario,
        nomeDestinatario,
        produto,
        ncm,
        cfop,
        cst,
        quantidade,
        valorUnitario,
        pis,
        cofins,
        icms,
        cstPis,
        cstCofins,
        tipoDocumento: 'NFCe'
      });
    }

    return produtos;
  };

  // Função para processar NFSe (Nota Fiscal de Serviço Eletrônica)
  // Adaptada para o padrão do XML fornecido
  const processNFSe = (xmlDoc: Document): DocumentData[] => {
    const numero = xmlDoc.querySelector('numeroAEDF')?.textContent || xmlDoc.querySelector('Numero')?.textContent || xmlDoc.querySelector('nNF')?.textContent || '';
    const cnpjEmitente = xmlDoc.querySelector('cnpjPrestador')?.textContent || xmlDoc.querySelector('PrestadorServico > IdentificacaoPrestador > Cnpj')?.textContent || xmlDoc.querySelector('Prestador > Cnpj')?.textContent || xmlDoc.querySelector('emit > CNPJ')?.textContent || '';
    const nomeEmitente = xmlDoc.querySelector('razaoSocialPrestador')?.textContent || xmlDoc.querySelector('PrestadorServico > RazaoSocial')?.textContent || xmlDoc.querySelector('Prestador > RazaoSocial')?.textContent || xmlDoc.querySelector('emit > xNome')?.textContent || '';
    const dataEmissaoRaw = xmlDoc.querySelector('dataEmissao')?.textContent || xmlDoc.querySelector('DataEmissao')?.textContent || xmlDoc.querySelector('dhEmi')?.textContent || '';
    const cnpjDestinatario = xmlDoc.querySelector('identificacaoTomador')?.textContent || xmlDoc.querySelector('TomadorServico > IdentificacaoTomador > Cnpj')?.textContent || xmlDoc.querySelector('Tomador > Cnpj')?.textContent || xmlDoc.querySelector('dest > CNPJ')?.textContent || '';
    const nomeDestinatario = xmlDoc.querySelector('razaoSocialTomador')?.textContent || xmlDoc.querySelector('TomadorServico > RazaoSocial')?.textContent || xmlDoc.querySelector('Tomador > RazaoSocial')?.textContent || xmlDoc.querySelector('dest > xNome')?.textContent || '';
    const valorServico = xmlDoc.querySelector('valorTotalServicos')?.textContent || xmlDoc.querySelector('ValorServicos')?.textContent || '0';
    const valorIss = xmlDoc.querySelector('valorISSQN')?.textContent || xmlDoc.querySelector('ValorIss')?.textContent || '0';
    const cfop = xmlDoc.querySelector('cfps')?.textContent || xmlDoc.querySelector('Cfop')?.textContent || '';

    // Itens de serviço para o padrão do seu XML
    const itensServico = xmlDoc.querySelectorAll('itensServico > itemServico, ItensServico > ItemServico, Servico > ItemServico');
    const produtos: DocumentData[] = [];

    if (itensServico.length > 0) {
      for (let i = 0; i < itensServico.length; i++) {
        const item = itensServico[i];
        const produto = item.querySelector('descricaoServico')?.textContent || item.querySelector('Descricao')?.textContent || '';
        const ncm = item.querySelector('codigoCNAE')?.textContent || item.querySelector('CodigoServico')?.textContent || '';
        const quantidadeRaw = item.querySelector('quantidade')?.textContent || item.querySelector('Quantidade')?.textContent || '1';
        const valorUnitarioRaw = item.querySelector('valorUnitario')?.textContent || item.querySelector('ValorUnitario')?.textContent || valorServico;

        const quantidade = formatNumber(quantidadeRaw);
        const valorUnitario = formatNumber(valorUnitarioRaw);

        produtos.push({
          numero,
          cnpjEmitente,
          nomeEmitente,
          dataEmissao: dataEmissaoRaw,
          cnpjDestinatario,
          nomeDestinatario,
          produto,
          ncm,
          cfop,
          cst: '',
          quantidade,
          valorUnitario,
          pis: '',
          cofins: '',
          icms: '0,00',
          cstPis: '',
          cstCofins: '',
          tipoDocumento: 'NFSe',
          valorServico: formatNumber(valorServico),
          valorIss: formatNumber(valorIss)
        });
      }
    } else {
      // Caso não haja itens de serviço, cria um produto único
      produtos.push({
        numero,
        cnpjEmitente,
        nomeEmitente,
        dataEmissao: dataEmissaoRaw,
        cnpjDestinatario,
        nomeDestinatario,
        produto: 'Serviço',
        ncm: '',
        cfop,
        cst: '',
        quantidade: '1',
        valorUnitario: formatNumber(valorServico),
        pis: '',
        cofins: '',
        icms: '0,00',
        cstPis: '',
        cstCofins: '',
        tipoDocumento: 'NFSe',
        valorServico: formatNumber(valorServico),
        valorIss: formatNumber(valorIss)
      });
    }

    return produtos;
  };

  // Função principal para processar todos os arquivos carregados
  // Lê arquivos XML e ZIP, extrai documentos, calcula totais, resumos e detecta pulos de notas
  const handleProcessFiles = async () => {
    setIsLoading(true);
    setSkippedNotes([]); // Limpa avisos anteriores ao iniciar novo processamento

    let xmlFiles: File[] = [];

    // Função recursiva para extrair arquivos de ZIPs aninhados
    const processZip = async (zipFile: Blob): Promise<File[]> => {
        const extractedFiles: File[] = [];
        const zip = await JSZip.loadAsync(zipFile);

        for (const entry of Object.values(zip.files)) {
            if (entry.dir) continue;

            const fileName = entry.name.toLowerCase();
            if (fileName.endsWith('.xml')) {
                const content = await entry.async('blob');
                extractedFiles.push(new File([content], entry.name, { type: 'text/xml' }));
            } else if (fileName.endsWith('.zip')) {
                const nestedZipContent = await entry.async('blob');
                const nestedFiles = await processZip(nestedZipContent);
                extractedFiles.push(...nestedFiles);
            }
        }
        return extractedFiles;
    };

    // Percorre todos os arquivos carregados
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const extracted = await processZip(file);
        xmlFiles.push(...extracted);
      } else if (file.name.toLowerCase().endsWith('.xml')) {
        xmlFiles.push(file);
      }
    }
    
    if (xmlFiles.length === 0) {
      alert('Nenhum arquivo XML encontrado para processar.');
      setIsLoading(false);
      return;
    }

    // Listas e mapas auxiliares para resumos e agrupamentos
    const processedDocumentData: DocumentData[] = [];
    const resumeMap: { [ncm: string]: { totalQuantidade: number; totalValor: number; totalPis: number; totalCofins: number; totalIcms: number; } } = {};
    const uniqueNcms = new Set<string>();
    let firstFileProcessed = false; 

    const monthlyRevenueMap: { [monthYear: string]: { totalRevenue: number, totalIcms: number, totalPis: number, totalCofins: number } } = {};
    const uniqueMonthYears = new Set<string>();

    // Mapa para armazenar números de notas por CNPJ do emitente e série (para detectar pulos)
    const noteNumbersMap: { [cnpjSerie: string]: number[] } = {};

    try {
      // Processa cada arquivo XML individualmente
      for (let i = 0; i < xmlFiles.length; i++) {
        const file = xmlFiles[i];
        
        // Lê o conteúdo do arquivo XML
        const promise = new Promise<DocumentData[]>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(text, 'text/xml');
              
              // Detecta o tipo de documento (NFe, NFCe, NFSe)
              const documentType = detectDocumentType(xmlDoc);
              
              let produtos: DocumentData[] = [];
              let totalDocumentValue = 0; 
              let totalDocumentPis = 0;    
              let totalDocumentCofins = 0; 
              let totalDocumentIcms = 0;   
              let monthYear = '';
              let dataEmissaoRaw = '';
              let cnpjEmitente = '';
              let nomeEmitente = '';
              let serie = '1';

              // Processa baseado no tipo de documento
              switch (documentType) {
                case 'NFe':
                  produtos = processNFe(xmlDoc);
                  break;
                case 'NFCe':
                  produtos = processNFCe(xmlDoc);
                  break;
                case 'NFSe':
                  produtos = processNFSe(xmlDoc);
                  break;
              }

              if (produtos.length > 0) {
                // Extrai informações comuns para processamento
                const firstProduct = produtos[0];
                dataEmissaoRaw = firstProduct.dataEmissao;
                cnpjEmitente = firstProduct.cnpjEmitente;
                nomeEmitente = firstProduct.nomeEmitente;
                serie = '1'; // Série padrão

                if (!firstFileProcessed) {
                  setNomeEmpresaAnalise(nomeEmitente);
                  setCnpjEmpresaAnalise(cnpjEmitente);
                  firstFileProcessed = true;
                }

                // Adiciona o número da nota ao mapa para verificação de pulo
                if (firstProduct.numero && cnpjEmitente && serie) {
                  const key = `${cnpjEmitente}-${serie}`;
                  if (!noteNumbersMap[key]) {
                    noteNumbersMap[key] = [];
                  }
                  noteNumbersMap[key].push(parseInt(firstProduct.numero, 10));
                }

                // Calcula totais e processa dados de cada produto/documento
                for (const produto of produtos) {
                  const quantidadeNum = parseNumber(produto.quantidade);
                  const valorUnitarioNum = parseNumber(produto.valorUnitario);
                  const valorTotalItem = quantidadeNum * valorUnitarioNum;
                  const pisNum = parseNumber(produto.pis);
                  const cofinsNum = parseNumber(produto.cofins);
                  const icmsNum = parseNumber(produto.icms);

                  totalDocumentValue += valorTotalItem;
                  totalDocumentPis += pisNum;
                  totalDocumentCofins += cofinsNum;
                  totalDocumentIcms += icmsNum;

                  if (produto.ncm) {
                    uniqueNcms.add(produto.ncm);
                    if (!resumeMap[produto.ncm]) {
                      resumeMap[produto.ncm] = { totalQuantidade: 0, totalValor: 0, totalPis: 0, totalCofins: 0, totalIcms: 0 };
                    }
                    resumeMap[produto.ncm].totalQuantidade += quantidadeNum;
                    resumeMap[produto.ncm].totalValor += valorTotalItem;
                    resumeMap[produto.ncm].totalPis += pisNum;
                    resumeMap[produto.ncm].totalCofins += cofinsNum;
                    resumeMap[produto.ncm].totalIcms += icmsNum;
                  }
                }

                // Processa data para agrupamento mensal
                if (dataEmissaoRaw) {
                  try {
                    const datePart = dataEmissaoRaw.split('T')[0];
                    const [year, month] = datePart.split('-');
                    monthYear = `${year}-${month}`;
                    uniqueMonthYears.add(monthYear); 
                  } catch (e) {
                    console.error("Erro ao formatar data de emissão:", dataEmissaoRaw, e);
                  }
                }

                if (monthYear) {
                  if (!monthlyRevenueMap[monthYear]) {
                    monthlyRevenueMap[monthYear] = { totalRevenue: 0, totalIcms: 0, totalPis: 0, totalCofins: 0 };
                  }
                  monthlyRevenueMap[monthYear].totalRevenue += totalDocumentValue;
                  monthlyRevenueMap[monthYear].totalPis += totalDocumentPis;
                  monthlyRevenueMap[monthYear].totalCofins += totalDocumentCofins;
                  monthlyRevenueMap[monthYear].totalIcms += totalDocumentIcms;
                }
              }

              resolve(produtos);
            } catch (error) {
              console.error("Erro ao processar arquivo:", error);
              resolve([]);
            }
          };
          reader.readAsText(file);
        });
        const result = await promise;
        processedDocumentData.push(...result);
      }
      setDocumentList(processedDocumentData);

      // Gera o resumo por NCM (agregando valores, impostos e percentuais)
      const sortedNCMResume = Object.keys(resumeMap).map(ncmKey => {
        const data = resumeMap[ncmKey];
        const totalRevenueForNCM = data.totalValor; 
        
        const pisPercentage = totalRevenueForNCM > 0 ? ((data.totalPis / totalRevenueForNCM) * 100).toFixed(2) : '0.00';
        const cofinsPercentage = totalRevenueForNCM > 0 ? ((data.totalCofins / totalRevenueForNCM) * 100).toFixed(2) : '0.00';
        const icmsPercentage = totalRevenueForNCM > 0 ? ((data.totalIcms / totalRevenueForNCM) * 100).toFixed(2) : '0.00'; 

        return {
            ncm: ncmKey,
            totalQuantidade: data.totalQuantidade,
            totalValor: data.totalValor,
            totalPis: data.totalPis,
            totalCofins: data.totalCofins,
            totalIcms: data.totalIcms,
            pisPercentage,
            cofinsPercentage,
            icmsPercentage,
        };
      }).sort((a, b) => a.ncm.localeCompare(b.ncm));
      setNcmResumeList(sortedNCMResume);

      // Atualiza filtros de NCM disponíveis
      const sortedUniqueNcms = Array.from(uniqueNcms).sort();
      setAvailableNcms(sortedUniqueNcms);
      setSelectedNcm(''); 

      // Gera o resumo mensal de faturamento
      const sortedMonthlyRevenue = Object.keys(monthlyRevenueMap)
        .map(monthYear => ({
          monthYear,
          totalRevenue: monthlyRevenueMap[monthYear].totalRevenue,
          totalIcms: monthlyRevenueMap[monthYear].totalIcms,
          totalPis: monthlyRevenueMap[monthYear].totalPis,
          totalCofins: monthlyRevenueMap[monthYear].totalCofins,
        }))
        .sort((a, b) => a.monthYear.localeCompare(b.monthYear)); 
      setMonthlyRevenueList(sortedMonthlyRevenue);

      // Atualiza filtros de mês/ano disponíveis
      const sortedUniqueMonthYears = Array.from(uniqueMonthYears).sort();
      setAvailableMonthYears(sortedUniqueMonthYears);
      setSelectedMonthYear(''); 

      // --- Lógica para detectar pulos de notas fiscais ---
      const detectedSkippedNotes: { cnpj: string; serie: string; skipped: string[] }[] = [];

      for (const key in noteNumbersMap) {
          if (noteNumbersMap.hasOwnProperty(key)) {
              const [cnpj, serie] = key.split('-');
              const numbers = noteNumbersMap[key].sort((a, b) => a - b); // Ordenar os números
              
              const currentSkipped: string[] = [];
              for (let i = 0; i < numbers.length - 1; i++) {
                  const current = numbers[i];
                  const next = numbers[i + 1];

                  if (next - current > 1) {
                      // Pulo detectado
                      for (let j = current + 1; j < next; j++) {
                          currentSkipped.push(j.toString());
                      }
                  }
              }
              if (currentSkipped.length > 0) {
                  detectedSkippedNotes.push({
                      cnpj: cnpj,
                      serie: serie,
                      skipped: currentSkipped,
                  });
              }
          }
      }
      setSkippedNotes(detectedSkippedNotes);
      // --- Fim da lógica de pulo de notas ---


    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (documentList.length === 0) return;
    
    let nomeRelatorio = nomeEmpresaAnalise || documentList[0]?.nomeEmitente || 'emitente';
    nomeRelatorio = nomeRelatorio
      .normalize('NFD')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
      
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataHora = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}`;
    const fileName = `relatorio_documentos_${nomeRelatorio}_${dataHora}.xlsx`;
    
    const headers = Object.keys(documentList[0]);
    const dataRows = documentList.map((obj: DocumentData) => 
        headers.map(h => {
            const value = obj[h as keyof DocumentData];
            if (['quantidade', 'valorUnitario', 'pis', 'cofins', 'icms'].includes(h)) {
                return parseFloat(String(value).replace(/\./g, '').replace(',', '.'));
            }
            return value;
        })
    );
    
    const aoa = [headers, ...dataRows, [], ["feito por Davi Alves"]];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    
    const colCount = headers.length;
    worksheet['!merges'] = worksheet['!merges'] || [];
    worksheet['!merges'].push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
    
    const assinaturaCell = worksheet[XLSX.utils.encode_cell({ r: aoa.length - 1, c: 0 })];
    if (assinaturaCell) {
      assinaturaCell.s = { font: { bold: true } };
    }
    
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NFe');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  const handleNcmFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNcm(event.target.value);
  };

  const handleMonthYearFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonthYear(event.target.value);
  };

  const filteredNcmResumeList = useMemo(() => {
    if (!selectedNcm || availableNcms.length === 0) {
      return ncmResumeList;
    }
    return ncmResumeList.filter(item => item.ncm === selectedNcm);
  }, [ncmResumeList, selectedNcm, availableNcms]);

  const filteredMonthlyRevenueList = useMemo(() => {
    if (!selectedMonthYear || availableMonthYears.length === 0) {
      return monthlyRevenueList;
    }
    return monthlyRevenueList.filter(item => item.monthYear === selectedMonthYear);
  }, [monthlyRevenueList, selectedMonthYear, availableMonthYears]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; 
      const totalRevenue = data.totalRevenue;
      const totalIcms = data.totalIcms;
      const totalPis = data.totalPis;
      const totalCofins = data.totalCofins;

      const icmsPercentage = totalRevenue > 0 ? ((totalIcms / totalRevenue) * 100).toFixed(2) : '0.00';
      const pisPercentage = totalRevenue > 0 ? ((totalPis / totalRevenue) * 100).toFixed(2) : '0.00';
      const cofinsPercentage = totalRevenue > 0 ? ((totalCofins / totalRevenue) * 100).toFixed(2) : '0.00';
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-bold text-blue-700 mb-2">{label}</p> 
          <p className="text-gray-800 mb-2">
            <span className="font-semibold">Faturamento Total:</span>{' '}
            <span className="font-bold text-green-700">R$ {formatNumber(totalRevenue)}</span>
          </p>
          
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="font-semibold text-gray-700 mb-1">Impostos sobre o Faturamento:</p>
            <p className="text-gray-700 ml-2">
              <span className="font-medium">ICMS:</span>{' '}
              <span className="font-mono">R$ {formatNumber(totalIcms)}</span>{' '}
              <span className="text-blue-600">({icmsPercentage}%)</span>
            </p>
            <p className="text-gray-700 ml-2">
              <span className="font-medium">PIS:</span>{' '}
              <span className="font-mono">R$ {formatNumber(totalPis)}</span>{' '}
              <span className="text-blue-600">({pisPercentage}%)</span>
            </p>
            <p className="text-gray-700 ml-2">
              <span className="font-medium">COFINS:</span>{' '}
              <span className="font-mono">R$ {formatNumber(totalCofins)}</span>{' '}
              <span className="text-blue-600">({cofinsPercentage}%)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      <div className="container mx-auto px-6 py-12">
        {/* Card Principal */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header do Card Principal (Faça o Upload da NFe em XML) */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold text-white"> 
                  {/* Mantém nome e CNPJ no card principal */}
                  {nomeEmpresaAnalise && cnpjEmpresaAnalise ? 
                    <><span className="font-semibold text-white">Nome da Empresa:</span> {nomeEmpresaAnalise} | CNPJ: {cnpjEmpresaAnalise}</> : 
                    'Faça o Upload de Documentos Fiscais (NFe, NFCe, NFSe)'}
                </h2>
              </div>
            </div>

            {/* Área de Upload */}
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                {/* Área de Drag and Drop */}
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors duration-300"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      {/* Botão para selecionar arquivos */}
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="bg-white hover:bg-gray-50 border-2 border-blue-300 hover:border-blue-400 rounded-lg px-6 py-3 transition-all duration-300 shadow-sm hover:shadow-md">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium text-gray-700">Selecionar Arquivos</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">XML ou ZIP individuais</p>
                        </div>
                        <input
                          type="file"
                          accept=".xml,.zip"
                          multiple
                          onChange={handleFileChange}
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            zIndex: -1,
                            width: '1px',
                            height: '1px',
                            overflow: 'hidden',
                          }}
                          id="file-upload"
                          disabled={isLoading}
                        />
                      </label>


                    </div>
                    
                    <p className="text-gray-500 mt-4 text-center">
                      Suporta NFe, NFCe e NFSe | Arraste e solte múltiplos arquivos XML e ZIP
                    </p>
                  </div>

                                    {isLoading && (
                    <div className="mb-6">
                      <div className="flex items-center justify-center text-blue-600 font-semibold text-lg mb-3">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando arquivos...
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={handleProcessFiles}
                      disabled={files.length === 0 || isLoading}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {isLoading ? 'Aguarde...' : 'Processar Arquivos'}
                    </button>
                    
                    {files.length > 0 && (
                      <button
                        onClick={clearAllFiles}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Limpar Todos
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Arquivos Selecionados */}
                {files.length > 0 && (
                  <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Arquivos Selecionados ({files.length})
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Arraste para reordenar</span>
                        </div>
                      </div>
                    </div>
                    
                                         <div className="max-h-64 overflow-y-auto">
                       {files.map((file, index) => (
                         <div 
                           key={`${file.name}-${index}`}
                           className="flex items-center justify-between p-4 border-b border-gray-100 transition-colors duration-200 hover:bg-gray-50"
                         >
                           <div className="flex items-center space-x-3 flex-1 min-w-0">
                             <div className="flex items-center space-x-2">
                               <div className="text-gray-400 hover:text-gray-600 transition-colors">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                 </svg>
                               </div>
                               <div className={`p-2 rounded-lg ${
                                 file.name.toLowerCase().endsWith('.xml') 
                                   ? 'bg-green-100 text-green-600' 
                                   : 'bg-blue-100 text-blue-600'
                               }`}>
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                 </svg>
                               </div>
                             </div>
                             
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-gray-900 truncate">
                                 {file.name}
                               </p>
                               <p className="text-xs text-gray-500">
                                 {(file.size / 1024).toFixed(1)} KB • {file.type || 'Arquivo'}
                               </p>
                             </div>
                           </div>
                           
                           <div className="flex items-center space-x-2">
                             <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                               file.name.toLowerCase().endsWith('.xml') 
                                 ? 'bg-green-100 text-green-800' 
                                 : 'bg-blue-100 text-blue-800'
                             }`}>
                               {file.name.toLowerCase().endsWith('.xml') ? 'XML' : 'ZIP'}
                             </span>
                             
                             <button
                               onClick={() => removeFile(index)}
                               disabled={isLoading}
                               className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
                               title="Remover arquivo"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                    
                                         {files.length > 0 && (
                       <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                         <div className="flex items-center justify-between text-sm text-gray-600">
                           <span>
                             Total: {files.length} arquivo(s) • 
                             {files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024 > 1 
                               ? `${(files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB`
                               : `${(files.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(1)} KB`
                             }
                           </span>
                           <span className="text-green-600 font-medium">
                             ✓ Pronto para processar
                           </span>
                         </div>
                         
                         
                       </div>
                     )}


                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NOVO: Card de Aviso de Pulo de Nota */}
          {skippedNotes.length > 0 && (
              <div className="mt-8 bg-orange-50 rounded-2xl shadow-2xl overflow-hidden border border-orange-200">
                  <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center">
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Aviso: Pulos na Sequência de Notas Fiscais Detectados!
                      </h3>
                  </div>
                  <div className="p-6">
                      <p className="text-gray-700 mb-4">Foram detectadas falhas na sequência numérica das seguintes notas fiscais:</p>
                      <div className="max-h-40 overflow-y-auto pr-2">
                        <ul className="list-disc list-inside text-gray-800">
                            {skippedNotes.map((entry, index) => (
                                <li key={index} className="mb-2">
                                    <span className="font-semibold">Emitente CNPJ:</span> {entry.cnpj}
                                    <span className="ml-4 font-semibold">Série:</span> {entry.serie}
                                    <span className="ml-4 font-semibold">Notas Puladas:</span>{' '}
                                    <span className="text-red-600 font-bold">{entry.skipped.join(', ')}</span>
                                </li>
                            ))}
                        </ul>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                          É importante verificar a justificativa para esses pulos com o seu departamento fiscal ou contabilidade.
                      </p>
                  </div>
              </div>
          )}

          {/* Resumo dos Tipos de Documentos Processados */}
          {documentList.length > 0 && !isLoading && (
            <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Resumo dos Documentos Processados</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">NFe</p>
                        <p className="text-2xl font-bold text-green-900">
                          {documentList.filter(doc => doc.tipoDocumento === 'NFe').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">NFCe</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {documentList.filter(doc => doc.tipoDocumento === 'NFCe').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-purple-100 rounded-full p-2 mr-3">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-800">NFSe</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {documentList.filter(doc => doc.tipoDocumento === 'NFSe').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Total de documentos processados:</span> {documentList.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card de Resumo por NCM */}
          {ncmResumeList.length > 0 && !isLoading && (
            <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Resumo por NCM</h3>
                
                {availableNcms.length > 0 && (
                    <div className="relative flex items-center">
                        <label htmlFor="ncm-filter" className="sr-only">Filtrar por NCM</label>
                        <select
                            id="ncm-filter"
                            value={selectedNcm}
                            onChange={handleNcmFilterChange}
                            className="block w-40 py-2 pl-3 pr-8 rounded-lg shadow-md border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                            disabled={isLoading}
                        >
                            <option value="">Todos os NCMs</option>
                            {availableNcms.map(ncm => (
                                <option key={ncm} value={ncm}>
                                    {ncm}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                        </div>
                    </div>
                )}
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10"> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">NCM</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">QUANTIDADE VENDIDA</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">VALOR TOTAL (R$)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">ICMS (R$)</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">ICMS (%)</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">PIS (R$)</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">PIS (%)</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">COFINS (R$)</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">COFINS (%)</th> 
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNcmResumeList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.ncm}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.totalQuantidade)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.totalValor)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.totalIcms)}</td>      
                        <td className="px-4 py-3 text-sm text-gray-900">{item.icmsPercentage}%</td> 
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.totalPis)}</td>   
                        <td className="px-4 py-3 text-sm text-gray-900">{item.pisPercentage}%</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatNumber(item.totalCofins)}</td>      
                        <td className="px-4 py-3 text-sm text-gray-900">{item.cofinsPercentage}%</td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card de Faturamento Mensal (GRÁFICO DE BARRAS APRIMORADO) */}
          {monthlyRevenueList.length > 0 && !isLoading && (
            <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Faturamento Mensal</h3>
                
                {availableMonthYears.length > 0 && (
                    <div className="relative flex items-center">
                        <label htmlFor="month-year-filter" className="sr-only">Filtrar por Mês/Ano</label>
                        <select
                            id="month-year-filter"
                            value={selectedMonthYear}
                            onChange={handleMonthYearFilterChange}
                            className="block w-40 py-2 pl-3 pr-8 rounded-lg shadow-md border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                            disabled={isLoading}
                        >
                            <option value="">Todos os Meses</option>
                            {availableMonthYears.map(my => (
                                <option key={my} value={my}>
                                    {my}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                        </div>
                    </div>
                )}
              </div>
              <div className="p-4">
                {filteredMonthlyRevenueList.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={filteredMonthlyRevenueList}
                            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis
                                dataKey="monthYear"
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickFormatter={(value) => `R$ ${formatNumber(value)}`}
                                tickLine={false}
                                axisLine={{ stroke: '#cbd5e1' }}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                width={80}
                            />
                            <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="rect"
                                wrapperStyle={{ paddingTop: '10px' }}
                            />
                            <Bar
                                dataKey="totalRevenue"
                                name="Faturamento (R$)"
                                fill="url(#colorRevenue)"
                                barSize={40}
                            />
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.5}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        Nenhum dado de faturamento disponível para o período selecionado.
                    </div>
                )}
              </div>
            </div>
          )}

          {/* Tabela de Resultados (Dados Processados) */}
          {documentList.length > 0 && !isLoading && (
            <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Dados Processados</h3>
                <button
                  onClick={handleExportExcel}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Baixar em Excel</span>
                </button>
              </div>
              
              <div className="overflow-x-auto max-h-96 overflow-y-auto"> 
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10"> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">TIPO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">NÚMERO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CNPJ/CPF EMITENTE</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">NOME EMITENTE</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">DATA EMISSÃO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CNPJ/CPF DESTINATÁRIO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">NOME DESTINATÁRIO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">PRODUTO/SERVIÇO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">NCM/CÓDIGO</th> 
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CFOP</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CST</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">QUANTIDADE</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">VALOR UNITÁRIO</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">PIS</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">COFINS</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">ICMS</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CST PIS</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">CST COFINS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documentList.map((doc: DocumentData, idx: number) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            doc.tipoDocumento === 'NFe' ? 'bg-green-100 text-green-800' :
                            doc.tipoDocumento === 'NFCe' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {doc.tipoDocumento}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{doc.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cnpjEmitente}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.nomeEmitente}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.dataEmissao}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cnpjDestinatario}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.nomeDestinatario}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.produto}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.ncm}</td> 
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cfop}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cst}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.quantidade}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.valorUnitario}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.pis}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cofins}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.icms}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cstPis}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.cstCofins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <tfoot><tr><td colSpan={18} className="text-right text-xs text-gray-400 p-2">feito por Davi Alves</td></tr></tfoot>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeitorXML;