document.addEventListener('DOMContentLoaded', () => {
    const contractForm = document.getElementById('contract-form');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const contractOutput = document.getElementById('contract-output');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalFooter = document.getElementById('modal-footer');
    const copyBtn = document.getElementById('copy-btn');
    const printBtn = document.getElementById('print-btn');

    // MÁSCARAS DE ENTRADA
    const contratanteDoc = document.getElementById('contratante-doc');
    const contratadaDoc = document.getElementById('contratada-doc');
    const contratanteTelefone = document.getElementById('contratante-telefone');
    const contratadaTelefone = document.getElementById('contratada-telefone');
    const contratoValor = document.getElementById('contrato-valor'); // Novo campo
    const pagamentoMultaValor = document.getElementById('pagamento-multa-valor'); // Novo campo
    const pagamentoJuros = document.getElementById('pagamento-juros'); // Juros

    const formatCPF_CNPJ = (value) => {
        const cleanedValue = value.replace(/\D/g, '');
        if (cleanedValue.length <= 11) {
            return cleanedValue.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return cleanedValue.slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
        }
    };
    const formatTelefone = (value) => {
        const cleanedValue = value.replace(/\D/g, '');
        const length = cleanedValue.length;
        if (length <= 10) {
            return cleanedValue.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return cleanedValue.slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        }
    };
    const formatCurrency = (value) => {
        let cleanedValue = value.replace(/\D/g, ''); // Remove tudo que não é número
        if (cleanedValue === '') return '';

        // Adiciona zeros à esquerda se houver menos de 3 dígitos (para centavos)
        while (cleanedValue.length < 3) {
            cleanedValue = '0' + cleanedValue;
        }

        let integerPart = cleanedValue.slice(0, -2);
        let decimalPart = cleanedValue.slice(-2);

        // Formata a parte inteira com separador de milhares
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return integerPart + ',' + decimalPart;
    };

    const formatDecimal = (value) => {
        let cleanedValue = value.replace(/[^\d,]/g, ''); // Permite apenas números e vírgula
        const parts = cleanedValue.split(',');

        if (parts.length > 2) { // Evita múltiplas vírgulas
            cleanedValue = parts[0] + ',' + parts.slice(1).join('');
        }

        return cleanedValue;
    };


    contratanteDoc.addEventListener('input', (e) => { e.target.value = formatCPF_CNPJ(e.target.value); });
    contratadaDoc.addEventListener('input', (e) => { e.target.value = formatCPF_CNPJ(e.target.value); });
    contratanteTelefone.addEventListener('input', (e) => { e.target.value = formatTelefone(e.target.value); });
    contratadaTelefone.addEventListener('input', (e) => { e.target.value = formatTelefone(e.target.value); });
    contratoValor.addEventListener('input', (e) => { e.target.value = formatCurrency(e.target.value); });
    pagamentoMultaValor.addEventListener('input', (e) => { e.target.value = formatCurrency(e.target.value); });
    pagamentoJuros.addEventListener('input', (e) => { e.target.value = formatDecimal(e.target.value); });


    // LÓGICA DO MODAL
    const closeModal = () => {
        modalOverlay.classList.remove('active');
    };
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { closeModal(); }
    });

    const displayContractStreaming = (htmlContent) => {
        modalTitle.textContent = 'Contrato Gerado com Sucesso';
        contractOutput.innerHTML = '';
        const clauses = htmlContent.split(/(?=<h2>)/);
        let i = 0;
        function showNextClause() {
            if (i < clauses.length) {
                const clauseHtml = clauses[i];
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = clauseHtml;
                tempDiv.style.opacity = 0;
                contractOutput.appendChild(tempDiv);
                setTimeout(() => {
                    tempDiv.style.transition = 'opacity 0.5s';
                    tempDiv.style.opacity = 1;
                }, 50);
                i++;
                setTimeout(showNextClause, 700);
            } else {
                modalFooter.style.display = 'flex';
            }
        }
        showNextClause();
    };

    // LÓGICA DE ENVIO DO FORMULÁRIO
    contractForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        modalTitle.textContent = 'Gerando seu Contrato...';
        contractOutput.innerHTML = '<p class="loading">Conectando com a IA e redigindo o documento. Por favor, aguarde...</p>';
        modalFooter.style.display = 'none';
        modalOverlay.classList.add('active');

        const formData = {
            parte1: {
                nome: document.getElementById('contratante-nome').value,
                doc: document.getElementById('contratante-doc').value,
                endereco: document.getElementById('contratante-endereco').value,
                email: document.getElementById('contratante-email').value,
                telefone: document.getElementById('contratante-telefone').value,
            },
            parte2: {
                nome: document.getElementById('contratada-nome').value,
                doc: document.getElementById('contratada-doc').value,
                endereco: document.getElementById('contratada-endereco').value,
                email: document.getElementById('contratada-email').value,
                telefone: document.getElementById('contratada-telefone').value,
            },
            detalhes: {
                modeloContrato: document.getElementById('contrato-modelo').value,
                nomeContrato: document.getElementById('contrato-nome').value,
                objeto: document.getElementById('contrato-objeto').value,
                valor: document.getElementById('contrato-valor').value,
                formaPagamento: document.getElementById('contrato-pagamento').value,
                dataInicio: document.getElementById('contrato-inicio').value,
                dataTermino: document.getElementById('contrato-termino').value,
            },
            condicoesPagamento: {
                multaPercentual: document.getElementById('pagamento-multa-percentual').value,
                multaValor: document.getElementById('pagamento-multa-valor').value,
                juros: document.getElementById('pagamento-juros').value,
            },
            clausulasOpcionais: {
                multa: document.getElementById('clausula-multa').checked,
                confidencialidade: document.getElementById('clausula-confidencialidade').checked,
                exclusividade: document.getElementById('clausula-exclusividade').checked,
            },
            disposicoesGerais: {
                foro: document.getElementById('gerais-foro').value,
                testemunhas: document.getElementById('gerais-testemunhas').value,
            }
        };
        
        try {
            const response = await fetch('http://localhost:3000/gerar-contrato-completo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) { throw new Error(await response.text()); }
            const htmlResult = await response.text();
            displayContractStreaming(htmlResult);
        } catch (error) {
            console.error('Falha ao gerar contrato:', error);
            modalTitle.textContent = 'Erro na Geração';
            contractOutput.innerHTML = `<p style="color: red;"><strong>Erro:</strong> Não foi possível gerar o contrato. Verifique o console do navegador (F12) para mais detalhes.</p>`;
            modalFooter.style.display = 'none';
        }
    });

    // LÓGICA DOS BOTÕES DO MODAL
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(contractOutput.innerText).then(() => {
            copyBtn.textContent = 'Copiado!';
            setTimeout(() => { copyBtn.textContent = 'Copiar Texto'; }, 2000);
        });
    });
    printBtn.addEventListener('click', () => { window.print(); });

    // LÓGICA DO BOTÃO CANCELAR
    contractForm.addEventListener('reset', () => {
        closeModal();
    });
});