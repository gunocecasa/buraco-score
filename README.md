# Buraco Score — foto com revisão + lançamento manual

React + TypeScript + Vite, com função de reconhecimento por IA para Vercel e servidor local de desenvolvimento.

## O que mudou

- Duas opções: fotografar a mesa da dupla ou lançar as cartas manualmente.
- Câmera traseira no celular, com opção de escolher foto da galeria. A abertura direta da câmera depende do navegador; no computador normalmente aparece o seletor de arquivo.
- A foto é reduzida no aparelho. Por padrão, a opção experimental “No aparelho” executa um modelo local. A foto só é enviada ao Google se você escolher Gemini.
- O site mostra cartas e agrupamentos detectados; valores incertos aparecem destacados ou como `?`.
- Na revisão, você pode corrigir valor, naipe e uso do coringa, adicionar cartas faltantes, remover cartas extras, mover cartas entre jogos e adicionar/remover jogos.
- Pontos são recalculados durante a correção. Jogos inválidos ou cartas desconhecidas impedem a confirmação.
- É obrigatório conferir a dupla e marcar a confirmação. Nenhum resultado entra automaticamente no placar.
- Por padrão, uma foto substitui os jogos da dupla na rodada, evitando duplicar o lançamento ao fotografar a mesma mesa novamente. Também existe a opção de adicionar jogos, para uma foto de outra área. Os descontos de mão, morto e a batida não são alterados.
- Fotos, revisão e rodada aberta ficam só na memória da página. O histórico concluído e as regras ficam no navegador. Não recarregue antes de concluir a rodada.

## Abrir no PC

Extraia o ZIP e abra `ABRIR-BURACO.html` para usar o lançamento manual e conhecer a revisão por foto. A versão HTML independente NÃO tem servidor de IA; para reconhecimento automático, use a versão publicada na Vercel ou o servidor local abaixo. Não basta colocar somente `dist` numa hospedagem estática.

## Ativar a leitura por foto na Vercel

1. Crie um repositório em https://github.com/new. Envie o conteúdo da pasta extraída, com `package.json` na raiz. Inclua `api`, `shared`, `server`, `src` e os demais arquivos. Não envie o ZIP fechado, `node_modules` nem arquivos com chaves reais.
2. Importe o repositório em https://vercel.com/new. Selecione Vite, build `npm run build`, saída `dist`, instalação `pnpm install --frozen-lockfile`. Use Node.js 22.18+ ou 24.
3. Em **Settings → Environment Variables** do projeto Vercel, configure no servidor:
   - `GEMINI_API_KEY`: sua chave do Gemini criada no Google AI Studio, num projeto da faixa gratuita com cota disponível.
   - `BURACO_ACCESS_CODE`: uma senha escolhida por você, de 12 a 256 caracteres, compartilhada somente com sua mesa.
   - `GEMINI_MODEL`: opcional; padrão `gemini-3.5-flash-lite`. O modelo precisa aceitar imagens e JSON Schema na Gemini API e ter cota gratuita disponível para sua conta.
4. Marque os ambientes desejados e publique novamente (**Redeploy**) após configurar as variáveis. Nunca crie variáveis `VITE_GEMINI_API_KEY` ou inclua a chave no código do navegador.
5. Abra o endereço HTTPS da Vercel no celular. Escolha a dupla, toque em **Tirar foto**, informe o código da mesa e toque em **Reconhecer foto**. Corrija os jogos e confirme.

A integração usa Gemini, com modelo padrão gemini-3.5-flash-lite, que oferece faixa gratuita sujeita aos limites e à disponibilidade da sua conta/região. Crie a chave em https://aistudio.google.com/api-keys, em um projeto da faixa gratuita. O site não ativa faturamento e não troca automaticamente de provedor ou modelo quando a cota acaba. Se você usar um projeto com faturamento pago, as regras de cobrança desse projeto se aplicam: o código não consegue garantir que a conta permaneça gratuita. Não envie a chave pelo chat nem a publique no GitHub. O código da mesa protege a chamada de reconhecimento e fica só na memória do navegador; ele não é um sistema completo de contas. Para uso público em grande escala, adicione contas, cotas e limitação de uso persistente.

Se a chave ou o código não estiver configurado, o site explica que a leitura está indisponível e mantém o lançamento manual. Não retorna resultados fictícios.

## Executar localmente

Instale Node.js 22.18+ com npm. Abra um terminal nesta pasta:

```sh
npm install
```

Copie `.env.example` para `.env` e preencha os valores para testar reconhecimento real. Sem eles, o modo manual funciona normalmente.

```sh
npm run dev
```

Abra http://localhost:5173. O comando inicia a interface e a API juntas. No celular, prefira a publicação HTTPS na Vercel; acesso por rede local depende da rede e do navegador.

```sh
npm test
npm run build
npm run preview
```

`preview` serve só a compilação estática e não executa a API de foto. O projeto também inclui `pnpm-lock.yaml` para instalações com pnpm. `ABRIR-BURACO.html` é uma cópia da compilação entregue: alterações no código exigem nova geração desse HTML, ou uso do servidor/publicação.

## Regras de pontuação

- Lavadeira de ases: mínimo 3 cartas; 3–6 sem bônus; 7+ limpa +200 ou suja +100; nunca real, mesmo com 13+.
- Real: A–K natural, mesmo naipe, bônus +500. Pelos valores padrão, cartas = 110 e total = 610.
- Sequências: 3–13 cartas, mesmo naipe natural e sem repetição; lacunas precisam ser cobertas por coringas. Ás baixo ou alto, sem volta K–A–2.
- 2 e Joker entram como substitutos por padrão; o 2 pode ser alterado para natural. A função do 2 sugerida pela IA também precisa de conferência.
- Valores recuperados do histórico: Ás 15, Joker 20, bônus limpa 200/suja 100/real 500.
- Outros padrões ajustáveis: 2 = 10; 3–7 = 5; 8–K = 10; batida +100; morto não pego −100. Pontos da mão podem ser digitados ou preenchidos por foto com revisão.
- Total da rodada = cartas + bônus + batida − morto não pego − mão.

As regras podem ser ajustadas em Regras e valores. Alterações valem para a rodada aberta e não mudam os totais já salvos. Não há verificação automática do limite de baralhos/coringas, exigência de canastra para bater, nem variações especiais do três ou morto pego e não baixado. Combine essas variações com a mesa.

## Limites e privacidade

A IA pode errar contagem, naipes, sobreposição e agrupamentos. Fotografe somente a área da dupla selecionada, com boa luz, e deixe os valores/naipes visíveis. A revisão humana é necessária. Não é possível garantir a leitura de cartas cobertas.

As imagens não são gravadas por este aplicativo em banco de dados ou no histórico do navegador. Na faixa gratuita do Gemini, o Google pode usar o conteúdo enviado para melhorar seus produtos, conforme seus termos. Fotografe somente as cartas e confira os termos da sua conta no Google AI Studio. O código não registra fotos, códigos ou chaves em logs próprios.

## Validação da entrega

- TypeScript e compilação de produção.
- 10 testes automatizados de regras, validação dos resultados e API (incluindo configuração ausente, acesso negado, imagem inválida, recusa, limite e resposta incompleta).
- Fluxo em navegador com largura de celular, usando resposta de IA simulada: correção de carta desconhecida, remoção, inclusão, movimento entre jogos, confirmação só após revisão, lançamento na dupla correta, cálculo, histórico e persistência. Sem erro JavaScript e sem rolagem horizontal nesse fluxo.
- Reconhecimento real de foto não foi executado nesta entrega: não havia chave de API configurada. Não foi feita publicação nas contas do usuário nem teste em uma câmera física de celular.

## Documentação oficial consultada

- Imagens no Gemini: https://ai.google.dev/gemini-api/docs/image-understanding
- Saída estruturada: https://ai.google.dev/gemini-api/docs/structured-output
- Faixa gratuita e preços: https://ai.google.dev/gemini-api/docs/pricing
- Funções Node.js na Vercel: https://vercel.com/docs/functions/runtimes/node-js
- Publicação Vite: https://vite.dev/guide/static-deploy

## Participantes e modos de jogo

A mesa agora aceita mais de duas duplas e partidas individuais. Em Participantes da partida, escolha Duplas ou Cada um por si (contra todos). Use Adicionar dupla ou Adicionar jogador para ampliar a mesa. Os nomes iniciais são Dupla 1, Dupla 2… ou Jogador 1, Jogador 2… e podem ser editados.

É possível incluir participantes após rodadas concluídas: eles entram com zero nas rodadas anteriores. Remover um participante com dados exige confirmação e mantém a associação dos pontos dos demais; os nomes automáticos são renumerados e nomes personalizados são preservados. Trocar o modo com uma partida em andamento exige confirmar o início de uma nova partida. O histórico e a seleção de destinatário da foto acompanham todos os participantes.

Placares antigos Nós/Eles são recuperados como Dupla 1/Dupla 2, com os pontos preservados. Estrutura da mesa fica bloqueada enquanto há foto ou revisão pendente, para evitar associar a foto ao participante errado.

Validação desta atualização: 15 testes de regras, API e participantes; compilação TypeScript e produção; teste de navegador em 390px com 4+ duplas e 6 jogadores, lançamento por foto simulado para Jogador 6, inclusão/remoção, batida única, persistência, migração e histórico com rolagem própria.


## Foto das cartas restantes na mão

Em Rodada em andamento, cada participante tem o botão Fotografar mão, junto do campo Pontos restantes na mão. A câmera ou galeria abre uma revisão separada, associada ao participante escolhido. Fotografe somente as cartas que sobraram após a batida, com os valores visíveis.

A IA identifica as cartas; você pode corrigir valores e naipes, remover extras e adicionar faltantes. A mão não precisa formar jogos: uma carta é válida e não há bônus de canastra. O desconto usa os valores individuais configurados em Regras e valores. Naipe desconhecido não impede o desconto se o valor estiver definido. Ao confirmar, o total substitui o desconto anterior deste participante, sem acumular e sem alterar os jogos da mesa, a batida ou o morto. Você ainda pode editar o total manualmente.

Validação: compilação de produção, 19 testes automatizados e fluxo de navegador com IA simulada: corrigir, adicionar e remover cartas; substituir desconto manual de 80 por 50; repetir foto mantendo desconto de 50; fechar rodada com −50 para uma dupla e +100 de batida para outra. O reconhecimento com fotos reais continua dependendo do serviço de IA configurado na Vercel.


Na Vercel, a instalação foi alinhada ao pnpm-lock.yaml via vercel.json (pnpm install --frozen-lockfile), evitando a falha de npm ao reutilizar cache do pnpm. Somente o script de instalação do esbuild é autorizado nas dependências.



## Migração para Gemini

A API de foto agora chama apenas o Gemini com GEMINI_API_KEY, tanto para a mesa quanto para a mão. OPENAI_API_KEY não é mais usada. O código da mesa existente (BURACO_ACCESS_CODE) continua válido. Para ativar, configure GEMINI_API_KEY na Vercel e faça Redeploy. Não use prefixo VITE_ para chaves. O modelo pode ser alterado no servidor por GEMINI_MODEL; padrão gemini-3.5-flash-lite. Quando o limite do Google for atingido, o app mostra o erro e mantém o modo manual, sem trocar automaticamente para um serviço pago.

Validação da migração: 22 testes automatizados, verificação TypeScript e compilação de produção. Testes cobrem imagem inline, JSON Schema, mesa/mão, cota zero/diária, chave inválida, bloqueio e respostas incompletas. Nenhuma chamada real ao Google foi executada antes da configuração da chave; a precisão com fotos reais ainda precisa ser testada na conta do usuário.


## Leitura local experimental

A opção padrão “No aparelho” usa ONNX Runtime Web 1.22.0 (MIT) em Web Worker, com um único thread WASM para compatibilidade sem isolamento entre origens. Não chama /api/detect, não requer chave nem código da mesa e não envia imagens ao serviço de inferência. Requer HTTPS ou localhost, Worker, createImageBitmap e OffscreenCanvas. O primeiro uso baixa o motor do jsDelivr e um modelo de 38.233.687 bytes do Hugging Face. Há cache do modelo quando permitido; isso não promete funcionamento totalmente offline. Cancelar termina o worker.

Modelo: [LGD Cards Gen 3, TechTools](https://huggingface.co/sroot/lgd-cards-gen3/tree/b2e9e89cc0138a70fc3ac5661922f99b4e3ae135), revisão fixa b2e9e89cc0138a70fc3ac5661922f99b4e3ae135, SHA-256 8b767cdfed2c8e954a9134013ac3d2f2c53be048768d559675be01277a8a8fd1. Pesos AGPL-3.0; pesos de origem best.pt, configuração e dados de treinamento disponíveis no repositório do autor. Os pesos não foram alterados. O site contém links para esses arquivos e para seu próprio código público. ONNX Runtime: https://onnxruntime.ai/docs/get-started/with-javascript/web.html.

O modelo detecta os símbolos dos cantos, não os limites completos de cada carta. Fotografe um jogo por vez, sem mostrar os dois cantos da mesma carta. Não mesclamos automaticamente cantos distantes de mesmo valor porque Buraco usa cartas repetidas. Assim, uma carta com dois cantos expostos pode aparecer duas vezes e precisa ser corrigida. Coringas impressos não são reconhecidos. 2 entra como coringa por padrão e pode ser desmarcado na revisão; Joker sempre é coringa. As cartas são agrupadas pela proximidade e alinhamento dos cantos, com verificação de compatibilidade de naipes e valores naturais. A foto da mão continua sendo uma única mão, sem formar jogos. Confira os grupos e ajuste com Separar a partir daqui, Juntar ao anterior e Mover para. Todos os resultados locais ficam marcados para conferência. O placar só muda após revisão e confirmação explícita. Sem promessa de precisão em aparelhos ou baralhos ainda não testados.

O seletor de naipe manual tem alvo de toque de 56 px; na revisão, seletores têm mínimo de 48 px.

Validação da leitura local: 26 testes automatizados aprovados, TypeScript e compilação de produção. ONNX real carregado no navegador e executado sobre recorte da foto fornecida: 13 sugestões, incluindo falhas de classificação, omissões e cantos repetidos. É uma demonstração funcional, não validação de precisão. A captura de tela inteira retornou zero cartas; use uma foto próxima apenas das cartas. Conferência de navegador: 2 e Joker marcados como coringa por padrão, 2 natural disponível ao desmarcar, Joker continua coringa. Seletor manual medido em 108 × 60 px. Teste físico em celular ainda pendente.

## Arraste de cartas e separação dos jogos

No lançamento manual, segure e arraste a carta na bandeja para mudar sua posição, com mouse ou toque (Pointer Events). A remoção usa o botão × separado; tocar na carta não a remove. No teclado, use as setas esquerda/direita, Home ou End. Identidades estáveis preservam cartas repetidas ao reordenar e a pontuação é recalculada sem alterar os valores.

Na revisão da foto, somente o 2 mostra o controle Usar 2 como coringa; Joker exibe sempre coringa e as demais cartas não mostram esse controle. 2 e Joker continuam como coringas por padrão.

O reconhecimento local usa os retângulos dos cantos para sugerir grupos: proximidade, alinhamento horizontal/vertical, naipes naturais compatíveis e separação de naturais repetidos. Lavadeira de ases permite naipes variados e mais de 13 cartas. Coringas não unem jogos de naipes incompatíveis. A separação é heurística, sem garantia para jogos encostados, curvas, cartas cobertas, leituras erradas ou cantos duplicados. Não são descartadas cartas para forçar jogos válidos. Fragmentos inválidos ficam na revisão. Use Separar a partir daqui, Juntar ao anterior ou Mover para para corrigir. Marcadores J1, J2… na foto indicam a separação inicial; após edição manual, a lista de jogos é a referência.

Validação: 31 testes aprovados e compilação TypeScript/Vite. Testes incluem 18 cartas em três jogos de seis, jogos próximos com naipes distintos, coringa sem unir jogos incompatíveis, lavadeira vertical de 15 ases, preservação de repetidas e mão sem agrupamento. No navegador: arraste real de 3–5–4 para 3–4–5, separar/juntar preservando 13 sugestões da foto real e mudança entre controle exclusivo do 2 e indicação fixa do Joker. Nessa foto antiga com erros de leitura, o agrupamento gerou 6 sugestões de jogos, ainda exigindo correção; não representa precisão garantida em fotos novas. Teste físico do arraste em celular ainda pendente.

## Abas Foto/Manual e leitura detalhada

A interface possui abas Por foto e Manual; somente o editor escolhido aparece. Os componentes permanecem montados ao alternar: foto, correções e cartas manuais são preservadas na sessão. As abas indicam revisão pendente e quantidade de cartas manuais. Pendências continuam impedindo fechar a rodada inadvertidamente. Lançar para no placar abre a aba Manual.

A leitura detalhada, ativada inicialmente e desativável antes da análise, usa o MESMO modelo local em até seis passagens: imagem inteira, quatro recortes sobrepostos e uma região ampliada dos ases quando houver detecção de ás. Não é um segundo modelo e não há envio da foto a outro serviço. Candidatos de recortes são convertidos às coordenadas originais e conciliados por sobreposição: uma leitura isolada conflitante não substitui a leitura global; um candidato novo exige confiança maior ou concordância entre recortes. Cartas iguais em posições distintas são mantidas. Cantos opostos da mesma carta ainda podem gerar repetições; é necessária revisão humana. A leitura detalhada exige mais processamento, com progresso e cancelamento no mesmo worker. O modo simples continua disponível.

Ases empilhados têm tolerância adicional a deslocamento diagonal e lacunas entre cantos, inclusive quando um canto intermediário não foi lido. O agrupamento não acrescenta cartas que não foram detectadas. Não é possível garantir recuperar um símbolo coberto ou ilegível.

Validação: 36 testes aprovados, TypeScript e build. Na mesma imagem de mesa de testes, a leitura simples retornou 13 sugestões e a detalhada 17. Entre as sugestões novas houve cartas úteis e também um canto oposto repetido de uma carta. Não equivale a 17 cartas físicas corretas nem a uma taxa medida de precisão. A lavadeira sugerida com três ases ainda precisa de conferência de cantos e naipes. No navegador, foi verificado que a revisão de 13 sugestões e três cartas manuais permanecem ao alternar as abas; o editor inativo fica oculto. Teste físico desta versão em celular e foto específica do novo relato ainda pendentes.

### Alternativas pesquisadas

- https://github.com/kentdoan/playing-card-recognition : pipeline em Python/OpenCV com contornos, correção de perspectiva e comparação por Template Matching, SIFT ou ORB a 52 imagens de referência. Exige adaptação e avaliação com cartas empilhadas; não é uma biblioteca pronta para inserir no navegador.
- https://github.com/EdjeElectronics/OpenCV-Playing-Card-Detector : identificação em Python/OpenCV para Raspberry Pi/PiCamera; outra referência de métodos clássicos.
- https://huggingface.co/sroot/lgd-cards-gen4 : variante especializada em cartas espalhadas, publicada como não aprovada para produção; não foi adicionada como substituição automática.

Para criar/adaptar um modelo para Buraco, o próximo passo é reunir fotos autorizadas do baralho usado, anotar cantos/valor/naipe e os grupos físicos, separar treino e teste por fotos/mesas, avaliar ases empilhados e cartas sobrepostas e comparar modelo isolado com combinação de leitores. Um segundo leitor só deve ser adotado após medir cartas corretas, faltantes, extras e jogos separados incorretamente no mesmo conjunto de teste. Não foi treinado um novo modelo nem reutilizadas correções do usuário sem consentimento nesta atualização.

## Meta de vitória, comemoração e cartas maiores

A meta padrão é 2.000 pontos, editável pelo campo Meta para vencer e pelo botão Definir meta antes de salvar a primeira rodada (inteiro de 1 a 1.000.000). A meta fica no armazenamento local junto do placar; partidas antigas recebem o padrão de 2.000 sem perder nomes e pontos. Após a primeira rodada, a meta fica fixa; uma nova partida preserva a meta escolhida e permite alterá-la.

A vitória é decidida somente nos totais acumulados de uma rodada fechada, incluindo cartas, bônus e descontos. Ao atingir a meta, vence o maior total; se o maior total estiver empatado, a partida continua. Vale para duplas e jogadores individuais, com qualquer quantidade de participantes. O primeiro encerramento válido determina o vencedor. Após a vitória, novos lançamentos e alterações na estrutura da mesa ficam desativados. Remover a rodada vencedora pelo histórico permite corrigir o resultado; iniciar outra partida exige confirmação e limpa os pontos.

A comemoração é um dialog modal com troféu SVG, entrada animada, brilho, 64 confetes, nome do vencedor, pontos, meta e rodada. Tem botão de fechar, Escape, Ver placar da vitória e Rever comemoração. Recarregar mantém o resultado sem abrir a animação automaticamente. Sem áudio e sem bibliotecas externas novas; respeita prefers-reduced-motion, ocultando confetes e desativando as animações. A tela de resultado oferece Nova partida. O placar mostra barras de progresso e pontos que faltam.

Cartas de seleção no lançamento manual usam colunas adaptáveis com largura mínima de 68 px, altura mínima de 96 px e espaçamento de 14 px. Na verificação com viewport de 375 px, ficaram em 3 colunas de 91 × 101 px, sem rolagem horizontal na página. Toques repetidos na mesma combinação de valor/naipe/coringa dentro de 350 ms são ignorados para evitar duplicação acidental; depois da pausa, a carta pode ser incluída novamente. A ordem pode continuar sendo alterada por arraste.

Validação desta atualização: 42 testes aprovados, TypeScript e build. Testes de meta incluem migração, validação, chegada exata a 2.000, descontos antes da vitória, múltiplos participantes acima da meta, empate e primeira rodada vencedora. No navegador móvel: toque duplo = 1 carta, toque posterior = 2 cartas; meta customizada de 100 persistida; batida de 100 só ganhou depois de salvar a rodada; modal com confetes, bloqueio de lançamentos, resultado após recarregar e replay da animação. Meta padrão de 2.000 também conferida. A captura da comemoração usa a meta de 100 exclusivamente no teste local. Não foi simulado um teste físico de toque em celular.
Verificação adicional no navegador: adicionar participantes permanece bloqueado após a vitória; Nova partida confirmou a limpeza do placar e reabilitou a edição da meta, preservando o valor escolhido.

## Seleção pelo quadro e paleta de lavadeira

O quadro inteiro de cada dupla/jogador agora é um botão de seleção acessível por toque, mouse, Enter ou Espaço. O botão antigo Lançar para foi removido. Nome editável e botão Remover mantêm ações próprias, sem selecionar o quadro acidentalmente. A seleção recebe borda e indicação Selecionado; mantém a aba Foto ou Manual escolhida e sincroniza o destinatário da foto com o lançamento manual. A troca de participante não retargeta uma revisão de foto pendente nem um jogo manual em edição: finalize/cancele a foto ou adicione/limpe as cartas primeiro. Partidas concluídas continuam bloqueadas.

Ao escolher Lavadeira de ases, o baralho manual tem exatamente nove opções: A♠ A♥ A♣ A♦ 2♠ 2♥ 2♣ 2♦ Joker. Não há seletor de naipe nesse modo. Os 2 e o Joker são sempre incluídos como coringas na lavadeira; os ases preservam o naipe da opção tocada. A escolha Sequência retorna às 14 opções anteriores e ao seletor de naipe. Tamanho, espaço, proteção contra duplo toque e arraste permanecem.

Validação: TypeScript e build aprovados; navegador confirmou as nove opções, ausência do seletor de naipe e do botão Lançar para, seleção do quadro por teclado, sincronização do alvo da foto, retorno às 14 opções da sequência e proteção de cartas manuais pendentes. A♥ + A♣ + 2♦ foi incluído como lavadeira de 40 pontos para a Dupla 2 selecionada, sem lançar para a Dupla 1.

## Uso automático do 2 natural ou substituto

Nas sequências, o padrão agora é Automático: um 2 do mesmo naipe é natural se sua inclusão na posição 2 permitir uma sequência válida, com ás baixo ou alto. A–K do mesmo naipe passa a canastra real: 110 em cartas + 500 de bônus = 610 pelos valores padrão. Um 2 cobrindo lacuna distante ou de outro naipe permanece substituto. Apenas um 2 pode ser natural numa sequência; outros 2 continuam coringas. Joker sempre é coringa. Na lavadeira, 2 e Joker continuam substitutos.

Uso do 2 oferece Automático, Natural e Coringa substituto no manual e na revisão de cada carta 2 da foto. Escolhas explícitas são preservadas ao confirmar e lançar o jogo. No manual, alterar a escolha atualiza também os 2 do jogo em edição. O asterisco na bandeja mostra o papel efetivo do 2; não só o valor inicial do campo wild. A ordenação das cartas não altera a classificação. Jogos inválidos não são consertados descartando cartas. Pontos de rodadas já concluídas não são recalculados.

A propriedade opcional twoMode é local à edição; a API de detecção continua com o mesmo formato e a validação não aceita decisões extras do provedor. Para cartas antigas sem twoMode, 2 com wild=true recebe análise automática e 2 com wild=false mantém uso natural explícito. O cálculo não altera o objeto original. O editor manual preserva as identidades usadas no arraste mesmo quando o papel efetivo muda.

Validação: 48 testes aprovados, incluindo A–K com 2 inicialmente marcado coringa e ordem invertida, limpa com 2 natural, suja com lacuna ou naipe diferente, dois 2, Joker, lavadeira e controles explícitos. No navegador, A–K de espadas retornou real 610 sem asterisco no 2; forçar coringa retornou suja 210 e voltar a Automático restaurou real. Na revisão da foto, 2–8 do mesmo naipe retornou limpa 245; forçar o 2 como coringa retornou suja 145 e o lançamento preservou o coringa e o total de 145. O fluxo de revisão foi preenchido manualmente para testar a regra, sem chamar o modelo de imagem.
