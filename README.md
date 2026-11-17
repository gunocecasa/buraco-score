# Buraco Score — foto com revisão + lançamento manual

React + TypeScript + Vite, com função de reconhecimento por IA para Vercel e servidor local de desenvolvimento.

## O que mudou

- Duas opções: fotografar a mesa da dupla ou lançar as cartas manualmente.
- Câmera traseira no celular, com opção de escolher foto da galeria. A abertura direta da câmera depende do navegador; no computador normalmente aparece o seletor de arquivo.
- A foto é reduzida no aparelho antes do envio. Ao tocar em Reconhecer foto, ela é enviada ao serviço de IA para identificação.
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
2. Importe o repositório em https://vercel.com/new. Selecione Vite, build `npm run build`, saída `dist`, instalação `npm install`. Use Node.js 22.18+ ou 24.
3. Em **Settings → Environment Variables** do projeto Vercel, configure no servidor:
   - `OPENAI_API_KEY`: sua chave da API OpenAI com acesso a um modelo de visão e créditos disponíveis.
   - `BURACO_ACCESS_CODE`: uma senha escolhida por você, de 12 a 256 caracteres, compartilhada somente com sua mesa.
   - `OPENAI_VISION_MODEL`: opcional; padrão `gpt-4.1-mini`. O modelo precisa aceitar imagens e JSON Schema na Responses API.
4. Marque os ambientes desejados e publique novamente (**Redeploy**) após configurar as variáveis. Nunca crie variáveis `VITE_OPENAI_API_KEY` ou inclua a chave no código do navegador.
5. Abra o endereço HTTPS da Vercel no celular. Escolha a dupla, toque em **Tirar foto**, informe o código da mesa e toque em **Reconhecer foto**. Corrija os jogos e confirme.

A leitura por IA pode ter cobrança por uso na conta da API. A chave da API não é a senha da sua conta ChatGPT. Não envie a chave pelo chat nem a publique no GitHub. O código da mesa protege a chamada de reconhecimento e fica só na memória do navegador; ele não é um sistema completo de contas. Para uso público em grande escala, adicione contas, cotas e limitação de uso persistente.

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
- O 2 pode ser natural ou substituto; Joker sempre substituto. A função do 2 sugerida pela IA também precisa de conferência.
- Valores recuperados do histórico: Ás 15, Joker 20, bônus limpa 200/suja 100/real 500.
- Outros padrões ajustáveis: 2 = 10; 3–7 = 5; 8–K = 10; batida +100; morto não pego −100. Pontos da mão são informados manualmente como desconto.
- Total da rodada = cartas + bônus + batida − morto não pego − mão.

As regras podem ser ajustadas em Regras e valores. Alterações valem para a rodada aberta e não mudam os totais já salvos. Não há verificação automática do limite de baralhos/coringas, exigência de canastra para bater, nem variações especiais do três ou morto pego e não baixado. Combine essas variações com a mesa.

## Limites e privacidade

A IA pode errar contagem, naipes, sobreposição e agrupamentos. Fotografe somente a área da dupla selecionada, com boa luz, e deixe os valores/naipes visíveis. A revisão humana é necessária. Não é possível garantir a leitura de cartas cobertas.

As imagens não são gravadas por este aplicativo em banco de dados ou no histórico do navegador. A chamada usa `store: false` na Responses API; isso não equivale a uma garantia de retenção zero pelo provedor. Veja as políticas de dados da sua conta da API. O código não registra fotos, códigos ou chaves em logs próprios.

## Validação da entrega

- TypeScript e compilação de produção.
- 10 testes automatizados de regras, validação dos resultados e API (incluindo configuração ausente, acesso negado, imagem inválida, recusa, limite e resposta incompleta).
- Fluxo em navegador com largura de celular, usando resposta de IA simulada: correção de carta desconhecida, remoção, inclusão, movimento entre jogos, confirmação só após revisão, lançamento na dupla correta, cálculo, histórico e persistência. Sem erro JavaScript e sem rolagem horizontal nesse fluxo.
- Reconhecimento real de foto não foi executado nesta entrega: não havia chave de API configurada. Não foi feita publicação nas contas do usuário nem teste em uma câmera física de celular.

## Documentação oficial consultada

- Visão na API OpenAI: https://developers.openai.com/api/docs/guides/images-vision
- Saída estruturada: https://developers.openai.com/api/docs/guides/structured-outputs
- Funções Node.js na Vercel: https://vercel.com/docs/functions/runtimes/node-js
- Publicação Vite: https://vite.dev/guide/static-deploy
