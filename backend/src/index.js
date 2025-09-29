require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require("openai");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/gerar-contrato-completo', async (req, res) => {
    console.log("-> Requisição recebida para gerar contrato completo...");
    
    const data = req.body;

    function construirPrompt(data) {
        let prompt = `
Você é um especialista em direito contratual brasileiro. Sua tarefa é redigir um contrato formal, completo e juridicamente sólido com base EXCLUSIVAMENTE nos dados fornecidos.

**Modelo do Contrato Solicitado:** ${data.modeloContrato}

**DADOS FORNECIDOS:**
`;
        const parte1_text = `- Nome/Razão Social: ${data.parte1.nome}\n- CPF/CNPJ: ${data.parte1.doc}\n- RG: ${data.parte1.rg || 'Não informado'}\n- Nacionalidade: ${data.parte1.nacionalidade}\n- Estado Civil: ${data.parte1.estadoCivil || 'Não informado'}\n- Profissão: ${data.parte1.profissao}\n- Endereço: ${data.parte1.endereco}\n- E-mail: ${data.parte1.email}\n- Telefone: ${data.parte1.telefone}`;
        const parte2_text = `- Nome/Razão Social: ${data.parte2.nome}\n- CPF/CNPJ: ${data.parte2.doc}\n- RG: ${data.parte2.rg || 'Não informado'}\n- Nacionalidade: ${data.parte2.nacionalidade}\n- Estado Civil: ${data.parte2.estadoCivil || 'Não informado'}\n- Profissão: ${data.parte2.profissao}\n- Endereço: ${data.parte2.endereco}\n- E-mail: ${data.parte2.email}\n- Telefone: ${data.parte2.telefone}`;

        if (data.modeloContrato === 'Locação de Imóvel') {
            prompt += `
**1. DADOS DO LOCADOR(A):**
${parte1_text}

**2. DADOS DO LOCATÁRIO(A):**
${parte2_text}
`;
        } else if (data.modeloContrato === 'Venda e Compra') {
            prompt += `
**1. DADOS DO VENDEDOR(A):**
${parte1_text}

**2. DADOS DO COMPRADOR(A):**
${parte2_text}
`;
        }
        
        prompt += `
**3. DETALHES GERAIS DO CONTRATO:**
- Objeto: ${data.detalhesContrato.objeto}
- Valor: ${data.detalhesContrato.valor}
- Forma de Pagamento Principal: ${data.detalhesContrato.formaPagamento}
- Data de Início/Assinatura: ${data.detalhesContrato.dataInicio}
- Data de Término: ${data.detalhesContrato.dataTermino || 'Prazo Indeterminado'}
`;

        if (data.modeloContrato === 'Locação de Imóvel') {
            prompt += `
**4. DETALHES ESPECÍFICOS DA LOCAÇÃO:**
- Tipo de Garantia: ${data.detalhesLocacao.garantiaTipo}
- Valor da Garantia: ${data.detalhesLocacao.garantiaValor || 'Não aplicável'}
- Índice de Reajuste Anual: ${data.detalhesLocacao.reajusteIndice}
- Incluir menção ao Termo de Vistoria: ${data.detalhesLocacao.mencionaVistoria ? 'Sim' : 'Não'}
`;
        } else if (data.modeloContrato === 'Venda e Compra') {
            prompt += `
**4. DETALHES ESPECÍFICOS DA VENDA:**
- Bens Incluídos: ${data.detalhesVenda.bensIncluidos || 'Apenas o objeto principal'}
- Bens NÃO Incluídos: ${data.detalhesVenda.bensExcluidos || 'Nenhum'}
- Declaração de Inexistência de Dívidas: ${data.detalhesVenda.livreDeDividas ? 'Sim' : 'Não'}
`;
        }
        
        prompt += `
**5. CONDIÇÕES DE PAGAMENTO DETALHADAS:**
- Dia do Vencimento das Parcelas/Aluguel: todo dia ${data.condicoesPagamento.diaVencimento || 'N/A'}
- Dados Bancários para Pagamento: ${data.condicoesPagamento.dadosBancarios || 'Não especificado'}
- Multa por Atraso: ${data.condicoesPagamento.multaPercentualAtraso || '0'}%
- Juros Mensais por Atraso: ${data.condicoesPagamento.jurosAtraso || '0'}%

**6. PENALIDADES E DISPOSIÇÕES FINAIS:**
- Multa por Quebra de Contrato: ${data.penalidades.multaRescisao || 'Não especificado'}
- Foro de Eleição: ${data.disposicoesGerais.foro}
- Número de Testemunhas: ${data.disposicoesGerais.testemunhas}
`;

        prompt += `
**INSTRUÇÕES DE GERAÇÃO:**
1.  Comece com o título do contrato (Ex: CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL).
2.  **INSTRUÇÃO OBRIGATÓRIA PARA A CLÁUSULA "QUALIFICAÇÃO DAS PARTES":** Redija esta cláusula em formato de parágrafo, utilizando **TODOS** os dados fornecidos para cada parte (Nome, Nacionalidade, Estado Civil, Profissão, CPF/CNPJ, RG, Endereço). **NÃO use placeholders como '[Nome do Vendedor]'**. Use os dados reais fornecidos. Siga o exemplo: "Pelo presente instrumento, de um lado, [NOME DA PARTE 1], nacionalidade [NACIONALIDADE DA PARTE 1], estado civil [ESTADO CIVIL DA PARTE 1], profissão [PROFISSÃO DA PARTE 1], portador do RG nº [RG DA PARTE 1] e inscrito no CPF/CNPJ sob o nº [DOC DA PARTE 1], residente e domiciliado em [ENDEREÇO DA PARTE 1], doravante denominado(a) [PAPEL DA PARTE 1]...". Faça o mesmo para a PARTE 2.
3.  Crie as cláusulas essenciais para o modelo de contrato "${data.modeloContrato}", detalhando o Objeto, o Preço e as Condições de Pagamento, o Prazo de Vigência e outras pertinentes ao modelo.
4.  Crie a cláusula DA RESCISÃO, incluindo a multa por quebra de contrato, se especificada.
5.  Crie a cláusula DO FORO.
6.  Finalize com um parágrafo de fecho padrão ("E, por estarem assim justos e contratados...") e adicione as linhas para as assinaturas das partes e das ${data.disposicoesGerais.testemunhas} testemunhas.
7.  A saída deve ser em HTML, com títulos de cláusulas em <h2> (Ex: <h2>Cláusula Primeira - Do Objeto</h2>) e o texto em <p>. Não inclua as tags <html>, <head> ou <body>.
`;
        return prompt;
    }
    
    const promptFinal = construirPrompt(data);
    
    try {
        const resposta = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "user", "content": promptFinal }],
            temperature: 0.7,
            max_tokens: 3000,
        });

        console.log("✅ Contrato detalhado gerado pela IA com sucesso.");
        const contratoCompletoHtml = resposta.choices[0].message.content.trim();
        
        res.status(200).send(contratoCompletoHtml);

    } catch (error) {
        console.error("❌ Erro ao chamar a OpenAI:", error);
        res.status(500).send(`<p style="color: red;"><strong>Erro:</strong> Não foi possível gerar o contrato com a IA.</p>`);
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});