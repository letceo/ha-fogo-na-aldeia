# 🔥 Há fogo na aldeia

Narrativa interativa sobre preparação e evacuação em caso de incêndio rural, desenvolvida pelo **CEABN** (Centro de Ecologia Aplicada "Prof. Baeta Neves", Instituto Superior de Agronomia) para a plataforma de educação [Fire-Explorer](https://fire-explorer.isa.ulisboa.pt/), em colaboração com o Colab ForestWise e a Proteção Civil.

O jogador toma decisões sob pressão de tempo (ligar ao 112, preparar a casa, avisar vizinhos, levar o kit, evacuar…) e no fim recebe um resumo do que fez bem e do que podia ter feito melhor.

- **Jogo online (GitHub Pages):https://letceo.github.io/ha-fogo-na-aldeia/
- **Motor:** [SugarCube](https://www.motion.org/sugarcube/) 2.37.3 (formato do Twine)
- **Editor:** [Twine](https://twinery.org/) 2.12.0
- **Idioma:** Português (pt-PT). O seletor de idiomas existe nas definições mas ainda não está implementado.

---

## Índice

1. [Para quem vai manter o projeto: leitura obrigatória](#1-para-quem-vai-manter-o-projeto-leitura-obrigatória)
2. [Estrutura do repositório](#2-estrutura-do-repositório)
3. [Fluxo de trabalho diário](#3-fluxo-de-trabalho-diário)
4. [Versões, tags e CDN (importante)](#4-versões-tags-e-cdn-importante)
5. [Como o jogo está organizado](#5-como-o-jogo-está-organizado)
6. [Tarefas comuns](#6-tarefas-comuns)
7. [Problemas conhecidos e resolução de erros](#7-problemas-conhecidos-e-resolução-de-erros)
8. [Créditos e licença](#8-créditos-e-licença)

---

## 1. Para quem vai manter o projeto: leitura obrigatória

Cinco regras que evitam quase todos os problemas:

1. **Trabalha sempre em `jogo-dev.html`.** É o ficheiro exportado do Twine.
2. **Nunca edites nem guardes por cima do `index.html`.** É gerado automaticamente por uma GitHub Action e qualquer alteração manual perde-se.
3. **Nunca reutilizes nem movas uma tag.** Imagens novas ou alteradas exigem uma tag **nova** (`v1.0.1`, `v1.0.2`…).
4. **Ordem certa:** imagens → tag → `jogo-dev.html`. Se fizeres push do HTML antes da tag, o `index.html` aponta para a versão antiga.
5. **Faz Pull antes de começares a trabalhar.** A Action cria commits no repositório (o `index.html`) e, sem Pull, terás conflitos.

---

## 2. Estrutura do repositório

```
.
├── .github/workflows/build.yml   # GitHub Action que gera o index.html
├── audio/                        # Sons (.mp3), carregados com caminho relativo
├── css/                          # Não usado em produção (o CSS do jogo vive no Story Stylesheet do Twine)
├── images/
│   ├── cenas/                    # Fundos, overlays e animações das cenas
│   ├── ui/                       # Texturas, logótipos, elementos de interface
│   ├── animations/               # Animação Lottie da chama (ecrã de carregamento)
│   └── favicon/                  # Ícones da aplicação
├── jogo-dev.html                 # ✏️ FICHEIRO DE TRABALHO (exportado do Twine)
├── index.html                    # 🤖 GERADO automaticamente — NÃO EDITAR
├── index_numerado.html           # Versão com passagens numeradas, SÓ para testes em desenvolvimento
├── manifest.json                 # Reservado para a futura versão PWA (ainda não em uso)
├── LICENSE
└── README.md
```

> O `index_numerado.html` é uma ferramenta de desenvolvimento e **não faz parte da produção** (ver [secção 4.6](#46-o-index_numeradohtml)).

---

## 3. Fluxo de trabalho diário

### Requisitos

- [Twine 2.12](https://twinery.org/) (desktop ou browser)
- Git (ou GitHub Desktop / VS Code)
- Um editor de texto (recomendado: VS Code)

### Passo a passo

1. **Pull** do repositório (para receber o último `index.html` gerado pela Action).
2. Abre a história no Twine e faz as alterações (passagens, *Story JavaScript*, *Story Stylesheet*).
3. **Build → Publish to File** e guarda como **`jogo-dev.html`** na pasta do repositório (substitui o anterior). **Nunca como `index.html`.**
4. Se adicionaste ou alteraste imagens, segue primeiro a [secção 4.4](#44-quando-se-adicionam-ou-alteram-imagens).
5. **Commit + push** do `jogo-dev.html`.
6. No GitHub, abre o separador **Actions** e confirma que o workflow *"Gerar index.html de produção"* terminou com ✓ verde.
7. Espera 1–2 minutos pelo GitHub Pages e testa o jogo em **janela anónima**.

### Como testar localmente

Abre o `jogo-dev.html` no browser. As imagens vêm do CDN (`@main`) e os sons de caminhos relativos (`audio/…`), por isso **o ficheiro tem de estar dentro da pasta do repositório** para os sons funcionarem.

---

## 4. Versões, tags e CDN (importante)

### 4.1 O problema

As imagens do jogo são servidas pelo [jsDelivr](https://www.jsdelivr.com/) (um CDN gratuito que serve ficheiros do GitHub), com URLs deste tipo:

```
https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/images/ui/texture.png
```

O `@main` significa "o ramo `main`, na sua versão mais recente". O jsDelivr tem servidores em todo o mundo e cada um guarda a sua própria cópia em cache durante horas, **incluindo respostas de erro (404)**. Consequência: se um ficheiro foi adicionado ou renomeado há pouco, alguns utilizadores recebem a versão antiga ou um 404, enquanto outros (incluindo quem desenvolve) veem tudo bem.

Foi assim que apareceram bugs como o logótipo do CEABN a mostrar o texto do `alt` e a textura das caixas de texto em falta, apenas em alguns dispositivos.

### 4.2 A solução: tags

Uma **tag** do Git (por exemplo `v1.0.0`) é uma versão fixa e imutável do repositório. Com um URL como

```
https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@v1.0.0/images/ui/texture.png
```

o jsDelivr guarda o ficheiro em cache permanente e todos os servidores devolvem exatamente a mesma coisa.

### 4.3 Como está montado

| Ficheiro | Usa | Para quê |
|---|---|---|
| `jogo-dev.html` | `@main` | Desenvolvimento: vês as alterações sem criar tags |
| `index.html` | `@v1.0.x` (tag mais recente) | Produção: o que os jogadores abrem |

A GitHub Action em `.github/workflows/build.yml` corre sempre que o `jogo-dev.html` muda (ou manualmente) e:

1. lê a tag mais recente (`git describe --tags`);
2. substitui `ha-fogo-na-aldeia@main` por `ha-fogo-na-aldeia@<tag>` e grava o resultado em `index.html`;
3. **falha** se ainda sobrar algum `@main` (impede publicar por engano);
4. faz commit do `index.html`.

> ⚠️ A substituição procura o texto exato `ha-fogo-na-aldeia@main`. Escreve sempre os URLs do CDN neste formato, tanto no HTML das passagens como no *Story JavaScript* e *Story Stylesheet*.

### 4.4 Quando se adicionam ou alteram imagens

Sempre, por esta ordem:

1. **Commit + push** dos novos ficheiros em `images/`.
2. Criar uma **nova** tag: no GitHub, **Releases → Create a new release → Choose a tag**, escrever a nova versão (ex.: `v1.0.1`), *target* `main`, **Publish release**.
3. Só depois, **push do `jogo-dev.html`** (ou correr a Action manualmente em **Actions → Gerar index.html de produção → Run workflow**).

Convenção de versões: incrementar o último número (`v1.0.1`, `v1.0.2`…). Para mudanças grandes, o segundo (`v1.1.0`).

> 🚫 **Nunca** apagar e recriar uma tag com o mesmo nome, nem mover uma tag para outro commit. O jsDelivr guarda as tags em cache permanente e voltarias ao problema original.

### 4.5 Quando só se altera o jogo (texto, lógica, CSS)

Basta o push do `jogo-dev.html`. A Action reutiliza a tag mais recente.

### 4.6 O `index_numerado.html`

É uma versão com as passagens numeradas, usada **apenas para testes durante o desenvolvimento**. Não é divulgada nem usada em produção, por isso continua com `@main` e **a Action não lhe toca**.

Como está na raiz do repositório, o GitHub Pages serve-o (em `<URL do jogo>/index_numerado.html`), mas ninguém deve receber esse link. Se um dia for preciso publicá-lo, é necessário acrescentar à Action um passo `sed` equivalente ao do `index.html`.

### 4.7 E os sons?

Os sons **não passam pelo CDN**: são carregados com caminhos relativos (`audio/birds.mp3`, definidos no `StoryInit`) e servidos pelo próprio GitHub Pages. Por isso **não dependem das tags**. Se substituíres um ficheiro de áudio mantendo o nome, os browsers podem continuar a usar a versão em cache; nesse caso, muda o nome do ficheiro (e a referência no `StoryInit`).

### 4.8 Pré-requisitos do GitHub (configuração única)

- Existir pelo menos uma tag (senão o passo "Obter a tag mais recente" falha).
- O workflow tem `permissions: contents: write` no próprio ficheiro. Se a Action falhar com erro 403 ao fazer push, um administrador tem de ativar **Settings → Actions → General → Workflow permissions → Read and write permissions**.
- **Settings → Pages:** origem no ramo `main`, pasta `/ (root)`.

---

## 5. Como o jogo está organizado

Tudo o que é código vive em três sítios dentro do Twine (e, depois de exportado, dentro do `jogo-dev.html`):

| Onde (no Twine) | O que contém |
|---|---|
| **Passagens** | Texto, cenas e lógica narrativa |
| **Story → Details → JavaScript** | Áudio, temporizadores, definições, carregamento… |
| **Story → Details → Stylesheet** | Todo o aspeto visual |

### 5.1 Passagens

As passagens com número (`1`, `2`, `3`…) são as cenas da história, por ordem aproximada de aparição. Passagens especiais:

| Passagem | Função |
|---|---|
| `StoryInit` | Declara os sons (`<<cacheaudio>>`) e inicializa todas as variáveis de estado |
| `Start` | Página inicial |
| `Widget` (tag `widget`) | Widget `resumoEscolhas`, usado nos ecrãs de resultado |
| `⟲` | Caixa de confirmação de "Recomeçar" |
| `Sobre` / `Guia de Jogo` | Modais de informação e instruções |
| `2.1` | Telemóvel: o jogador marca o 112 |
| `Resultado 112`, `Resultado Casa`, `Resultado Kit`, `Resultado Segurança` | Resumos após exercícios |
| `13` / `13-Laurinda` | "Pronto para evacuar" e decisão sobre a D. Laurinda |
| `20` (tag `end`) | Pânico (acontece quando o tempo de decisão se esgota) |
| `21` | Exercício de respiração para acalmar |
| `28`, `34` → `29`, `35` | "Será o fim?": avançam sozinhas para o hospital |
| `final-2`, `final-3` | Finais (casa aguentou / casa ardeu) |
| `Resultados` | Resumo final de todas as decisões |

Estrutura típica de uma passagem de cena:

```html
<<nobr>>
<div class="scene">
  <div class="image-bg casa"></div>          <!-- fundo -->
  <div class="image-overlay reparar-overlay"></div>   <!-- camada por cima (opcional) -->

  <div class="text-box fira-sans-regular">
    <div class="ui-btn">[[⟲]] <<back "←">></div>

    <div id="decisao">
      <p class="animar">Texto que aparece palavra a palavra.</p>
      <div class="choices">
        [[Escolha A->3]]
        [[Escolha B->4]]
      </div>
    </div>
  </div>
</div>
<</nobr>>
```

- `class="animar"` faz o texto aparecer palavra a palavra.
- O botão `⟲` abre a confirmação de recomeçar; `<<back "←">>` volta à passagem anterior.
- O JavaScript envolve o conteúdo da `.text-box` em `.text-scroll` automaticamente.

### 5.2 Variáveis de estado

Todas inicializadas a `false` (ou `null`) no `StoryInit` e repostas na passagem `Start` (para novas jogadas sem recarregar a página). Se criares uma nova variável, **acrescenta-a nos dois sítios**.

`$ligou112`, `$perfeito112`, `$fez112`, `$kit`, `$kitPerfeito`, `$fezKit`, `$bobiSeguro`, `$avisouVizinhos`, `$tocouSino`, `$tocouSinoGeral`, `$entrouPanico`, `$jaEntrouPanico`, `$panicOrigin`, `$mobilidadeReduzida`, `$foiResgatado`, `$ignorouAlerta`, `$casaPreparada`, `$casaPerfeita`, `$fezCasa`, `$caminhoPerigoso`, `$naoEvacuar`, `$viuLaurinda`, `$ajudarLaurinda`, `$demorouLaurinda`, `$fezSeguranca`, `$casaSeguraFinal`, `$segurancaPerfeita`.

### 5.3 JavaScript (Story JavaScript)

O SugarCube só aceita um ficheiro JS, por isso está dividido em secções numeradas (pesquisar por `[N]`):

| Secção | Conteúdo |
|---|---|
| [1] Configuração | Constantes ajustáveis: ritmo do texto, tempos, listas de áudio por passagem, listas de imagens a pré-carregar |
| [2] Ícones | Sprite SVG (Phosphor Icons) |
| [3] Viewport e ecrã | Altura real do ecrã, bloqueio de zoom, aviso de rotação |
| [4] Acessibilidade | Gestão de foco em diálogos, ciclo de Tab |
| [5] Áudio | Pássaros, fogo, zumbido, mute em segundo plano |
| [6] Temporizadores | Temporizador de decisão e fim automático |
| [7] Toasts | Notificações no canto do ecrã |
| [8] Texto animado | Palavra a palavra + tamanho da letra |
| [9] Telemóvel | Teclado do 112 (passagem `2.1`) |
| [10] Recomeçar / Guia | Caixas `.alarm` |
| [11] Definições | Painel lateral |
| [12] Carregamento | Ecrã de carregamento e pré-carregamento de imagens |
| [13] Passagem 13 | Ajuste de altura |
| [14] Scrollbar | Barra de scroll falsa em ecrãs touch |
| [15] Eventos | `:passagestart`, `:passageend`, `:storyready` |

**Convenções:** código em ES5 (`var`, `function`) por compatibilidade; não renomear funções globais (as passagens podem chamá-las, ex.: `mostrarToast()`); texto visível em pt-PT.

**Temporizador de decisão:** corre nas passagens `7`, `8`, `13-Laurinda` e `16` (lista `TIMER_PASSAGES`). Quando esgota, o jogador entra em pânico (passagem `20`), exceto na `13-Laurinda`, que vai para a `36`. Há três modos nas definições: Normal (30 s), Alargado (60 s) e Desligado.

**Pré-carregamento de imagens:** `imagesCritical` bloqueia a barra de progresso inicial; `imagesBackground` carrega em segundo plano pela ordem das cenas.

### 5.4 Stylesheet

Também dividida em secções numeradas `[1]`–`[24]` (índice no topo do ficheiro). **A ordem dos seletores importa** (cascata CSS, muitos `!important`): não reordenar blocos sem testar. Todas as variáveis partilhadas estão num único `:root` no topo da secção [2].

### 5.5 Preferências guardadas no browser

`localStorage`: `hfna-animations` (`1`/`0`) e `hfna-timer-mode` (`normal`/`extended`/`off`).

### 5.6 Outros ficheiros e pastas

- **`manifest.json`:** reservado para a futura versão PWA (*Progressive Web App*, jogo instalável no ecrã inicial do telemóvel). Ainda não está em uso. Quando a PWA for feita, será também preciso um *service worker* e ícones, e convém repensar a cache dos recursos (as tags ajudam, ver secção 4).
- **`css/`:** não é usada em produção. O CSS do jogo vive no *Story Stylesheet* do Twine e é exportado para dentro do `jogo-dev.html`. Antes de apagar a pasta, confirmar que nada a referencia.

---

## 6. Tarefas comuns

### Adicionar uma cena nova

1. Coloca a imagem em `images/cenas/` e faz push.
2. No Stylesheet, secção [10], cria a classe da cena:
   ```css
   .minha-cena {
     background-image: url(https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/images/cenas/minha-cena.png);
   }
   ```
3. No JavaScript, secção [1], acrescenta a imagem a `imagesBackground` (ordem de aparição).
4. Cria a passagem no Twine com `<div class="image-bg minha-cena"></div>`.
5. Se a cena tem som ambiente, acrescenta o nome da passagem às listas de `BIRDS_*` e `FOGO_PROXIMIDADE`. Uma passagem que não esteja nessas listas fica sem pássaros e com o fogo no mínimo.
6. Cria uma tag nova (secção 4.4) antes de publicar.

### Adicionar um som

1. Coloca o `.mp3` em `audio/`.
2. No `StoryInit`: `<<cacheaudio "nome" "audio/nome.mp3">>`.
3. No JavaScript, secção [5]: toca-o com `SimpleAudio.tracks.get('nome').loop(false).volume(0.5).play()`.
4. Sons curtos (que devem parar ao mudar de passagem) têm de ser acrescentados a `SONS_CURTOS`.

### Adicionar um ícone

1. Vai a [phosphoricons.com](https://phosphoricons.com), escolhe o ícone e copia o `<path d="...">`.
2. Em [2] do JavaScript, acrescenta um `<symbol id="ph-NOME">` ao sprite.
3. Usa-o com `ph('NOME')`.

### Mudar o tamanho da letra

Edita apenas `fontSizes` e `readableFontSizes` no JavaScript [1]. O CSS reage através de `aplicarFonte()`.

### Adicionar um botão

- Ação normal: usa a família **MAIN** (`.choices > a`).
- "Recomeçar": família **ALERT** (`.alarm .confirm-restart a`), **sem** textura.
- Secundário: família **SECONDARY** (`.btn-sobre`).

Os tokens estão em `:root` ([2] do CSS) e o sistema de botões em [20].

### Adicionar uma variável de estado

Declara-a no `StoryInit` e repõe-a no bloco de reset de `Start` em [15.1] do JavaScript.

---

## 7. Problemas conhecidos e resolução de erros

### A Action falha

| Passo que falha | Causa provável | Solução |
|---|---|---|
| Obter a tag mais recente | Não existe nenhuma tag | Criar a tag (secção 4.4) |
| Verificar que não sobrou `@main` | Há um `@main` num formato diferente de `ha-fogo-na-aldeia@main` | Pesquisar `@main` no `jogo-dev.html` e corrigir |
| Guardar (erro 403 / permission denied) | A Action não tem permissão de escrita | Ver 4.8 |

### Imagem nova não aparece no jogo
Falta criar uma tag nova depois de adicionar a imagem (4.4). Confirma também que o nome do ficheiro coincide exatamente (o GitHub distingue maiúsculas de minúsculas).

### Conflito ao fazer push
Faltou fazer Pull. A Action alterou o `index.html` no GitHub.

### Uma imagem só falha para alguns utilizadores
Quase de certeza cache do jsDelivr. Em desenvolvimento, podes forçar a limpeza em
`https://purge.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/images/...` ou testar com `?v=N` no URL. Em produção, a solução é a tag (secção 4).

### O jogo não arranca (ecrã preto ou de carregamento infinito)
Abre a consola do browser (F12 → Console). Um `SyntaxError` no *Story JavaScript* impede **todo** o código de correr; é frequente quando falta fechar uma chave ou `});` depois de uma edição.

### Verificações úteis antes de publicar
- Pesquisar `@main` no `index.html`: **0 resultados**.
- Janela anónima + F12 → Network → filtro "Img": todos os pedidos a `@v1.0.x`, sem 404.
- Testar em telemóvel real, em retrato (o jogo bloqueia/avisa em paisagem).
- Testar com o som desligado e com os três tamanhos de letra.

---

## 8. Créditos e licença

- Coordenação por Conceição Colaço
- Coordenação artística e multimédia: Letícia Oliveira
- UX/UI Design e programação: Letícia Oliveira
- Programação: Filipa Irina Loureiro
- Ilustrações: Inês Freitas
- restantes créditos: ver passagem `Sobre` dentro do jogo (fonte de verdade).

Ícones: [Phosphor Icons](https://phosphoricons.com) (MIT). Animação da chama: Lottie (`dotlottie-wc`). Motor: [SugarCube](https://www.motion.org/sugarcube/) © Thomas Michael Edwards (BSD 2-Clause).

Licença do projeto: ver [LICENSE](./LICENSE).
