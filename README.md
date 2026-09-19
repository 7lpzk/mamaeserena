# Site Mamãe Serena

Site institucional com agendamento interativo, pronto para o GitHub Pages (HTML, CSS e JavaScript puros, sem instalação).

## Como publicar no GitHub Pages

1. No GitHub, crie um repositório novo (por exemplo, `mamae-serena`), público.
2. Envie todo o conteúdo desta pasta para o repositório (botão **Add file > Upload files**). O arquivo `index.html` precisa ficar na raiz.
3. Vá em **Settings > Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
4. Aguarde cerca de 1 a 2 minutos. O endereço será `https://SEU-USUARIO.github.io/mamae-serena/`.

## Como editar

| O que mudar | Onde |
|---|---|
| Nomes, cargos, formação e horários das profissionais | `js/main.js`, lista `PROFISSIONAIS` (no topo) |
| Valores e durações dos serviços | `js/main.js`, lista `SERVICOS` (e os textos em `index.html`, seção "Nossos serviços") |
| Fotos da equipe | Coloque a imagem em `assets/equipe/` e preencha `foto: 'assets/equipe/nome.jpg'` |
| Avisos de "conteúdo demonstrativo" | `js/main.js`, `CONFIG.demo` (`true` mostra, `false` remove) |
| Telefone, e-mail, endereço, Instagram | `index.html` (seção Contato, rodapé e dados estruturados) e `CONFIG` em `js/main.js` |
| Cores e fontes | `css/style.css`, bloco `:root` no início |

## Sobre o agendamento

- Os horários ocupados e os agendamentos ficam no navegador (localStorage). Isso demonstra o funcionamento completo, mas **não é compartilhado entre pessoas**. Para uso real, é preciso ligar o formulário a um serviço de agenda ou a um servidor.
- O CPF completo **não é armazenado**: guardamos só os dois últimos dígitos.
- O CPF informado precisa ser válido (dígitos verificadores conferidos).
- Com `CONFIG.demo = true`, alguns horários já aparecem ocupados para a demonstração ficar realista.
