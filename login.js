
const SUPABASE_URL = "https://czrzlktjrrhoihinrlze.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7yIwxZZYJwWxmEo8PIxNqw_YS8mcJXt";
// Inicializa a conexão com a nuvem do Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const botao = document.getElementById("botao");
    const inputUsuario = document.getElementById("input-usuario");
    const inputSenha = document.getElementById("input-senha");
    const btnOlho = document.getElementById("btn-olho");

    // Lógica do olhinho (mostrar/esconder senha)
    if (btnOlho) {
        btnOlho.addEventListener("click", () => {
            if (inputSenha.type === "password") {
                inputSenha.type = "text";
                btnOlho.textContent = "🔒";
            } else {
                inputSenha.type = "password";
                btnOlho.textContent = "👁️";
            }
        });
    }

    // LISTA DE USUÁRIOS AUTORIZADOS FIXOS (Seu backup de segurança)
    const usuariosAutorizados = [
        { user: "admin", pass: "master2026" },
        { user: "yasmin", pass: "17jrys" }
    ];

    // Adicionamos "async" aqui para permitir a busca na nuvem
    botao.addEventListener("click", async () => {
        const usuarioDigitado = inputUsuario.value.trim().toLowerCase();
        const senhaDigitada = inputSenha.value.trim();

        if (!usuarioDigitado || !senhaDigitada) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        let loginValido = false;
        let tipoUser = usuarioDigitado;

        // 1. Tenta buscar o usuário lá na tabela 'colaboradores' na nuvem
        try {
            const { data: usuarioEncontrado, error } = await supabase
                .from('colaboradores')
                .select('*')
                .eq('user', usuarioDigitado)
                .single(); // Traz apenas um resultado correspondente

            if (usuarioEncontrado && usuarioEncontrado.senha === senhaDigitada) {
                loginValido = true;
                tipoUser = usuarioEncontrado.user;
            }
        } catch (err) {
            console.log("Usuário não encontrado na nuvem, testando banco local...");
        }

        // 2. Se não achou na nuvem (ou se o banco estiver sem internet), confere na lista fixa
        if (!loginValido) {
            const fixo = usuariosAutorizados.find(u => u.user === usuarioDigitado && u.pass === senhaDigitada);
            if (fixo) {
                loginValido = true;
                tipoUser = fixo.user;
            }
        }

        if (loginValido) {
            // Salva o crachá de quem logou para o site.js saber quem é
            localStorage.setItem("usuarioLogado", tipoUser);

            alert("Acesso autorizado! Bem-vindo.");
            window.location.href = "site.html"; 
        } else {
            alert("Erro de Autenticação: Usuário ou senha incorretos.");
        }
    });
});