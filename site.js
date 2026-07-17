// ==========================================
// CONFIGURAÇÃO GLOBAL DO BANCO (SUPABASE)
// ==========================================
const SUPABASE_URL = "https://czrzlktjrrhoihinrlze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7yIwxZZYJwWxmEo8PIxNqw_YS8mcJXt";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pega o crachá local de quem fez o login para controle de acessos
const usuarioLogado = localStorage.getItem("usuarioLogado");

// 1. FUNÇÃO GLOBAL PARA ALTERNAR AS TELAS (UI)
function mostrarTela(nomeDaTela) {
    const telas = document.querySelectorAll('.tela-conteudo');
    telas.forEach(tela => tela.classList.remove('ativa'));

    const telaAtiva = document.getElementById(`tela-${nomeDaTela}`);
    if (telaAtiva) {
        telaAtiva.classList.add('ativa');
    }
}

// ==========================================
// GERENCIAMENTO DE LOGINS (EXCLUSIVO ADMIN)
// ==========================================

// FUNÇÃO DO ADMIN PARA CADASTRAR NOVOS COLABORADORES NA NUVEM
async function cadastrarNovoColaborador() {
    const nome = document.getElementById("novo-nome").value.trim();
    const user = document.getElementById("novo-user").value.trim().toLowerCase();
    const senha = document.getElementById("nova-senha").value.trim();

    if (!nome || !user || !senha) {
        alert("Preencha todos os campos para criar o acesso!");
        return;
    }

    // Envia o novo login direto para a tabela 'colaboradores' usando o nome da coluna correto (usuario)
    const { error } = await supabaseClient
        .from('colaboradores')
        .insert([{ nome: nome, usuario: user, senha: senha }]);

    if (!error) {
        alert(`Usuário '${user}' cadastrado com sucesso na nuvem para ${nome}!`);
        
        // Limpa o formulário
        document.getElementById("novo-nome").value = "";
        document.getElementById("novo-user").value = "";
        document.getElementById("nova-senha").value = "";

        // Atualiza a listagem de funcionários na tela do admin
        renderizarListaColaboradores();
    } else {
        alert("Erro ao salvar colaborador na nuvem.");
        console.error(error);
    }
}

// FUNÇÃO PARA BUSCAR OS LOGINS DO BANCO E EXIBIR NA TELA DO ADMIN
async function renderizarListaColaboradores() {
    const container = document.getElementById("container-lista-colaboradores");
    if (!container) return; // Só executa se o container existir no HTML da tela admin

    const { data: lista, error } = await supabaseClient
        .from('colaboradores')
        .select('*');

    if (error) {
        console.error("Erro ao carregar colaboradores:", error);
        return;
    }

    container.innerHTML = "";

    lista.forEach(colab => {
        // TRAVA DE SEGURANÇA: Impede que o administrador exclua a própria conta master
        const ehAdminMaster = colab.usuario === "admin" || colab.usuario === "administrador";
        
        const botaoExcluir = ehAdminMaster 
            ? `<span style="color: #999; font-size: 0.9em; font-weight: bold;">(Acesso Master)</span>` 
            : `<button style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="excluirColaborador(${colab.id}, '${colab.usuario}')">❌ Remover Acesso</button>`;

        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <span><strong>${colab.nome || colab.usuario}</strong> <span style="color:#666;">(user: ${colab.usuario})</span></span>
                ${botaoExcluir}
            </div>
        `;
    });
}

// FUNÇÃO PARA EXCLUIR UM LOGIN DO BANCO DE DADOS
async function excluirColaborador(idColab, nomeUser) {
    const confirmar = confirm(`⚠️ ATENÇÃO: Tem certeza que deseja remover o acesso do usuário '${nomeUser}'?\nEssa pessoa será deslogada e bloqueada imediatamente.`);
    
    if (confirmar) {
        const { error } = await supabaseClient
            .from('colaboradores')
            .delete()
            .eq('id', idColab);

        if (!error) {
            alert("Acesso removido com sucesso de toda a rede!");
            renderizarListaColaboradores();
        } else {
            alert("Erro ao deletar o colaborador do banco.");
            console.error(error);
        }
    }
}

// ==========================================
// SEÇÃO DE PACIENTES & HISTÓRICO CLÍNICO
// ==========================================

// FUNÇÃO PARA SALVAR DIAGNÓSTICOS / ANOTAÇÕES CLÍNICAS NA NUVEM
async function salvarDiagnostico(idPaciente) {
    const textarea = document.getElementById(`diag-${idPaciente}`);
    if (textarea) {
        const textoDiag = textarea.value;

        const { error } = await supabaseClient
            .from('pacientes')
            .update({ diagnostico: textoDiag })
            .eq('id', idPaciente);

        if (!error) {
            alert("Informações clínicas e diagnósticos salvos com sucesso na nuvem!");
        } else {
            alert("Erro ao salvar as anotações.");
            console.error(error);
        }
    }
}

// FUNÇÃO PARA AS TERAPEUTAS ADICIONAREM PACIENTES NA NUVEM
async function adicionarPaciente() {
    const nome = document.getElementById("add-nome").value.trim();
    const foto = document.getElementById("add-foto").value.trim();
    const nasc = document.getElementById("add-nasc").value;
    const cpf = document.getElementById("add-cpf").value.trim();

    if (!nome) { 
        alert("O nome é obrigatório!"); 
        return; 
    }

    const fotoFallback = foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

    // Insere o registro limpo na tabela 'pacientes'
    const { error } = await supabaseClient
        .from('pacientes')
        .insert([
            {
                nome: nome,
                foto: fotoFallback,
                nasc: nasc,
                cpf: cpf,
                responsavel: usuarioLogado || "Terapeuta"
            }
        ]);

    if (!error) {
        alert(`Paciente ${nome} cadastrado com sucesso no sistema global!`);

        // Limpa o formulário de cadastro
        document.getElementById("add-nome").value = "";
        document.getElementById("add-foto").value = "";
        document.getElementById("add-nasc").value = "";
        document.getElementById("add-cpf").value = "";

        // Atualiza a listagem de fichas na tela
        renderizarFichasPacientes();
    } else {
        alert("Erro ao cadastrar paciente na nuvem.");
        console.error(error);
    }
}

// FUNÇÃO PARA MONTAR AS FICHAS DINÂMICAS DIRETO DA NUVEM
async function renderizarFichasPacientes() {
    const container = document.getElementById("container-fichas-pacientes");
    if (!container) return;

    // Busca todos os pacientes gravados no banco
    const { data: lista, error } = await supabaseClient
        .from('pacientes')
        .select('*');

    if (error) {
        console.error("Erro ao carregar fichas:", error);
        return;
    }

    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Nenhum paciente cadastrado no momento.</p>";
        return;
    }

    lista.forEach(p => {
        const diagSalvo = p.diagnostico || "";
        // Cria dinamicamente o código identificador (primeiro nome em minúsculo)
        const idIdentificador = p.nome.split(" ")[0].toLowerCase();

        const div = document.createElement("div");
        div.classList.add("ficha-paciente");
        div.innerHTML = `
            <div class="ficha-cabecalho">
                <img src="${p.foto}" class="foto-ficha" alt="${p.nome}">
                <div class="ficha-identificacao">
                    <h3>${p.nome}</h3>
                    <p style="margin:0; font-size: 0.9em; color: #555;">Nasc: ${p.nasc || '---'} | CPF: ${p.cpf || '---'}</p>
                    <p style="margin:0; font-size: 0.8em; color: #777;"><small>Código de Agendamento: <strong>${idIdentificador}</strong></small></p>
                </div>
                <!-- Botão de remover paciente -->
                <button class="btn-remover-paciente" onclick="removerPaciente(${p.id}, '${p.nome}')" title="Remover Paciente">🗑️</button>
            </div>
            <div class="ficha-diagnostico">
                <label><strong>Diagnóstico / Anotações Clínicas:</strong></label>
                <textarea id="diag-${p.id}" placeholder="Escreva o diagnóstico ou evolução do tratamento aqui...">${diagSalvo}</textarea>
                <button class="btn-salvar-diagnostico" onclick="salvarDiagnostico(${p.id})">Salvar Informações</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Atualiza o texto de ajuda do calendário com os códigos dinâmicos reais da nuvem
    const elInstrucoes = document.getElementById("instrucoes-agendamento");
    if (elInstrucoes) {
        const listaNomes = lista.map(p => `'${p.nome.split(" ")[0].toLowerCase()}'`).join(", ");
        elInstrucoes.textContent = `Clique em um dia do calendário para agendar um paciente (${listaNomes}) ou digite 'limpar' para remover.`;
    }
}

// FUNÇÃO PARA DELETAR UM PACIENTE DA REDE GLOBAL (APENAS ADMIN CONSEGUE REMOVER)
async function removerPaciente(idPaciente, nomePaciente) {
    if (usuarioLogado !== "admin") {
        alert("Acesso Negado: Apenas o Administrador do sistema possui privilégios para apagar fichas de pacientes!");
        return;
    }

    const confirmar = confirm(`Tem certeza que deseja deletar permanentemente o(a) paciente ${nomePaciente} da nuvem?\nEsta ação é irreversível e excluirá todo o histórico clínico.`);
    
    if (confirmar) {
        const { error } = await supabaseClient
            .from('pacientes')
            .delete()
            .eq('id', idPaciente);
        
        if (!error) {
            alert(`Paciente ${nomePaciente} removido com sucesso de toda a rede!`);
            renderizarFichasPacientes();
        } else {
            alert("Erro ao remover o paciente do banco.");
            console.error(error);
        }
    }
}

// ==========================================
// INICIALIZAÇÃO DE FLUXOS & CALENDÁRIO GLOBAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Validação Visual e de Segurança da Janela do Admin
    const btnAdmin = document.getElementById("btn-menu-admin");
    const telaAdmin = document.getElementById("tela-admin");

    if (usuarioLogado === "admin") {
        if (btnAdmin) btnAdmin.style.display = "inline-block";
        // Se for admin, puxa também a lista de controle de equipe
        renderizarListaColaboradores();
    } else {
        if (btnAdmin) btnAdmin.style.display = "none";
        if (telaAdmin) telaAdmin.remove(); // Remove o HTML do Admin da árvore para segurança
    }

    // 2. Renderiza os pacientes globais na tela assim que abre o painel
    renderizarFichasPacientes();

    // 3. Montagem do Calendário Compartilhado
    const elMesAno = document.getElementById("mes-ano");
    const containerDias = document.getElementById("calendario-dias");
    const btnAnterior = document.getElementById("btn-anterior");
    const btnProximo = document.getElementById("btn-proximo");

    if (!elMesAno || !containerDias || !btnAnterior || !btnProximo) return;

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let dataAtual = new Date();

    async function renderizarCalendario() {
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth();

        elMesAno.textContent = `${meses[mes]} ${ano}`;
        containerDias.innerHTML = "";

        const primeiroDiaDoMes = new Date(ano, mes, 1);
        const diaSemanaInicial = primeiroDiaDoMes.getDay();
        const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

        // [NUVEM] 1. Mapeia os dados de fotos e códigos dos pacientes ativos
        const { data: listaPacientesAtual } = await supabaseClient.from("pacientes").select("*");
        const fotosPacientes = {};
        if (listaPacientesAtual) {
            listaPacientesAtual.forEach(p => {
                const idIdentificador = p.nome.split(" ")[0].toLowerCase();
                fotosPacientes[idIdentificador] = p.foto;
            });
        }

        // [NUVEM] 2. Busca todas as consultas sincronizadas da tabela 'consultas'
        const { data: dadosConsultas } = await supabaseClient.from("consultas").select("*");
        let agendamentos = {};
        if (dadosConsultas) {
            dadosConsultas.forEach(c => {
                agendamentos[c.data_id] = c.paciente_id;
            });
        }

        // Renderiza os espaços vazios iniciais da grade do calendário
        for (let i = 0; i < diaSemanaInicial; i++) {
            const divVazia = document.createElement("div");
            divVazia.classList.add("dia-vazio");
            containerDias.appendChild(divVazia);
        }

        // Renderiza os blocos dos dias correspondentes
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

            elDia.addEventListener("click", async () => {
                const escolha = prompt("Digite o identificador do paciente para agendar ou 'limpar' para desmarcar.");
                if (escolha !== null) {
                    const escolhaLimpa = escolha.toLowerCase().trim();
                    
                    if (escolhaLimpa === 'limpar') {
                        // Limpa o registro da nuvem para aquele dia específico
                        await supabaseClient.from("consultas").delete().eq("data_id", dataIdentificador);
                    } else if (fotosPacientes[escolhaLimpa] !== undefined) {
                        // Limpa qualquer agendamento duplo do mesmo dia e insere o novo agendamento na nuvem
                        await supabaseClient.from("consultas").delete().eq("data_id", dataIdentificador);
                        await supabaseClient.from("consultas").insert([{ data_id: dataIdentificador, paciente_id: escolhaLimpa }]);
                    } else {
                        alert("Paciente não encontrado! Certifique-se de cadastrá-lo primeiro na aba de Pacientes.");
                        return;
                    }
                    
                    // Recarrega os dados do calendário na tela de forma assíncrona
                    renderizarCalendario();
                }
            });

            containerDias.appendChild(elDia);
        }
    }

    // Eventos dos botões de navegação de meses
    btnAnterior.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderizarCalendario();
    });

    btnProximo.addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderizarCalendario();
    });

    // Inicia a renderização do calendário unificado ao entrar na página
    renderizarCalendario();
});