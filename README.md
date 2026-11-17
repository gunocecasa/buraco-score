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

O modelo detecta os símbolos dos cantos, não os limites completos de cada carta. Fotografe um jogo por vez, sem mostrar os dois cantos da mesma carta. Não mesclamos automaticamente cantos distantes de mesmo valor porque Buraco usa cartas repetidas. Assim, uma carta com dois cantos expostos pode aparecer duas vezes e precisa ser corrigida. Coringas impressos não são reconhecidos. 2 entra como coringa por padrão e pode ser desmarcado na revisão; Joker sempre é coringa. As cartas aparecem em um único grupo, com marcadores na foto; mova para outros jogos quando necessário. Todos os resultados locais ficam marcados para conferência. O placar só muda após revisão e confirmação explícita. Sem promessa de precisão em aparelhos ou baralhos ainda não testados.

O seletor de naipe manual tem alvo de toque de 56 px; na revisão, seletores têm mínimo de 48 px.

Validação da leitura local: 26 testes automatizados aprovados, TypeScript e compilação de produção. ONNX real carregado no navegador e executado sobre recorte da foto fornecida: 13 sugestões, incluindo falhas de classificação, omissões e cantos repetidos. É uma demonstração funcional, não validação de precisão. A captura de tela inteira retornou zero cartas; use uma foto próxima apenas das cartas. Conferência de navegador: 2 e Joker marcados como coringa por padrão, 2 natural disponível ao desmarcar, Joker continua coringa. Seletor manual medido em 108 × 60 px. Teste físico em celular ainda pendente.
