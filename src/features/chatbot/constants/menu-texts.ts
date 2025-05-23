/**
 * Constantes para os textos de menus usados no chatbot
 */
export const MenuTexts = {
  MAIN_MENU: `👋 Olá! Bem-vindo(a) ao atendimento virtual do IFCE Campus Tabuleiro do Norte.  
Como posso te ajudar hoje?

1️⃣ Protocolo (Matrícula, Documentos, Trancamento etc)  
2️⃣ Assistência Estudantil  
3️⃣ Cursos e Formas de Ingresso  
4️⃣ Comunicação com os setores  
5️⃣ Encerrar atendimento`,

  PROTOCOLO_MENU: `Menu de Protocolo
Você selecionou Protocolo. Escolha uma opção:

1 - Consultar número de matrícula  
2 - Trancamento ou a reabertura de curso 
3 - Emitir documentos 
4 - Justificar faltas  
5 - Acompanhar andamento de processos  
0 - Voltar ao menu principal`,

  CONSULTA_MATRICULA: `Consulta por CPF + número de telefone
Para localizar seu número de matrícula, informe:

🧾 CPF (somente números)  
📱 Últimos 4 dígitos do telefone cadastrado

Ex: 12345678910, 2345

0 - Voltar ao menu principal`,

  TRANCAMENTO_REABERTURA: `📌 Para solicitar trancamento ou reabertura de matrícula/disciplina, siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No corpo do e-mail, informe:
Qual procedimento que deseja solicitar (Trancamento ou reabertura de matrícula, ou de uma disciplina);
Nome;
Curso;
E-mail;
Turno/Polo;
Matrícula;
CPF;
Telefone;

📨 Após o envio, o setor de protocolo encaminharà a solicitação para o sistema. Para saber mais, entre em contato com o setor de atendimento do campus presencialmente.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  EMITIR_DOCUMENTOS: `📌 Para solicitar documentos (Diploma, por exemplo), siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No e-mail, anexe os seguintes documentos:
RG/CPF;
Certidão de Nascimento/Casamento;
Título de eleitor;
Quitação Eleitoral;
Reservista(sexo masculino);
Nada consta da biblioteca; 

📨 Após o envio, o setor de protocolo encaminhará a emissão do documento. Para saber mais, entre em contato com o setor de atendimento do campus presencialmente.

📌 Para solicitar documentos como boletim, declarações, histórico escolar, siga estas orientações:

1️⃣ Acesse o link do Q-Acadêmico: https://qacademico.ifce.edu.br
2️⃣ Realize o login com sua matrícula e senha
3️⃣ Na tela inicial, clique em "Solicitar documentos"
4️⃣ Em seguida, clique em "Nova Solitação

Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  JUSTIFICAR_FALTAS: `📌 Para justificar sua falta, siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No e-mail, anexe um documento comprobatório (ex: atestado médico ou declaração da empresa)  
3️⃣ No corpo do e-mail, informe os seguintes dados:
   - Nome completo  
   - Telefone  
   - Curso  
   - Número de matrícula  

📨 Após o envio, o setor de protocolo analisará sua justificativa.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  ACOMPANHAR_PROCESSOS: `📌 Para se atualizar de algum processo que tenha solicitado, siga estas orientações:

1️⃣ Acesse o site do SEI (Sistema Eletrônico de Informações): https://sei.ifce.edu.br/sei/modulos/pesquisa/md_pesq_processo_pesquisar.php?acao_externa=protocolo_pesquisar&acao_origem_externa=protocolo_pesquisar&id_orgao_acesso_externo=0
2️⃣ Ao acessar, preencha os campos necessários do formulário para realizar a busca.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  ASSISTENCIA_ESTUDANTIL: `📚 Assistência Estudantil - IFCE Campus Tabuleiro do Norte

Para informações sobre auxílios, bolsas e programas de assistência estudantil, entre em contato com o setor:

📞 Telefone: (85) 2222-0023
🔗 Link de atendimento: bit.ly/falarcomCAE2

Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  CURSOS_INGRESSO: `🎓 Aqui você encontra informações sobre os cursos e como ingressar na instituição:

📘 Cursos Disponíveis 
Confira todos os cursos oferecidos atualmente no campus pelo link abaixo:  
🔗 https://ifce.edu.br/tabuleirodonorte/campus_tabuleiro/cursos

📝 Formas de Ingresso  
Conheça as formas de ingresso disponíveis (ENEM, vestibular, transferência, etc):  
🔗 https://ifce.edu.br/acesso-rapido/seja-nosso-aluno/

❓ Caso tenha dúvidas, você pode falar com a equipe da secretaria.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`,

  COMUNICACAO_SETORES: `👤 Você deseja falar com um atendente humano.  
Por favor, informe com qual setor deseja conversar:

1 - Comunicação  
2 - Diretoria  
3 - Coordenação  
4 - Secretaria  
0 - Voltar ao menu principal`,

  COLETA_DADOS_ATENDIMENTO: (
    setor: string,
  ) => `Antes de te encaminhar para o setor ${setor}, preciso confirmar algumas informações:

🧍 Nome completo:  
📞 Telefone:  
📧 E-mail:  
🎓 Curso (se aplicável):  

0 - Voltar ao menu principal`,

  ENCERRAMENTO: `👍 Atendimento encerrado. Obrigado por utilizar nosso serviço! Caso precise de ajuda novamente, é só enviar uma mensagem.`,

  OPCAO_INVALIDA: `❌ Opção inválida. Por favor, envie apenas o número da opção desejada.`,
};

/**
 * Constantes para mensagens de erro e validação
 */
export const ErrorMessages = {
  FORMATO_CPF_TELEFONE: `❌ Formato inválido. Por favor, informe o CPF e os últimos 4 dígitos do telefone separados por vírgula.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal`,
  CPF_INVALIDO: `❌ CPF inválido. Por favor, informe um CPF com 11 dígitos.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal`,
  TELEFONE_INVALIDO: `❌ Telefone inválido. Por favor, informe os últimos 4 dígitos do telefone.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal`,
  MATRICULA_NAO_ENCONTRADA: `❌ Não encontramos sua matrícula com os dados informados.\n\nPor favor, verifique:\n- CPF digitado corretamente\n- Número de telefone informado é o que está cadastrado na instituição\n\nDeseja tentar novamente?\n1 - Sim\n0 - Voltar ao menu principal`,
  ERRO_CONSULTA: `❌ Ocorreu um erro ao consultar sua matrícula. Por favor, tente novamente mais tarde.`,
  ERRO_PROCESSAMENTO: `❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.`,
};

/**
 * Constantes para mensagens de sucesso
 */
export const SuccessMessages = {
  MATRICULA_LOCALIZADA: (nome: string, curso: string, matricula: string) =>
    `✅ Matrícula localizada!\n\nNome: ${nome}\nCurso: ${curso}\nMatrícula: ${matricula}\n\nDeseja fazer mais alguma coisa?\n0 - Menu principal\n1 - Encerrar atendimento`,

  PROTOCOLO_GERADO: (setor: string, numeroProtocolo: string) =>
    `✅ Pronto! Seu pedido foi registrado e você será encaminhado para o setor de ${setor}.\n\n🔁 Aguarde um momento. Assim que um atendente estiver disponível, ele iniciará a conversa por aqui mesmo.\n\n📌 Número do protocolo: #${numeroProtocolo}\n(Salve este número caso precise acompanhar ou retomar o atendimento)\n\nCaso deseje voltar ao menu principal, digite \`0\`.`,
};
