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
    console.log("-> Requisição recebida em /gerar-contrato-completo...");
    
    const { parte1, parte2, detalhes, condicoesPagamento, clausulasOpcionais, disposicoesGerais } = req.body;

    // Função para formatar o valor como moeda brasileira
    const formatarMoeda = (valor) => {
        if (!valor) return 'Não especificado';
        // Remove pontos de milhar, troca vírgula por ponto para parseFloat, depois formata
        let numero = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
        if (isNaN(numero)) return valor; // Retorna o valor original se não for um número válido
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
    };

    let prompt = `
Você é um especialista em direito contratual incumbido de redigir um contrato formal e completo.
Com base EXCLUSIVAMENTE nos dados fornecidos abaixo, redija um **Contrato de ${detalhes.modeloContrato}**, com o título específico de "${detalhes.nomeContrato}".

**DADOS FORNECIDOS:**

**1. PARTE 1 (Identificada como Contratante, Vendedor ou Locador, conforme o modelo do contrato):**
- Nome/Razão Social: ${parte1.nome}
- CPF/CNPJ: ${parte1.doc}
- Endereço: ${parte1.endereco}
- E-mail: ${parte1.email}
- Telefone: ${parte1.telefone}

**2. PARTE 2 (Identificada como Contratada, Comprador ou Locatário, conforme o modelo do contrato):**
- Nome/Razão Social: ${parte2.nome}
- CPF/CNPJ: ${parte2.doc}
- Endereço: ${parte2.endereco}
- E-mail: ${parte2.email}
- Telefone: ${parte2.telefone}

**3. DETALHES DO CONTRATO:**
- Objeto do Contrato: ${detalhes.objeto}
- Valor Total: ${formatarMoeda(detalhes.valor)}
- Forma de Pagamento: ${detalhes.formaPagamento}
- Data de Início: ${detalhes.dataInicio}
- Data de Término: ${detalhes.dataTermino || 'Indeterminado'}

**4. CONDIÇÕES DE PAGAMENTO ADICIONAIS:**
- Multa Percentual por Atraso: ${condicoesPagamento.multaPercentual ? condicoesPagamento.multaPercentual + '%' : 'Não especificado'}
- Multa com Valor Fixo por Atraso: ${condicoesPagamento.multaValor ? formatarMoeda(condicoesPagamento.multaValor) : 'Não especificado'}
- Juros Mensais por Atraso: ${condicoesPagamento.juros ? condicoesPagamento.juros + '%' : 'Não especificado'}

**5. DISPOSIÇÕES GERAIS:**
- Foro de Eleição: ${disposicoesGerais.foro}
- Número de Testemunhas: ${disposicoesGerais.testemunhas}

**INSTRUÇÕES PARA A IA:**

1.  Ajuste a nomenclatura das partes (Contratante/Contratada, Vendedor/Comprador, Locador/Locatário) de acordo com o modelo de contrato de "${detalhes.modeloContrato}".
2.  Redija o contrato completo, incluindo cláusulas essenciais apropriadas para o modelo.
3.  Crie uma cláusula de pagamento detalhada, incorporando o valor, a forma de pagamento, e as condições de multa (percentual E/OU valor fixo) e juros por atraso, se especificadas.
4.  Crie uma cláusula "Do Foro" com base no foro de eleição fornecido.
`;

    const opcionais = [];
    if (clausulasOpcionais.multa) opcionais.push("Multa por Rescisão Contratual");
    if (clausulasOpcionais.confidencialidade) opcionais.push("Confidencialidade");
    if (clausulasOpcionais.exclusividade) opcionais.push("Exclusividade");

    if (opcionais.length > 0) {
        prompt += `5. Inclua também as seguintes cláusulas opcionais: ${opcionais.join(', ')}.\n`;
    }

    prompt += `6. Ao final do contrato, adicione um fecho padrão e linhas para as assinaturas das partes e das ${disposicoesGerais.testemunhas} testemunhas solicitadas.`;
    prompt += `7. Formate a saída final em HTML simples, usando <h2> para os títulos das cláusulas e <p> para os parágrafos. Não inclua as tags <html>, <head> ou <body>.`;
    
    try {
        const resposta = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2500
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