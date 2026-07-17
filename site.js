// 1. FUNÇÃO GLOBAL PARA ALTERNAR AS TELAS
function mostrarTela(nomeDaTela) {
    const telas = document.querySelectorAll('.tela-conteudo');
    telas.forEach(tela => tela.classList.remove('ativa'));

    const telaAtiva = document.getElementById(`tela-${nomeDaTela}`);
    if (telaAtiva) {
        telaAtiva.classList.add('ativa');
    }
}

// 2. BANCO DE DADOS INICIAL (Caso o navegador esteja zerado)
const pacientesIniciais = [
    { id: "yasmin", nome: "Yasmin Oliveira", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", nasc: "2004-05-12", cpf: "123.456.789-00" },
    { id: "carlos", nome: "Carlos Souza", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", nasc: "1992-08-24", cpf: "987.654.321-11" }
];

if (!localStorage.getItem("listaPacientes")) {
    localStorage.setItem("listaPacientes", JSON.stringify(pacientesIniciais));
}

// 3. FUNÇÃO DO ADMIN PARA CADASTRAR NOVOS COLABORADORES
function cadastrarNovoColaborador() {
    const nome = document.getElementById("novo-nome").value.trim();
    const user = document.getElementById("novo-user").value.trim().toLowerCase();
    const senha = document.getElementById("nova-senha").value.trim();

    if (!nome || !user || !senha) {
        alert("Preencha todos os campos para criar o acesso!");
        return;
    }

    const dadosDoUsuario = { nome: nome, senha: senha };
    localStorage.setItem(`colaborador_${user}`, JSON.stringify(dadosDoUsuario));

    alert(`Usuário '${user}' cadastrado com sucesso para ${nome}!`);

    document.getElementById("novo-nome").value = "";
    document.getElementById("novo-user").value = "";
    document.getElementById("nova-senha").value = "";
}

// 4. FUNÇÃO PARA SALVAR DIAGNÓSTICOS
function salvarDiagnostico(idPaciente) {
    const textarea = document.getElementById(`diag-${idPaciente}`);
    if (textarea) {
        const textoDiag = textarea.value;
        localStorage.setItem(`diagnostico_paciente_${idPaciente}`, textoDiag);
        alert("Diagnóstico salvo com sucesso!");
    }
}

// 5. FUNÇÃO PARA AS TERAPEUTAS ADICIONAREM PACIENTES
function adicionarPaciente() {
    const nome = document.getElementById("add-nome").value.trim();
    const foto = document.getElementById("add-foto").value.trim();
    const nasc = document.getElementById("add-nasc").value;
    const cpf = document.getElementById("add-cpf").value.trim();

    if (!nome) { 
        alert("O nome é obrigatório!"); 
        return; 
    }

    const lista = JSON.parse(localStorage.getItem("listaPacientes")) || [];
    const idIdentificador = nome.split(" ")[0].toLowerCase();

    // Evita IDs idênticos para não bugar o calendário
    if (lista.some(p => p.id === idIdentificador)) {
        alert("Já existe um paciente cadastrado com esse primeiro nome. Tente diferenciar!");
        return;
    }

    const novo = {
        id: idIdentificador,
        nome: nome,
        foto: foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", // Foto de fallback
        nasc: nasc,
        cpf: cpf
    };

    lista.push(novo);
    localStorage.setItem("listaPacientes", JSON.stringify(lista));

    alert(`Paciente ${nome} cadastrado! Código para agendamento: '${idIdentificador}'`);

    // Limpa os campos do formulário
    document.getElementById("add-nome").value = "";
    document.getElementById("add-foto").value = "";
    document.getElementById("add-nasc").value = "";
    document.getElementById("add-cpf").value = "";

    // Atualiza a listagem na hora e recarrega para sincronizar o calendário
    renderizarFichasPacientes();
    window.location.reload();
}

// 6. FUNÇÃO PARA INJETAR AS FICHAS DINÂMICAS NA TELA (ATUALIZADA)
function renderizarFichasPacientes() {
    const container = document.getElementById("container-fichas-pacientes");
    if (!container) return;

    const lista = JSON.parse(localStorage.getItem("listaPacientes")) || [];
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Nenhum paciente cadastrado no momento.</p>";
        return;
    }

    lista.forEach(p => {
        const diagSalvo = localStorage.getItem(`diagnostico_paciente_${p.id}`) || "";
        const div = document.createElement("div");
        div.classList.add("ficha-paciente");
        div.innerHTML = `
            <div class="ficha-cabecalho">
                <img src="${p.foto}" class="foto-ficha" alt="${p.nome}">
                <div class="ficha-identificacao">
                    <h3>${p.nome}</h3>
                    <p style="margin:0; font-size: 0.9em; color: #555;">Nasc: ${p.nasc || '---'} | CPF: ${p.cpf || '---'}</p>
                </div>
                <!-- NOVO: Botão de remover paciente -->
                <button class="btn-remover-paciente" onclick="removerPaciente('${p.id}', '${p.nome}')" title="Remover Paciente">🗑️</button>
            </div>
            <div class="ficha-diagnostico">
                <label><strong>Diagnóstico / Anotações Clínicas:</strong></label>
                <textarea id="diag-${p.id}" placeholder="Escreva o diagnóstico ou evolução do tratamento aqui...">${diagSalvo}</textarea>
                <button class="btn-salvar-diagnostico" onclick="salvarDiagnostico('${p.id}')">Salvar Informações</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Atualiza a legenda explicativa do calendário baseado nos pacientes reais
    const elInstrucoes = document.getElementById("instrucoes-agendamento");
    if (elInstrucoes) {
        const listaNomes = lista.map(p => `'${p.id}'`).join(", ");
        elInstrucoes.textContent = `Clique em um dia do calendário para agendar um paciente (${listaNomes}) ou digite 'limpar' para remover.`;
    }
}

// 6.5 NOVA FUNÇÃO: REMOVER PACIENTE DO SISTEMA
function removerPaciente(idPaciente, nomePaciente) {
    const confirmar = confirm(`Tem certeza que deseja remover o(a) paciente ${nomePaciente} do sistema? Esta ação irá apagar também o histórico de anotações.`);
    
    if (confirmar) {
        let lista = JSON.parse(localStorage.getItem("listaPacientes")) || [];
        
        // Remove o paciente pelo ID
        lista = lista.filter(p => p.id !== idPaciente);
        localStorage.setItem("listaPacientes", JSON.stringify(lista));
        
        // Limpa a anotação antiga para não acumular lixo no localStorage
        localStorage.removeItem(`diagnostico_paciente_${idPaciente}`);
        
        alert(`Paciente ${nomePaciente} removido com sucesso!`);
        
        renderizarFichasPacientes();
        window.location.reload(); 
    }
}

// 7. INICIALIZAÇÃO DE FLUXOS NO DOM
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Controle do botão Admin e da Tela Secreta
    const usuarioLogado = localStorage.getItem("usuarioLogado"); // <-- Nome corrigido aqui!
    const btnAdmin = document.getElementById("btn-menu-admin");
    const telaAdmin = document.getElementById("tela-admin");

    // Se o usuário for o admin, mostra o botão do menu
    if (usuarioLogado === "admin") {
        if (btnAdmin) {
            btnAdmin.style.display = "inline-block";
        }
    } else {
        // Se NÃO for admin, esconde o botão e arranca a tela do código por segurança
        if (btnAdmin) btnAdmin.style.display = "none";
        if (telaAdmin) telaAdmin.remove();
    }

    // 2. CHAMA A RENDERIZAÇÃO DAS FICHAS E INPUTS ASSIM QUE ENTRA
    renderizarFichasPacientes();

    // 4. Configuração interna do Calendário
    const elMesAno = document.getElementById("mes-ano");
    const containerDias = document.getElementById("calendario-dias");
    const btnAnterior = document.getElementById("btn-anterior");
    const btnProximo = document.getElementById("btn-proximo");

    if (!elMesAno || !containerDias || !btnAnterior || !btnProximo) return;

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let dataAtual = new Date();
    let agendamentos = JSON.parse(localStorage.getItem('agendamentosCalendario')) || {};

    function renderizarCalendario() {
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth();

        elMesAno.textContent = `${meses[mes]} ${ano}`;
        containerDias.innerHTML = "";

        const primeiroDiaDoMes = new Date(ano, mes, 1);
        const diaSemanaInicial = primeiroDiaDoMes.getDay();
        const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

        // MAPEIA AS FOTOS DA LISTA DO BANCO DINÂMICO DE PACIENTES
        const listaPacientesAtual = JSON.parse(localStorage.getItem("listaPacientes")) || [];
        const fotosPacientes = {};
        listaPacientesAtual.forEach(p => {
            fotosPacientes[p.id] = p.foto;
        });

        for (let i = 0; i < diaSemanaInicial; i++) {
            const divVazia = document.createElement("div");
            divVazia.classList.add("dia-vazio");
            containerDias.appendChild(divVazia);
        }

        for (let dia = 1; dia <= totalDiasNoMes; dia++) {
            const elDia = document.createElement("div");
            elDia.classList.add("dia");
            elDia.textContent = dia;

            const dataIdentificador = `${ano}-${mes}-${dia}`;

            if (agendamentos[dataIdentificador]) {
                const nomePaciente = agendamentos[dataIdentificador];
                if (fotosPacientes[nomePaciente]) {
                    const img = document.createElement("img");
                    img.src = fotosPacientes[nomePaciente];
                    img.classList.add("foto-no-calendario");
                    img.title = `Consulta: ${nomePaciente}`;
                    elDia.appendChild(img);
                }
            }

            elDia.addEventListener("click", () => {
                const escolha = prompt("Digite o identificador do paciente para agendar ou 'limpar' para desmarcar.");
                if (escolha !== null) {
                    const escolhaLimpa = escolha.toLowerCase().trim();
                    if (escolhaLimpa === 'limpar') {
                        delete agendamentos[dataIdentificador];
                    } else if (fotosPacientes[escolhaLimpa] !== undefined) {
                        agendamentos[dataIdentificador] = escolhaLimpa;
                    } else {
                        alert("Paciente não encontrado! Certifique-se de cadastrá-lo primeiro na aba de Pacientes.");
                        return;
                    }
                    localStorage.setItem('agendamentosCalendario', JSON.stringify(agendamentos));
                    renderizarCalendario();
                }
            });

            containerDias.appendChild(elDia);
        }
    }

    btnAnterior.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderizarCalendario();
    });

    btnProximo.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderizarCalendario();
    });

    renderizarCalendario();
});