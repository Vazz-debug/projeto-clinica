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

// FUNÇÃO DE LOGIN (NOVA)
async function fazerLogin() {
    const user = document.getElementById("input-usuario").value.trim().toLowerCase();
    const senha = document.getElementById("input-senha").value.trim();

    if (!user || !senha) {
        alert("Digite usuário e senha!");
        return;
    }

    const { data: colaborador, error } = await supabaseClient
        .from('colaboradores')
        .select('*')
        .eq('usuário', user) // CORREÇÃO: Com acento
        .single();

    if (error || !colaborador) {
        alert("Usuário não encontrado!");
        return;
    }

    if (colaborador.senha === senha) {
        alert("Login realizado com sucesso! Bem-vindo, " + colaborador.nome);
        localStorage.setItem("usuarioLogado", colaborador.usuário); // CORREÇÃO: Com acento
        window.location.reload();
    } else {
        alert("Senha incorreta!");
    }
}

// FUNÇÃO DO ADMIN PARA CADASTRAR NOVOS COLABORADORES
async function cadastrarNovoColaborador() {
    const nome = document.getElementById("novo-nome").value.trim();
    const user = document.getElementById("novo-user").value.trim().toLowerCase();
    const senha = document.getElementById("nova-senha").value.trim();

    if (!nome || !user || !senha) {
        alert("Preencha todos os campos para criar o acesso!");
        return;
    }

    // CORREÇÃO: Adicionado o acento na chave 'usuário'
    const { error } = await supabaseClient
        .from('colaboradores')
        .insert([{ nome: nome, "usuário": user, senha: senha }]);

    if (!error) {
        alert(`Usuário '${user}' cadastrado com sucesso!`);
        document.getElementById("novo-nome").value = "";
        document.getElementById("novo-user").value = "";
        document.getElementById("nova-senha").value = "";
        renderizarListaColaboradores();
    } else {
        alert("Erro ao salvar colaborador na nuvem.");
        console.error(error);
    }
}

// FUNÇÃO PARA BUSCAR OS LOGINS DO BANCO E EXIBIR NA TELA DO ADMIN
async function renderizarListaColaboradores() {
    const container = document.getElementById("container-lista-colaboradores");
    if (!container) return;

    const { data: lista, error } = await supabaseClient
        .from('colaboradores')
        .select('*');

    if (error) {
        console.error("Erro ao carregar colaboradores:", error);
        return;
    }

    container.innerHTML = "";
    lista.forEach(colab => {
        // CORREÇÃO: Puxando o 'usuário' com acento da resposta do banco
        const ehAdminMaster = colab.usuário === "admin" || colab.usuário === "administrador";
        const botaoExcluir = ehAdminMaster
            ? `<span style="color: #999; font-size: 0.9em; font-weight: bold;">(Acesso Master)</span>`
            : `<button style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="excluirColaborador(${colab.id}, '${colab.usuário}')">❌ Remover Acesso</button>`;

        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                <span><strong>${colab.nome || colab.usuário}</strong> <span style="color:#666;">(user: ${colab.usuário})</span></span>
                ${botaoExcluir}
            </div>
        `;
    });
}

// FUNÇÃO PARA EXCLUIR UM LOGIN
async function excluirColaborador(idColab, nomeUser) {
    if (confirm(`Remover acesso do usuário '${nomeUser}'?`)) {
        const { error } = await supabaseClient.from('colaboradores').delete().eq('id', idColab);
        if (!error) {
            alert("Acesso removido!");
            renderizarListaColaboradores();
        }
    }
}

// ==========================================
// SEÇÃO DE PACIENTES & HISTÓRICO CLÍNICO
// ==========================================

async function salvarDiagnostico(idPaciente) {
    const textarea = document.getElementById(`diag-${idPaciente}`);
    if (textarea) {
        const { error } = await supabaseClient
            .from('pacientes')
            .update({ diagnostico: textarea.value })
            .eq('id', idPaciente);
        if (!error) alert("Informações salvas!");
    }
}

async function adicionarPaciente() {
    const nome = document.getElementById("add-nome").value.trim();
    const foto = document.getElementById("add-foto").value.trim();
    const nasc = document.getElementById("add-nasc").value;
    const cpf = document.getElementById("add-cpf").value.trim();

    if (!nome) return alert("O nome é obrigatório!");

    const { error } = await supabaseClient
        .from('pacientes')
        .insert([{ nome, foto: foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", nasc, cpf, responsavel: usuarioLogado || "Terapeuta" }]);

    if (!error) {
        alert(`Paciente ${nome} cadastrado!`);
        renderizarFichasPacientes();
    }
}

async function renderizarFichasPacientes() {
    const container = document.getElementById("container-fichas-pacientes");
    if (!container) return;

    const { data: lista } = await supabaseClient.from('pacientes').select('*');
    container.innerHTML = "";

    if (!lista || lista.length === 0) return container.innerHTML = "<p>Nenhum paciente.</p>";

    lista.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("ficha-paciente");
        div.innerHTML = `
            <div class="ficha-cabecalho">
                <img src="${p.foto}" class="foto-ficha">
                <h3>${p.nome}</h3>
                <button onclick="removerPaciente(${p.id}, '${p.nome}')">🗑️</button>
            </div>
            <textarea id="diag-${p.id}">${p.diagnostico || ""}</textarea>
            <button onclick="salvarDiagnostico(${p.id})">Salvar</button>
        `;
        container.appendChild(div);
    });
}

async function removerPaciente(idPaciente, nomePaciente) {
    if (usuarioLogado !== "admin") return alert("Acesso Negado!");
    if (confirm(`Remover ${nomePaciente}?`)) {
        await supabaseClient.from('pacientes').delete().eq('id', idPaciente);
        renderizarFichasPacientes();
    }
}

// ==========================================
// INICIALIZAÇÃO E CALENDÁRIO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnAdmin = document.getElementById("btn-menu-admin");
    if (usuarioLogado === "admin") {
        if (btnAdmin) btnAdmin.style.display = "inline-block";
        renderizarListaColaboradores();
    } else if (btnAdmin) {
        btnAdmin.style.display = "none";
    }

    renderizarFichasPacientes();
});