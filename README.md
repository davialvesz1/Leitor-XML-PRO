# 📊 Leitor de Documentos Fiscais XML

Este é um projeto desenvolvido em React com TypeScript que permite a leitura, processamento e análise de documentos fiscais eletrônicos (NFe, NFCe, NFSe) a partir de arquivos XML, inclusive compactados em formato `.zip`. A ferramenta extrai dados detalhados, gera resumos gerenciais e oferece visualizações de dados para facilitar a análise fiscal e contábil.

**🚀 Acesse a ferramenta em produção:** [**https://davialvesz1.github.io/Leitor-XML-PRO/**](https://davialvesz1.github.io/Leitor-XML-PRO/)

---

## ✨ Funcionalidades Principais

O Leitor de XML oferece uma suíte completa de ferramentas para análise de documentos fiscais:

- **📤 Upload Flexível:**
  - Faça o upload de múltiplos arquivos `.xml` de uma só vez.
  - Suporte total a arquivos `.zip` contendo múltiplos XMLs, inclusive com ZIPs aninhados.
  - Interface de arrastar e soltar (Drag and Drop) para facilitar o envio dos arquivos.

- **📄 Extração Detalhada de Dados:**
  - Processa NFe (Nota Fiscal Eletrônica), NFCe (Nota Fiscal de Consumidor Eletrônica) e NFSe (Nota Fiscal de Serviço Eletrônica).
  - Extrai informações essenciais como dados do emitente e destinatário, produtos/serviços, valores e impostos (ICMS, PIS, COFINS).
  - Apresenta todos os dados processados em uma tabela organizada e de fácil visualização.

- **📈 Resumos e Análises Gerenciais:**
  - **Resumo por NCM:** Agrupa todos os produtos por seu código NCM (Nomenclatura Comum do Mercosul), exibindo o total vendido, o valor total, e a somatória de impostos (ICMS, PIS, COFINS) com seus respectivos percentuais sobre o faturamento do NCM.
  - **Faturamento Mensal:** Gera um gráfico de barras interativo que exibe o faturamento total consolidado por mês/ano, permitindo uma análise rápida da performance de vendas ao longo do tempo.
  - **Filtros Dinâmicos:** Filtre os resumos por NCM ou Mês/Ano para análises mais específicas.

- **⚠️ Detecção de Pulos de Notas:**
  - O sistema analisa a sequência numérica das notas fiscais por emitente e série.
  - Exibe um aviso claro e destacado caso encontre "pulos" na numeração, ajudando a identificar possíveis falhas fiscais.

- **⬇️ Exportação para Excel:**
  - Exporte todos os dados detalhados dos documentos processados para uma planilha do Excel (`.xlsx`) com um único clique, facilitando o compartilhamento e a análise em outras ferramentas.

---

## 🚀 Como Utilizar

1.  **Acesse a Ferramenta:** Abra o link [https://davialvesz1.github.io/Leitor-XML-PRO/](https://davialvesz1.github.io/Leitor-XML-PRO/).
2.  **Carregue os Arquivos:**
    - Clique em "Selecionar Arquivos" para escolher os arquivos `.xml` ou `.zip` do seu computador.
    - Ou simplesmente arraste e solte os arquivos na área indicada.
3.  **Processe os Dados:** Clique no botão "Processar Arquivos". A ferramenta irá ler, extrair e analisar todos os documentos.
4.  **Analise os Resultados:**
    - Navegue pelos cards de resumo (Tipos de Documentos, Resumo por NCM, Faturamento Mensal).
    - Utilize os filtros para detalhar sua análise.
    - Verifique a tabela de "Dados Processados" na parte inferior para ver todos os detalhes extraídos.
    - Se houver pulos de notas, um card de aviso será exibido no topo.
5.  **Exporte (se necessário):** Clique em "Baixar em Excel" para salvar os dados detalhados localmente.

---

## 🛠️ Tecnologias Utilizadas

- **[React](https://reactjs.org/)**: Biblioteca para construção da interface de usuário.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset do JavaScript que adiciona tipagem estática.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework de CSS para estilização rápida e moderna.
- **[Recharts](https://recharts.org/)**: Biblioteca para criação de gráficos em React.
- **[JSZip](https://stuk.github.io/jszip/)**: Biblioteca para ler e extrair arquivos `.zip` no navegador.
- **[XLSX (SheetJS)](https://sheetjs.com/)**: Para a geração de planilhas do Excel.
- **[GitHub Pages](https://pages.github.com/)**: Plataforma de hospedagem do projeto.
