
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
        .eq('usuario', user)
        .single();

    if (error || !colaborador) {
        alert("Usuário não encontrado!");
        return;
    }

    if (colaborador.senha === senha) {
        alert("Login realizado com sucesso! Bem-vindo, " + colaborador.nome);
        localStorage.setItem("usuarioLogado", colaborador.usuario);
        window.location.reload(); 
    } else {
        alert("Senha incorreta!");
    }
}

async function cadastrarNovoColaborador() {
    const nome = document.getElementById("novo-nome").value.trim();
    const user = document.getElementById("novo-user").value.trim().toLowerCase();
    const senha = document.getElementById("nova-senha").value.trim();

    if (!nome || !user || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    // O objeto aqui DEVE ter os mesmos nomes das colunas da tabela
    const { error } = await supabaseClient
        .from('colaboradores')
        .insert([{ 
            nome: nome,       
            usuário: user,   
            senha: senha      
        }]);

    if (error) {
        console.error(error);
        alert("Erro: " + error.message);
    } else {
        alert("Cadastrado com sucesso!");
        renderizarListaColaboradores();
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
        const ehAdminMaster = colab.usuario === "admin" || colab.usuario === "administrador";
        const botaoExcluir = ehAdminMaster
            ? `<span style="color: #999; font-size: 0.9em; font-weight: bold;">(Acesso Master)</span>`
            : `<button style="background:#ff4d4d; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="excluirColaborador(${colab.id}, '${colab.usuario}')">❌ Remover Acesso</button>`;

        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                <span><strong>${colab.nome || colab.usuario}</strong> <span style="color:#666;">(user: ${colab.usuario})</span></span>
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
// CALENDÁRIO
// ==========================================

let dataAtual = new Date();

const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// Substitua sua função renderizarCalendario atual por esta:
async function renderizarCalendario() {
    const calendario = document.getElementById("calendario-dias");
    const titulo = document.getElementById("mes-ano");
    if (!calendario) return;

    calendario.innerHTML = "";
    titulo.innerHTML = meses[dataAtual.getMonth()] + " " + dataAtual.getFullYear();

    const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay();
    const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).getDate();

    // Espaços vazios
    for (let i = 0; i < primeiroDia; i++) {
        calendario.innerHTML += `<div class="dia-vazio"></div>`;
    }

    // Busca dados no Supabase
    const { data: consultas } = await supabaseClient.from("consultas").select("*");
    const { data: pacientes } = await supabaseClient.from("pacientes").select("*");

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const dataStr = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const consultasDoDia = consultas ? consultas.filter(c => c.data === dataStr) : [];

        // Cria os cards de consulta com foto e nome
        let htmlCards = consultasDoDia.map(c => {
            const pacienteEncontrado = pacientes?.find(p => p.nome === c.paciente);
            const fotoUrl = pacienteEncontrado ? pacienteEncontrado.foto : "https://via.placeholder.com/30";
            return `
                <div class="consulta" onclick="event.stopPropagation(); excluirConsulta(${c.id})">
                    <img src="${fotoUrl}" style="width:25px; height:25px; border-radius:50%; display:block; margin:0 auto 3px auto;">
                    ${c.paciente.split(' ')[0]}
                </div>`;
        }).join('');

        calendario.innerHTML += `
            <div class="dia" onclick="abrirSeletorPaciente('${dataStr}')">
                <div class="numero-dia">${dia}</div>
                ${htmlCards}
            </div>`;
    }
}

// Adicione esta função nova abaixo da renderizarCalendario:
async function abrirSeletorPaciente(data) {
    const { data: pacientes } = await supabaseClient.from("pacientes").select("nome");
    if (!pacientes || pacientes.length === 0) return alert("Cadastre um paciente primeiro na aba de Pacientes!");

    let listaOpcoes = "Escolha o paciente para agendar:\n\n" + pacientes.map((p, i) => `${i + 1} - ${p.nome}`).join('\n');
    let escolha = prompt(listaOpcoes);
    
    if (escolha && pacientes[escolha - 1]) {
        const pacienteSelecionado = pacientes[escolha - 1].nome;
        const { error } = await supabaseClient.from("consultas").insert([{ 
            data: data, 
            paciente: pacienteSelecionado, 
            terapeuta: usuarioLogado || "Terapeuta" 
        }]);
        
        if (!error) renderizarCalendario();
        else alert("Erro ao agendar.");
    }
}


async function adicionarConsulta(dataConsulta){

    // Busca pacientes

    const {data: pacientes} =
    await supabaseClient
    .from("pacientes")
    .select("*")
    .order("nome");

    if(!pacientes || pacientes.length===0){

        alert("Cadastre um paciente primeiro.");

        return;

    }

    // monta lista

    let texto="Escolha um paciente:\n\n";

    pacientes.forEach((p,i)=>{

        texto+=`${i+1} - ${p.nome}\n`;

    });

    const escolha=
    prompt(texto);

    if(!escolha) return;

    const indice=parseInt(escolha)-1;

    if(indice<0 || indice>=pacientes.length){

        alert("Paciente inválido.");

        return;

    }

    const paciente=pacientes[indice];

    const {error}=await supabaseClient
    .from("consultas")
    .insert([{

        data:dataConsulta,

        paciente:paciente.nome,

        terapeuta:usuarioLogado

    }]);

    if(error){

        console.error(error);

        alert("Erro.");

        return;

    }

    renderizarCalendario();

}

async function excluirConsulta(id){

    if(!confirm("Excluir consulta?"))
        return;

    await supabaseClient
    .from("consultas")
    .delete()
    .eq("id",id);

    renderizarCalendario();

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

    renderizarCalendario();

document
.getElementById("btn-anterior")
.onclick=()=>{

    dataAtual.setMonth(
        dataAtual.getMonth()-1
    );

    renderizarCalendario();

};

document
.getElementById("btn-proximo")
.onclick=()=>{

    dataAtual.setMonth(
        dataAtual.getMonth()+1
    );

    renderizarCalendario();

};
    // ... (restante da lógica do calendário que você já tem)
});

