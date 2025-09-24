document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS AOS ELEMENTOS ---
    const navButtons = document.querySelectorAll('.nav-button');
    const contractForm = document.getElementById('contract-form');
    const formTitle = document.getElementById('form-title');
    
    const formSections = {
        locacao: document.getElementById('locacao-fields'),
        venda: document.getElementById('venda-fields'),
    };
    
    const parte1Legend = document.getElementById('parte1-legend');
    const parte2Legend = document.getElementById('parte2-legend');
    const objetoLabel = document.getElementById('objeto-label');
    const valorLabel = document.getElementById('valor-label');
    
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const contractOutput = document.getElementById('contract-output');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalFooter = document.getElementById('modal-footer');
    const copyBtn = document.getElementById('copy-btn');
    const printBtn = document.getElementById('print-btn');

    // --- LÓGICA DA NAVEGAÇÃO (CORRIGIDA) ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formType = button.getAttribute('data-form');

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // A linha problemática "contractForm.reset()" foi removida daqui.
            // Isso impede que o formulário se esconda logo após aparecer.
            contractForm.classList.remove('hidden'); 

            if (formType === 'locacao') {
                formTitle.textContent = 'Formulário de Contrato de Locação';
                parte1Legend.textContent = 'Dados do Locador(a)';
                parte2Legend.textContent = 'Dados do Locatário(a)';
                valorLabel.textContent = 'Valor Mensal do Aluguel';
                objetoLabel.textContent = 'Objeto do Contrato (Endereço e descrição do imóvel)';
            } else if (formType === 'venda') {
                formTitle.textContent = 'Formulário de Contrato de Compra e Venda';
                parte1Legend.textContent = 'Dados do Vendedor(a)';
                parte2Legend.textContent = 'Dados do Comprador(a)';
                valorLabel.textContent = 'Valor Total da Venda';
                objetoLabel.textContent = 'Objeto do Contrato (Descrição detalhada do bem)';
            }

            Object.values(formSections).forEach(section => section.classList.add('hidden'));
            if (formSections[formType]) {
                formSections[formType].classList.remove('hidden');
            }
        });
    });

    // --- LÓGICA DAS MÁSCARAS DE ENTRADA ---
    const inputsToMask = {
        'parte1-doc': 'cpf_cnpj', 'parte2-doc': 'cpf_cnpj',
        'parte1-telefone': 'telefone', 'parte2-telefone': 'telefone',
        'contrato-valor': 'currency', 'locacao-garantia-valor': 'currency',
    };
    const formatters = {
        cpf_cnpj: (value) => {
            const v = value.replace(/\D/g, '');
            if (v.length <= 11) return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            return v.slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
        },
        telefone: (value) => {
            const v = value.replace(/\D/g, '');
            if (v.length <= 10) return v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
            return v.slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        },
        currency: (value) => {
            let v = value.replace(/\D/g, '');
            if (!v) return '';
            v = (parseInt(v, 10) / 100).toFixed(2) + '';
            v = v.replace(".", ",");
            v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            return "R$ " + v;
        }
    };
    for (const [id, type] of Object.entries(inputsToMask)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', (e) => { e.target.value = formatters[type](e.target.value); });
        }
    }

    // --- LÓGICA DO MODAL ---
    const closeModal = () => modalOverlay.classList.remove('active');
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    const displayContractStreaming = (htmlContent) => {
        modalTitle.textContent = 'Contrato Gerado com Sucesso';
        contractOutput.innerHTML = '';
        const clauses = htmlContent.split(/(?=<h2>)/);
        let i = 0;
        const showNextClause = () => {
            if (i < clauses.length) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = clauses[i];
                tempDiv.style.opacity = 0;
                contractOutput.appendChild(tempDiv);
                setTimeout(() => { tempDiv.style.transition = 'opacity 0.5s'; tempDiv.style.opacity = 1; }, 50);
                i++;
                setTimeout(showNextClause, 700);
            } else {
                modalFooter.style.display = 'flex';
            }
        };
        showNextClause();
    };

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    contractForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        modalTitle.textContent = 'Gerando seu Contrato...';
        contractOutput.innerHTML = '<p class="loading">Conectando com a IA e redigindo o documento. Por favor, aguarde...</p>';
        modalFooter.style.display = 'none';
        modalOverlay.classList.add('active');
        
        const activeFormType = document.querySelector('.nav-button.active').getAttribute('data-form');
        const formData = {
            modeloContrato: activeFormType,
            parte1: { nome: document.getElementById('parte1-nome').value, doc: document.getElementById('parte1-doc').value, endereco: document.getElementById('parte1-endereco').value, email: document.getElementById('parte1-email').value, telefone: document.getElementById('parte1-telefone').value, },
            parte2: { nome: document.getElementById('parte2-nome').value, doc: document.getElementById('parte2-doc').value, endereco: document.getElementById('parte2-endereco').value, email: document.getElementById('parte2-email').value, telefone: document.getElementById('parte2-telefone').value, },
            detalhesContrato: { objeto: document.getElementById('contrato-objeto').value, valor: document.getElementById('contrato-valor').value, formaPagamento: document.getElementById('contrato-pagamento').value, dataInicio: document.getElementById('contrato-inicio').value, dataTermino: document.getElementById('contrato-termino').value, },
            detalhesLocacao: { garantiaTipo: document.getElementById('locacao-garantia-tipo').value, garantiaValor: document.getElementById('locacao-garantia-valor').value, reajusteIndice: document.getElementById('locacao-reajuste-indice').value, mencionaVistoria: document.getElementById('locacao-vistoria').checked, },
            detalhesVenda: { bensIncluidos: document.getElementById('venda-bens-incluidos').value, bensExcluidos: document.getElementById('venda-bens-excluidos').value, livreDeDividas: document.getElementById('venda-dividas-check').checked, },
            condicoesPagamento: { diaVencimento: document.getElementById('pagamento-dia-vencimento').value, dadosBancarios: document.getElementById('pagamento-dados-bancarios').value, multaPercentualAtraso: document.getElementById('pagamento-multa-percentual').value, jurosAtraso: document.getElementById('pagamento-juros').value, },
            penalidades: { multaRescisao: document.getElementById('clausula-multa-rescisao').value, },
            disposicoesGerais: { foro: document.getElementById('gerais-foro').value, testemunhas: document.getElementById('gerais-testemunhas').value, }
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

    // --- LÓGICA DOS BOTÕES DO MODAL E RESET ---
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(contractOutput.innerText).then(() => {
            copyBtn.textContent = 'Copiado!';
            setTimeout(() => { copyBtn.textContent = 'Copiar Texto'; }, 2000);
        });
    });
    printBtn.addEventListener('click', () => { window.print(); });
    
    // O botão 'Limpar' (type="reset") limpa os campos e esconde o formulário, resetando a UI.
    contractForm.addEventListener('reset', () => {
        Object.values(formSections).forEach(section => section.classList.add('hidden'));
        contractForm.classList.add('hidden');
        navButtons.forEach(btn => btn.classList.remove('active'));
        closeModal();
    });
});