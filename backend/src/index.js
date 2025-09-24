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
        if (data.modeloContrato === 'Locação de Imóvel') {
            prompt += `
**1. LOCADOR(A):**
- Nome/Razão Social: ${data.parte1.nome}, CPF/CNPJ: ${data.parte1.doc}, Endereço: ${data.parte1.endereco}, E-mail: ${data.parte1.email}, Telefone: ${data.parte1.telefone}

**2. LOCATÁRIO(A):**
- Nome/Razão Social: ${data.parte2.nome}, CPF/CNPJ: ${data.parte2.doc}, Endereço: ${data.parte2.endereco}, E-mail: ${data.parte2.email}, Telefone: ${data.parte2.telefone}
`;
        } else if (data.modeloContrato === 'Venda e Compra') {
            prompt += `
**1. VENDEDOR(A):**
- Nome/Razão Social: ${data.parte1.nome}, CPF/CNPJ: ${data.parte1.doc}, Endereço: ${data.parte1.endereco}, E-mail: ${data.parte1.email}, Telefone: ${data.parte1.telefone}

**2. COMPRADOR(A):**
- Nome/Razão Social: ${data.parte2.nome}, CPF/CNPJ: ${data.parte2.doc}, Endereço: ${data.parte2.endereco}, E-mail: ${data.parte2.email}, Telefone: ${data.parte2.telefone}
`;
        }
        
        prompt += `
**3. DETALHES GERAIS DO CONTRATO:**
- Objeto: ${data.detalhesContrato.objeto}
- Valor Total: ${data.detalhesContrato.valor}
- Forma de Pagamento Principal: ${data.detalhesContrato.formaPagamento}
- Data de Início/Assinatura: ${data.detalhesContrato.dataInicio}
- Data de Término: ${data.detalhesContrato.dataTermino || 'Prazo Indeterminado'}
`;

        if (data.modeloContrato === 'Locação de Imóvel') {
            prompt += `
**4. DETALHES DA LOCAÇÃO:**
- Tipo de Garantia: ${data.detalhesLocacao.garantiaTipo}
- Valor da Garantia: ${data.detalhesLocacao.garantiaValor || 'Não aplicável'}
- Índice de Reajuste Anual: ${data.detalhesLocacao.reajusteIndice}
- Incluir menção ao Termo de Vistoria: ${data.detalhesLocacao.mencionaVistoria ? 'Sim' : 'Não'}
`;
        } else if (data.modeloContrato === 'Venda e Compra') {
            prompt += `
**4. DETALHES DA VENDA:**
- Bens Incluídos: ${data.detalhesVenda.bensIncluidos || 'Apenas o objeto principal'}
- Bens NÃO Incluídos: ${data.detalhesVenda.bensExcluidos || 'Nenhum'}
- Declaração de Inexistência de Dívidas: ${data.detalhesVenda.livreDeDividas ? 'Sim' : 'Não'}
`;
        }
        
        prompt += `
**5. CONDIÇÕES DE PAGAMENTO DETALHADAS:**
- Dia do Vencimento das Parcelas: todo dia ${data.condicoesPagamento.diaVencimento || 'N/A'}
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
1.  Redija um contrato completo e formal, começando com o título apropriado (Ex: CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL).
2.  Inicie com a cláusula de QUALIFICAÇÃO DAS PARTES, usando a nomenclatura correta (LOCADOR/LOCATÁRIO ou VENDEDOR/COMPRADOR).
3.  Crie as cláusulas essenciais para o modelo de contrato "${data.modeloContrato}", detalhando o Objeto, o Preço e as Condições de Pagamento, o Prazo de Vigência e outras pertinentes ao modelo.
4.  Crie a cláusula DA RESCISÃO, incluindo a multa por quebra de contrato, se especificada.
5.  Crie a cláusula DO FORO.
6.  Finalize com um parágrafo de fecho padrão e adicione as linhas para as assinaturas das partes e das ${data.disposicoesGerais.testemunhas} testemunhas.
7.  A saída deve ser em HTML, com títulos de cláusulas em <h2> (Ex: <h2>Cláusula Primeira - Do Objeto</h2>) e o texto em <p>. Não inclua as tags <html>, <head> ou <body>.
`;
        return prompt;
    }
    
    const promptFinal = construirPrompt(data);
    
    try {
        const resposta = await openai.chat.completions.create({ // CORREÇÃO DE TYPO AQUI
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: promptFinal }],
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