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

    let prompt = `
Você é um especialista em direito contratual brasileiro. Sua tarefa é redigir um contrato formal, completo e juridicamente sólido com base EXCLUSIVAMENTE nos dados fornecidos.

**Modelo do Contrato Solicitado:** ${data.modeloContrato}

**DADOS FORNECIDOS:**
`;

    // Adiciona as partes com a nomenclatura correta
    if (data.modeloContrato === 'Locação de Imóvel') {
        prompt += `
**1. LOCADOR(A):**
- Nome/Razão Social: ${data.parte1.nome}
- CPF/CNPJ: ${data.parte1.doc}
- Endereço: ${data.parte1.endereco}
- E-mail: ${data.parte1.email}
- Telefone: ${data.parte1.telefone}

**2. LOCATÁRIO(A):**
- Nome/Razão Social: ${data.parte2.nome}
- CPF/CNPJ: ${data.parte2.doc}
- Endereço: ${data.parte2.endereco}
- E-mail: ${data.parte2.email}
- Telefone: ${data.parte2.telefone}
`;
    } else if (data.modeloContrato === 'Venda e Compra') {
        prompt += `
**1. VENDEDOR(A):**
- Nome/Razão Social: ${data.parte1.nome}
- CPF/CNPJ: ${data.parte1.doc}
- Endereço: ${data.parte1.endereco}
- E-mail: ${data.parte1.email}
- Telefone: ${data.parte1.telefone}

**2. COMPRADOR(A):**
- Nome/Razão Social: ${data.parte2.nome}
- CPF/CNPJ: ${data.parte2.doc}
- Endereço: ${data.parte2.endereco}
- E-mail: ${data.parte2.email}
- Telefone: ${data.parte2.telefone}
`;
    } else { // Prestação de Serviços
        prompt += `
**1. CONTRATANTE:**
- Nome/Razão Social: ${data.parte1.nome}
- CPF/CNPJ: ${data.parte1.doc}
- Endereço: ${data.parte1.endereco}
- E-mail: ${data.parte1.email}
- Telefone: ${data.parte1.telefone}

**2. CONTRATADA:**
- Nome/Razão Social: ${data.parte2.nome}
- CPF/CNPJ: ${data.parte2.doc}
- Endereço: ${data.parte2.endereco}
- E-mail: ${data.parte2.email}
- Telefone: ${data.parte2.telefone}
`;
    }
    
    prompt += `
**3. DETALHES GERAIS DO CONTRATO:**
- Objeto: ${data.detalhesContrato.objeto}
- Valor Total: ${data.detalhesContrato.valor}
- Forma de Pagamento Principal: ${data.detalhesContrato.formaPagamento}
- Data de Início: ${data.detalhesContrato.dataInicio}
- Data de Término: ${data.detalhesContrato.dataTermino || 'Prazo Indeterminado'}
`;

    if (data.modeloContrato === 'Locação de Imóvel') {
        prompt += `
**4. DETALHES DA LOCAÇÃO:**
- Tipo de Garantia: ${data.detalhesLocacao.garantiaTipo}
- Valor da Garantia: ${data.detalhesLocacao.garantiaValor || 'Não aplicável'}
- Finalidade: ${data.detalhesLocacao.finalidade}
`;
    }
    
    if (data.modeloContrato === 'Venda e Compra') {
        prompt += `
**4. DETALHES DA VENDA:**
- Data e Local de Entrega: ${data.detalhesVenda.entrega}
- Condição do Bem: ${data.detalhesVenda.condicao}
`;
    }
    
    prompt += `
**5. CONDIÇÕES DE PAGAMENTO DETALHADAS:**
- Dia do Vencimento das Parcelas: todo dia ${data.condicoesPagamento.diaVencimento || 'N/A'}
- Dados Bancários para Pagamento: ${data.condicoesPagamento.dadosBancarios || 'Não especificado'}
- Multa por Atraso: ${data.condicoesPagamento.multaPercentual || '0'}%
- Juros Mensais por Atraso: ${data.condicoesPagamento.juros || '0'}%

**6. DISPOSIÇÕES GERAIS:**
- Foro de Eleição: ${data.disposicoesGerais.foro}
- Número de Testemunhas: ${data.disposicoesGerais.testemunhas}
`;

    prompt += `
**INSTRUÇÕES DE GERAÇÃO:**
1.  Comece com o título do contrato.
2.  Inicie com a cláusula de qualificação das partes, usando a nomenclatura correta (Locador/Locatário, Vendedor/Comprador, Contratante/Contratada).
3.  Crie as cláusulas essenciais para o modelo de contrato "${data.modeloContrato}", detalhando o Objeto, o Preço e as Condições de Pagamento (incluindo as regras de atraso como multa e juros), o Prazo de Vigência e outras pertinentes ao modelo (como Garantia para locação ou Entrega para venda).
`;
    
    const opcionais = [];
    if (data.clausulasOpcionais.multaRescisao) opcionais.push("Multa por Rescisão Contratual");
    if (data.clausulasOpcionais.confidencialidade) opcionais.push("Confidencialidade");
    if (data.clausulasOpcionais.exclusividade) opcionais.push("Exclusividade");

    if (opcionais.length > 0) {
        prompt += `4. Inclua, obrigatoriamente, as seguintes cláusulas opcionais: ${opcionais.join(', ')}.\n`;
    }

    prompt += `5. Adicione uma cláusula "Do Foro" com a cidade e estado fornecidos.
6.  Finalize com um parágrafo de fecho padrão ("E, por estarem assim justos e contratados...") e adicione as linhas para as assinaturas das partes e das ${data.disposicoesGerais.testemunhas} testemunhas.
7.  A saída deve ser em HTML, com títulos de cláusulas em <h2> (Ex: <h2>Cláusula Primeira - Do Objeto</h2>) e o texto em <p>. Não inclua as tags <html>, <head> ou <body>.`;
    
    try {
        const resposta = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
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