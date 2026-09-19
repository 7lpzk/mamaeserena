# Ativar as fotos e o agendamento

Este pacote contém somente os arquivos novos ou alterados. Copie-os sobre o repositório existente; não apague as pastas css nem as imagens atuais. O CSS original não foi alterado. O site publicado ainda não foi modificado por esta entrega.

## 1. Ativar a agenda e o e-mail na sua conta Google

1. Abra https://script.google.com e crie um projeto chamado “Agenda Mamãe Serena” na conta que enviará as confirmações.
2. Substitua o conteúdo de Code.gs pelo arquivo backend/Code.gs deste pacote.
3. Nas configurações do projeto, habilite a exibição do manifesto appsscript.json. Substitua-o pelo arquivo backend/appsscript.json.
4. Confira ENDERECO e WHATSAPP no começo de Code.gs. Foram preservados os dados do seu site, que ainda se apresenta como demonstração. Os dias, horários, valores e capacidades também foram preservados.
5. Selecione instalar e clique em Executar. Autorize o acesso à sua conta. Essa função cria uma planilha privada e um gatilho de reenvio. O endereço da planilha aparece no registro de execução. Não compartilhe a planilha publicamente.
6. Clique em Implantar → Nova implantação → Aplicativo da Web. Em “Executar como”, escolha sua conta. Em “Quem pode acessar”, escolha “Qualquer pessoa”, para os visitantes não precisarem entrar no Google. Se sua organização não permitir essa opção, será necessário usar outra conta ou outro serviço.
7. Copie a URL da implantação terminada em /exec para js/config.js, entre as aspas de window.MAMAE_SERENA_API. Essa URL não é uma senha. Não use o endereço /dev.

## 2. Atualizar o GitHub

No repositório 7lpzk/mamaeserena, atualize index.html e js/main.js; adicione js/config.js e as quatro imagens de assets/equipe. Preserve os demais arquivos. O backend é instalado no Google, não executado pelo GitHub Pages.

A conexão GitHub disponível nesta tarefa retornou push: false. Por isso não foi possível enviar o commit nem publicar as mudanças diretamente.

## 3. Conferir a ativação

Após o GitHub Pages publicar, faça um agendamento com seu próprio e-mail e um CPF válido no formulário existente. Confira a mensagem recebida e a linha na planilha. O CPF não é transmitido para o servidor nem incluído no e-mail.

Abra o site em outro navegador: o horário individual reservado deve aparecer ocupado. Para palestras, são 15 vagas. Teste também o cancelamento no primeiro navegador: ele precisa liberar a vaga no outro após atualizar a página. O cancelamento pelo site não envia um segundo e-mail; o escopo implementado é a confirmação inicial solicitada.

O e-mail inclui nome, protocolo, serviço, profissional, dia, hora de Brasília, duração, valor, endereço, modalidade presencial, tema de palestra quando aplicável e contato para remarcar/cancelar.

## Comportamento e limites

- O servidor verifica as vagas dentro de uma trava compartilhada, impedindo que duas reservas individuais ocupem o mesmo horário.
- Repetir “Confirmar” após falha de conexão reutiliza o identificador da tentativa enquanto a página permanece aberta.
- A confirmação por e-mail usa MailApp e as cotas da conta Google. Não há garantia de chegada na caixa principal; verifique também spam. Se o envio falhar após salvar a reserva, a tela informa que o e-mail está pendente. O gatilho tenta novamente a cada cinco minutos, até seis tentativas no total. Reservas pendentes que esgotarem as tentativas precisam de acompanhamento manual na planilha.
- O endpoint é público para permitir agendamentos sem login. Há limite de três solicitações por endereço de e-mail por dia, mas isso não substitui uma proteção antiautomação completa. Para divulgação em grande escala, integrar CAPTCHA validado no servidor e monitorar cotas antes de lançar uma campanha.
- Não há cobrança, integração com agendas externas, painel administrativo ou bloqueio de feriados. Os horários seguem a programação já existente no site.
- Perfis e depoimentos ilustrativos permanecem identificados como no original. As novas fotos são pessoas fictícias geradas por IA.

## Verificação feita nesta entrega

A sintaxe do JavaScript foi validada. Testes locais com serviços Google simulados cobriram reserva, repetição da mesma solicitação, disputa pela mesma vaga, validação de dados, disponibilidade sem dados pessoais, cancelamento autenticado, falha e reenvio de e-mail, cota esgotada e limite de 15 vagas. Isso não substitui o teste real da implantação: a autorização Google, o acesso do navegador à URL /exec e a entrega de e-mail ainda dependem da ativação acima.

Referências oficiais: [implantação web](https://developers.google.com/apps-script/guides/web), [travas](https://developers.google.com/apps-script/reference/lock), [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app), [cotas](https://developers.google.com/apps-script/guides/services/quotas).
