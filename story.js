/* ==========================================================================
   HÁ FOGO NA ALDEIA — Story JavaScript (SugarCube 2)
   ==========================================================================

   COMO ESTE FICHEIRO ESTÁ ORGANIZADO
   --------------------------------------------------------------------------
   O SugarCube só aceita UM ficheiro de JavaScript, por isso está dividido em
   secções numeradas. Para navegar, pesquise pelo número ou título (ex.: "[4]").

    [1]  CONFIGURAÇÃO ........ constantes que se ajustam sem mexer na lógica
    [2]  ÍCONES .............. SVGs usados nas definições e no guia
    [3]  VIEWPORT E ECRÃ ..... altura real, meta viewport, bloqueio de zoom/rotação
    [4]  ACESSIBILIDADE ...... gestão de foco em diálogos
    [5]  ÁUDIO ............... pássaros, fogo, zumbido, sons pontuais, mute em 2.º plano
    [6]  TEMPORIZADORES ...... decisão (7, 8, 13-Laurinda, 16), fim automático, agendarNaPassagem
    [7A] TOASTS .............. notificações no canto do ecrã
    [7B] CHEGADA ............. sequência do ponto de encontro
    [7C] PASSAGEM 29 ......... sirenes a desfalecer
    [8]  TEXTO ANIMADO ....... palavra a palavra + tamanho da letra
    [8B] CENAS EM SEQUÊNCIA .. esperaDeCena, aguardarCena, barra de progresso
    [9]  TELEMÓVEL (2.1) ..... teclado de marcação do 112
    [10] RECOMEÇAR / GUIA .... caixas de alerta e botão X
    [11] DEFINIÇÕES .......... botão + painel lateral
    [12] ECRÃ DE CARREGAMENTO  loading + pré-carregamento de imagens
    [13] AJUSTES DE ALTURA ... passagens 13, 19 e finais (text-box)
    [14] SCROLLBAR (touch) ... barra de scroll falsa
    [14B] CONTINUIDADE DE CAMADAS
    [14C] IMAGENS PRONTAS
    [15] EVENTOS PRINCIPAIS .. :passagestart / :passageend / :storyready

   CONVENÇÕES
   --------------------------------------------------------------------------
   - Nomes globais (var/function) NÃO devem ser renomeados: as passagens
     (Twine) podem chamá-los, por ex. mostrarToast(), Engine.play(), etc.
   - Código em ES5 (var, function) por convenção de estilo. O CSS já exige 
      :has() (Firefox 121+, Safari 15.4+), por isso o baseline real 
      é de 2023 em diante.
   - Texto visível ao jogador está em português (pt-PT).
   - Variáveis de estado do jogo (State.variables) usadas aqui:
       entrouPanico, jaEntrouPanico, panicOrigin, demorouLaurinda, foiResgatado,
       fezCasa, casaPreparada
   ========================================================================== */


/* ==========================================================================
   [1] CONFIGURAÇÃO
   ========================================================================== */
var FEATURES = { idioma: false, narracao: false };
var CAIXAS_POR_CIMA = ['Sobre', 'Guia de Jogo', '⟲'];

/* ---- Texto animado: ritmo (ms) ---- */
var WORD_MS     = 70;   // intervalo entre palavras
var PAUSE_END   = 220;  // pausa após . ! ?
var PAUSE_COMMA = 120;  // pausa após , ; :

/* ---- Tamanho da letra (4 níveis: A, A+, A++, A+++) ---- */
var fontSizes = [
  'clamp(0.85rem, 2.8vw, 1.15em)',
  'clamp(1rem, 3.2vw, 1.4em)',
  'clamp(1.15rem, 3.6vw, 1.65em)',
  'clamp(1.3rem, 4vw, 1.9em)'
];

/* Texto da página inicial (.sombrinha p.readable) */
var readableFontSizes = [
  'clamp(1.05rem, 3.2vw, 1.5rem)',
  'clamp(1.15rem, 3.4vw, 1.65rem)',
  'clamp(1.25rem, 3.7vw, 1.85rem)',
  'clamp(1.35rem, 4vw, 2.05rem)'
];

/* Multiplicadores do Guia de Jogo, por nível */
var guideScales = [1, 1.12, 1.25, 1.4];

var fontIndex = 0; // nível atual (0 a 3)

/* ---- Temporizador de decisão ---- */
var TIMER_MODES    = { normal: 30000, extended: 60000, off: 0 }; // ms
var TIMER_PASSAGES = ['7', '8', '13-Laurinda', '16'];                     // passagens com contador

/* ---- Chamada ao 112 (passagem 2.1) ----
   tempo (ms) que o telefone "toca" antes de o operador atender (passagem 2) */
var CHAMADA_112_MS = 3600;

/* ---- Fim automático ("Será o fim?") ----
   espera = ms depois de o texto terminar (duplica no modo "extended") */
var AUTO_FIM = {
  '28': { destino: '29', espera: 4500, resgatado: true },
  '34': { destino: '35', espera: 4500, minTotal: 0, resgatado: true },
  '13': { destino: '13-Laurinda', leitura: 200, minEspera: 2500, semFade: true, semVoltar: true }
};

/* ---- Som: pássaros por níveis ----
   Fora das listas, os pássaros desaparecem com fade.
   A página inicial é especial: começa em "medio" e, passado BIRDS_START_ESPERA,
   desce devagar para "muito_baixo". */
var BIRDS_VOL = { alto: 0.35, medio: 0.20, baixo: 0.08, muito_baixo: 0.03 };
var BIRDS_FADE_MS      = 1200;   // transição entre níveis
var BIRDS_START_ESPERA = 6000;   // ms na página inicial antes de começar a descer
var BIRDS_START_FADE   = 5000;   // duração da descida

var BIRDS_NIVEIS = {
  'alto':  ['1', '2.1'],
  'medio': ['3', '5'],
  'baixo': ['2', 'Resultado 112', '6']
};

/* ---- Som: volume do fogo consoante a proximidade ----
   Os volumes de cada nível estão em ajustarVolumeFogo ([5.2]).
   A passagem 27 não está aqui: tem tratamento próprio (aplicarFogoAApagar). */
var FOGO_PROXIMIDADE = {
  'muito_longe': ['15', '31', 'Resultado Casa', 'Resultado Kit', 'Resultado Segurança'],
  'longe':       ['4', '8', '9', '10', '11', '14', '19', '22', '26', '38'],
  'perto':       ['7', '12', '13', '13-Laurinda', '23', '37','36'],
  'muito_perto': ['16', '24', '25', '32', '33', '39'],
  'aqui':        ['28', '34'],
  // 'fadeout' é o comportamento por omissão; a lista fica só como documentação
  'fadeout':     ['Start', '1', '2', '2.1', 'Resultado 112', '3', '5', '6', '20', '21', '29', '35', 'Resultados']
};

/* ---- Passagens em que o fogo recua e voltam os pássaros (27, final-2, final-3) ----
   fogoVol: volume inicial do fogo (desce até 0 em fogoMs)
   passarosAntesMs: quanto antes do fim do fogo entram os pássaros
   passarosVol / passarosFadeMs: volume final e duração da entrada dos pássaros */
var FOGO_RECUA = {
  '27':      { fogoVol: 0.80, fogoMs: 6000, passarosAntesMs: 0,    passarosVol: 0.06, passarosFadeMs: 2000 },
  'final-3': { fogoVol: 0.25, fogoMs: 6000, passarosAntesMs: 1500, passarosVol: 0.08, passarosFadeMs: 3000 },
  'final-2': { fogoVol: 0.25, fogoMs: 6000, passarosAntesMs: 1500, passarosVol: 0.08, passarosFadeMs: 3000 }
};

/* ---- Som: faixas curtas que param a cada mudança de passagem ----
   (birds, fire, heartbeat e ear-ringing são contínuos e geridos à parte) */
var SONS_CURTOS = [
  'phone-tap', 'hover', 'phone', 'sinos',
  'car-stopping', 'car-start', 'cough', 'tic',
  'heavy-breathing', 'breathing-exercise', 'hospital', 'crowd',
  'porta-rebentada', 'sirene', 'radio', 'keys',
  'footsteps', 'knock'
];

/* ---- Cenas em sequência: os botões só aparecem no fim ----
   A espera de cada cena regista-se com esperaDeCena(ms), nas passagens
   (<<run esperaDeCena(5000)>>) ou no JS. Conta desde o início da passagem.
   Nas passagens de CENA_SALTAVEL (só animações CSS) um clique salta para o fim. */
var CENA_SALTAVEL = ['19', '26', '27', '28','34', '36', '38', 'final-3'];

/* Só mostra a barra de progresso se a espera restante for pelo menos isto (ms) */
var CENA_BARRA_MIN_MS = 4000;

/* ---- Chegada ao ponto de encontro ---- */
var CHEGADA_PASSOS_MS         = 4000;   // passos (só vizinhos); cortados com fade
var CHEGADA_BATER_PAUSA_MS    = 2000;   // da batida até começar o fade para preto
var CHEGADA_SIRENE_SUBIDA_MS  = 5000;   // sirene a aproximar-se (bombeiros): só um bocadinho
var CHEGADA_SIRENE_INICIO_VOL = 0.02;
var CHEGADA_SIRENE_MAX_VOL    = 0.30;
var CHEGADA_SIRENE_SAIDA_MS   = 1000;   // a sirene desvanece quando batem à porta
var CHEGADA_PRETO_MS          = 1100;    // um pouco mais que a transição do .chegada-preto (0.8s)
var CHEGADA_TIC_N             = 3;      // tics enquanto está preto (põe 1 se quiseres só um)
var CHEGADA_TIC_INTERVALO_MS  = 1000;
var CHEGADA_FOLGA_MS          = 2500;
var CHEGADA_MULTIDAO_VOL     = 0.4;
var CHEGADA_MULTIDAO_FADE_MS = 1500;
var SIRENE_34_SUBIDA_MS      = 6000;
var SIRENE_34_INICIO_VOL     = 0.02;

/* ---- Passagem 33: salvo pelos bombeiros ---- */
var SALVO_PASSOS_MS        = 4000;   // duração dos passos antes da batida
var SALVO_SIRENE_INICIO_VOL = 0.005; // quase inaudível ao início
var SALVO_SIRENE_VOL       = 0.06;   // volume final (mais baixo que antes)
var SALVO_SIRENE_SUBIDA_MS = 12000;  // sobe devagar durante a cena

/* ---- Sirene (passagens 34 e 35) ---- */
var SIRENE_34_MAX_VOL    = 0.30;   // volume quando "chega"
var SIRENE_35_VOL        = 0.30;   // volume na 35
var SIRENE_35_FADE_MS    = 2800;   // fadeout

/* ---- Passagem 29: sirenes a desfalecer ----
   A duração total (D) vem do CSS (--desf29-dur). Cada onda é
   [início, volume, duração do fade], com início e duração em fração de D.
   Os volumes sobem e descem para dar a ideia de consciência a falhar. */
var DESFALECER_SIRENE_ONDAS = [
  [0,    0.20, 0.20],
  [0.20, 0.14, 0.20],
  [0.45, 0.08, 0.20],
  [0.65, 0.04, 0.15]
];
var DESFALECER_HOSPITAL_VOL = 0.6;

/* ---- Som: passagens com batimento cardíaco e zumbido ---- */
var HEART_PASSAGES        = ['7', '8', '16', '20', '21', '13-Laurinda'];
var EAR_RINGING_PASSAGES  = ['20', '21', '28', '34', '29', '35'];

/* ---- Imagens (carregamento) ---- */
var CDN = 'https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/';
var IMG = CDN + 'images/';

/* Passagem 13: telemóvel (≤600px) só usa o painel 2; tablet/desktop os 3.
   (ver CSS .prontoevacuar-stage). Calculado uma vez no arranque. */
var IS_PHONE = window.matchMedia('(max-width: 600px)').matches;
var PRONTO_EVACUAR_IMGS = IS_PHONE
  ? [IMG + 'cenas/prontoparaevacuarbobi3.webp']
  : [
      IMG + 'cenas/prontoparaevacuar1.png',
      IMG + 'cenas/prontoparaevacuarbobi.png',
      IMG + 'cenas/prontoparaevacuar3.png',
      IMG + 'cenas/prontoparaevacuar3-fogo.png',
      IMG + 'cenas/prontoparaevacuar-3semfundo.png',
      IMG + 'cenas/prontoparaevacuar3-fuminhp.png'
    ];

/* Prioridade 1 — bloqueia a barra de progresso: ecrã inicial + 1.ª cena. */
var imagesCritical = [
  IMG + 'cenas/bg-village.webp',
  IMG + 'ui/wood.png',
  IMG + 'ui/wood-dark.png',
  IMG + 'ui/texture.png',
  IMG + 'ui/isa.png',
  IMG + 'ui/logo-ceabn.png',
  IMG + 'ui/logo.png',
  IMG + 'cenas/casa.webp',
  IMG + 'cenas/repararbefore.png',
  IMG + 'cenas/reparar.png'   // a animação .turn-around da passagem 1 troca para esta
];

/* Prioridade 2 — carrega em segundo plano depois de o jogo abrir,
   pela ordem em que as cenas aparecem. */
var imagesBackground = [
  // passagens 1–3
  IMG + 'cenas/reparar3.png',
  IMG + 'cenas/panico2.png',
  IMG + 'cenas/112before.png',
  IMG + 'cenas/112.png',
  IMG + 'cenas/casa-semjanela-jardim.webp',
  IMG + 'cenas/casafumo1.webp',
  IMG + 'cenas/phone.png',
  IMG + 'cenas/phone-call.png',
  IMG + 'cenas/vizinhos.jpg',
  IMG + 'cenas/multidao-semlaurinda.png',
  // passagens 4–8
  IMG + 'cenas/ligar.png',
  IMG + 'cenas/casa-semjanela.webp',
  IMG + 'cenas/casafumo2.webp',
  IMG + 'cenas/casa-fire.jpg',
  IMG + 'cenas/casa-ardida.jpg',
  IMG + 'cenas/avisar-vizinhos.png',
  IMG + 'cenas/sino.webp',
  IMG + 'cenas/homem-sino.png',
  IMG + 'cenas/fire-transparent.webp',
  IMG + 'cenas/casafumo3.webp',
  IMG + 'cenas/casafumo4.webp',
  // passagens 11–16
  IMG + 'cenas/car.png',
  IMG + 'cenas/estrada-impedida.webp',
  IMG + 'cenas/floresta.webp',
  IMG + 'cenas/rio.webp',
  IMG + 'cenas/casafumo5.webp',
  PRONTO_EVACUAR_IMGS,            // passagem 13 (array; é achatado no preload)
  IMG + 'cenas/kit2.webp',
  IMG + 'cenas/seguranca2.png',
  IMG + 'cenas/ignorar.png',      // passagem 16 (1.ª pose)
  IMG + 'cenas/casafumo6.webp',
  // passagens 19–39
  IMG + 'cenas/ponto-da-mulher.png',
  IMG + 'cenas/ponto-de-encontrosemfundo.webp',
  IMG + 'cenas/panico3.png',
  IMG + 'cenas/car-invert.png',
  IMG + 'cenas/ponto-de-encontro.webp',
  IMG + 'cenas/evacuar.png',
  IMG + 'cenas/multidao.png',
  IMG + 'cenas/ponto-de-encontro-fogo.webp',
  IMG + 'cenas/pontodeencontro-fumonomonte.png',
  IMG + 'cenas/pontodeencontro-fuminho.webp',
  IMG + 'cenas/pontoencontro.webp',
  IMG + 'cenas/pontodeencontro-semceu.webp',
  IMG + 'cenas/cinzas.webp',
  IMG + 'cenas/fire-forest.png',
  IMG + 'cenas/kit1.png',
  IMG + 'cenas/seguranca.webp',
  IMG + 'cenas/kit1-mobile.webp',
  IMG + 'cenas/salva-pelo-bombeiro.jpg',
  IMG + 'cenas/fogo-na-casa.webp',
  IMG + 'cenas/fogo-na-casa-overlay.png',
  IMG + 'cenas/salvar-laurinda.jpg',
  IMG + 'cenas/casa-naoardida-final.png',
  IMG + 'cenas/casa-naoardida-finallady.png'
];

/* Imagens futuras (já existem regras CSS, ainda sem passagem):
     cenas/seguranca.webp, cenas/mobilidade.jpg,
     cenas/multidao-laurindabem.png,
     cenas/prontoparaevacuar-sembobi*.png
   Quando passarem a ser usadas, acrescentar a imagesBackground. */

/* Dicas rotativas do ecrã de carregamento (10 s cada) */
var tips = [
  " Nunca faça fogueiras em dias de vento forte.",
  " Não atire fósforos para o chão.",
  " Se vir um incêndio, ligue o 112."
];

/* URL base dos ícones da app (favicon / apple-touch-icon) */
var base = 'https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/images/favicon/';

/* ---- Preferências guardadas no browser (localStorage) ----
   hfna-animations: '1' | '0'      hfna-timer-mode: normal | extended | off */
var animationsEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
try {
  var pref = localStorage.getItem('hfna-animations');
  if (pref === '0') animationsEnabled = false;
  else if (pref === '1') animationsEnabled = true;
} catch (e) {}

var timerMode = 'normal';
try {
  var savedTimerMode = localStorage.getItem('hfna-timer-mode');
  if (savedTimerMode && TIMER_MODES.hasOwnProperty(savedTimerMode)) timerMode = savedTimerMode;
} catch (e) {}

/* Duração ativa. Em modo "off" o valor é 0, por isso usa-se o "normal"
   (não é usado enquanto estiver desligado). */
var TIMER_MS = TIMER_MODES[timerMode] || TIMER_MODES.normal;


/* ==========================================================================
   [2] ÍCONES (Phosphor Icons — sprite SVG)
   --------------------------------------------------------------------------
   Todos os ícones vivem num único <svg> invisível no <body>, como <symbol>.
   Cada uso é <svg><use href="#ph-NOME"/></svg>, o que:
     - herda a cor do texto (currentColor dentro do path),
     - escala via width/height ou CSS,
     - reduz o peso total e centraliza a manutenção num só sítio.

   Para adicionar/alterar um ícone:
     1. Ir a https://phosphoricons.com
     2. Escolher o peso e copiar o <path d="..."/>
     3. Substituir o <path> do <symbol id="ph-NOME"> correspondente abaixo.
   ========================================================================== */

/* Devolve o HTML de um ícone do sprite. Tamanho e cor vêm do CSS (.ph-icon). */
function ph(nome) {
  return '<svg class="ph-icon" viewBox="0 0 256 256" aria-hidden="true" focusable="false">' +
           '<use href="#ph-' + nome + '"/>' +
         '</svg>';
}

var ICON_VOLUME_ON    = ph('speaker-high');
var ICON_VOLUME_OFF   = ph('speaker-slash');
var ICON_MIC          = ph('microphone');
var ICON_GLOBE        = ph('globe');
var ICON_FULLSCREEN   = ph('corners-out');
var ICON_ANIMATION    = ph('animation');
var ICON_GUIDE        = ph('book-open');
var ICON_FONT         = ph('text-aa');
var ICON_BACK         = ph('arrow-left');
var ICON_RESTART      = ph('arrow-counter-clockwise');
var ICON_TIMER        = ph('timer');
var ICON_FAST_FORWARD = ph('fast-forward');
var ICON_SETTINGS     = ph('gear-six');
var ICON_INFO         = ph('info');
var ICON_CLOSE        = ph('x');
var ICON_CHEVRON      = ph('caret-right');   
var ICON_BACKSPACE    = ph('backspace');

var GUIDE_ICONS = {
  info: ICON_INFO, 
  guide: ICON_GUIDE, 
  timer: ICON_TIMER,
  fast: ICON_FAST_FORWARD, 
  sound: ICON_VOLUME_ON, 
  settings: ICON_SETTINGS
};

$(document).one(':passagestart', function () {
  if (document.getElementById('ph-sprite')) return;

  $('body').append(
    '<svg id="ph-sprite" xmlns="http://www.w3.org/2000/svg" ' +
      'aria-hidden="true" focusable="false" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden">' +

      /* --- Áudio --- */
      '<symbol id="ph-speaker-high" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Zm54-106.08a40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,0,1,12-10.58ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/>' +
      '</symbol>' +
      '<symbol id="ph-speaker-slash" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M53.92,34.62A8,8,0,1,0,42.08,45.38L73.55,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V175.09l42.08,46.29a8,8,0,1,0,11.84-10.76ZM32,96H72v64H32ZM144,207.64,88,164.09V95.89l56,61.6Zm42-63.77a24,24,0,0,0,0-31.72,8,8,0,1,1,12-10.57,40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.59Zm-80.16-76a8,8,0,0,1,1.4-11.23l39.85-31A8,8,0,0,1,160,32v74.83a8,8,0,0,1-16,0V48.36l-26.94,21A8,8,0,0,1,105.84,67.91ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/>' +
      '</symbol>' +

      /* --- Definições --- */
      '<symbol id="ph-microphone" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V240a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z"/>' +
      '</symbol>' +
      '<symbol id="ph-globe" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm87.62,96H175.79C174,83.49,159.94,57.67,148.41,42.4A88.19,88.19,0,0,1,215.63,120ZM96.23,136h63.54c-2.31,41.61-22.23,67.11-31.77,77C118.45,203.1,98.54,177.6,96.23,136Zm0-16C98.54,78.39,118.46,52.89,128,43c9.55,9.93,29.46,35.43,31.77,77Zm11.36-77.6C96.06,57.67,82,83.49,80.21,120H40.37A88.19,88.19,0,0,1,107.59,42.4ZM40.37,136H80.21c1.82,36.51,15.85,62.33,27.38,77.6A88.19,88.19,0,0,1,40.37,136Zm108,77.6c11.53-15.27,25.56-41.09,27.38-77.6h39.84A88.19,88.19,0,0,1,148.41,213.6Z"/>' +
      '</symbol>' +
      '<symbol id="ph-animation" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm104,56H40a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Zm112-24a8,8,0,0,1-3.76,6.78l-64,40A8,8,0,0,1,168,200V120a8,8,0,0,1,12.24-6.78l64,40A8,8,0,0,1,248,160Zm-23.09,0L184,134.43v51.14Z"/>' +
      '</symbol>' +
      '<symbol id="ph-text-aa" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M87.24,52.59a8,8,0,0,0-14.48,0l-64,136a8,8,0,1,0,14.48,6.81L39.9,160h80.2l16.66,35.4a8,8,0,1,0,14.48-6.81ZM47.43,144,80,74.79,112.57,144ZM200,96c-12.76,0-22.73,3.47-29.63,10.32a8,8,0,0,0,11.26,11.36c3.8-3.77,10-5.68,18.37-5.68,13.23,0,24,9,24,20v3.22A42.76,42.76,0,0,0,200,128c-22.06,0-40,16.15-40,36s17.94,36,40,36a42.73,42.73,0,0,0,24-7.25,8,8,0,0,0,16-.75V132C240,112.15,222.06,96,200,96Zm0,88c-13.23,0-24-9-24-20s10.77-20,24-20,24,9,24,20S213.23,184,200,184Z"/>' +
      '</symbol>' +
      '<symbol id="ph-gear-six" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"/>' +
      '</symbol>' +
      '<symbol id="ph-corners-out" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M200,80v32a8,8,0,0,1-16,0V88H160a8,8,0,0,1,0-16h32A8,8,0,0,1,200,80ZM96,168H72V144a8,8,0,0,0-16,0v32a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Z"/>' +
      '</symbol>' +
      '<symbol id="ph-timer" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"/>' +
      '</symbol>' +

      /* --- Navegação --- */
      '<symbol id="ph-arrow-left" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>' +
      '</symbol>' +
      '<symbol id="ph-arrow-counter-clockwise" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z"/>' +
      '</symbol>' +
      '<symbol id="ph-x" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>' +
      '</symbol>' +

      /* --- Guia --- */
      '<symbol id="ph-book-open" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24Zm-8,160H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40H200Z"/>' +
      '</symbol>' +
      '<symbol id="ph-info" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/>' +
      '</symbol>' +
      '<symbol id="ph-fast-forward" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M248.67,114.66,160.48,58.5A15.91,15.91,0,0,0,136,71.84v37.3L56.48,58.5A15.91,15.91,0,0,0,32,71.84V184.16A15.92,15.92,0,0,0,56.48,197.5L136,146.86v37.3a15.92,15.92,0,0,0,24.48,13.34l88.19-56.16a15.8,15.8,0,0,0,0-26.68ZM48,183.94V72.07L135.82,128Zm104,0V72.07L239.82,128Z"/>' +
      '</symbol>' +

      /* --- Telemóvel --- */
      '<symbol id="ph-backspace" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M216,40H68.53a16.08,16.08,0,0,0-13.72,7.77L9.14,123.88a8,8,0,0,0,0,8.24l45.67,76.11A16.08,16.08,0,0,0,68.53,216H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM61.67,204.12,68.53,200h0ZM216,200H68.53l-43.2-72,43.2-72H216ZM106.34,146.34,124.69,128l-18.35-18.34a8,8,0,0,1,11.32-11.32L136,116.69l18.34-18.35a8,8,0,0,1,11.32,11.32L147.31,128l18.35,18.34a8,8,0,0,1-11.32,11.32L136,139.31l-18.34,18.35a8,8,0,0,1-11.32-11.32Z"/>' +
      '</symbol>' +

      /* --- Uso geral / toasts / ecrã de rotação --- */
      '<symbol id="ph-caret-right" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>' +
      '</symbol>' +
      '<symbol id="ph-device-rotate" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16Zm8,200a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8ZM140,60a12,12,0,1,1-12-12A12,12,0,0,1,140,60Z"/>' +
      '</symbol>' +
      '<symbol id="ph-warning" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"/>' +
      '</symbol>' +
      '<symbol id="ph-check-circle" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>' +
      '</symbol>' +
      '<symbol id="ph-medal" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M216,96A88,88,0,1,0,72,163.83V240a8,8,0,0,0,11.58,7.16L128,225l44.43,22.21A8.07,8.07,0,0,0,176,248a8,8,0,0,0,8-8V163.83A87.85,87.85,0,0,0,216,96ZM56,96a72,72,0,1,1,72,72A72.08,72.08,0,0,1,56,96ZM168,227.06l-36.43-18.21a8,8,0,0,0-7.16,0L88,227.06V174.37a87.89,87.89,0,0,0,80,0ZM128,152A56,56,0,1,0,72,96,56.06,56.06,0,0,0,128,152Zm0-96A40,40,0,1,1,88,96,40,40,0,0,1,128,56Z"/>' +
      '</symbol>' +  

      /* --- Toasts: ícones de conquista / bom --- */
      '<symbol id="ph-bell" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M224,71.1a8,8,0,0,1-10.78-3.42,94.13,94.13,0,0,0-33.46-36.91,8,8,0,1,1,8.54-13.54,111.46,111.46,0,0,1,39.12,43.09A8,8,0,0,1,224,71.1ZM35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.54A111.46,111.46,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Zm186.1,103.94A16,16,0,0,1,208,200H167.2a40,40,0,0,1-78.4,0H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94ZM150.62,200H105.38a24,24,0,0,0,45.24,0ZM208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z"/>' +
      '</symbol>' +

      '<symbol id="ph-house" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z"/>' +
      '</symbol>' +

      '<symbol id="ph-acalmar" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M72,144H32a8,8,0,0,1,0-16H67.72l13.62-20.44a8,8,0,0,1,13.32,0l25.34,38,9.34-14A8,8,0,0,1,136,128h24a8,8,0,0,1,0,16H140.28l-13.62,20.44a8,8,0,0,1-13.32,0L88,126.42l-9.34,14A8,8,0,0,1,72,144ZM178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,.75,0,1.5,0,2.25a8,8,0,1,0,16-.5c0-.58,0-1.17,0-1.75A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46c0,53.61-77.76,102.15-96,112.8-10.83-6.31-42.63-26-66.68-52.21a8,8,0,1,0-11.8,10.82c31.17,34,72.93,56.68,74.69,57.63a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40Z"/>' +
      '</symbol>' +

      '<symbol id="ph-phone" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M146.34,109.66a8,8,0,0,1,0-11.32L180.69,64H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8V96a8,8,0,0,1-16,0V75.31l-34.34,34.35a8,8,0,0,1-11.32,0Zm77.54,73.42A56.26,56.26,0,0,1,168,232C88.6,232,24,167.4,24,88A56.26,56.26,0,0,1,72.92,32.12a16,16,0,0,1,16.62,9.51l21.12,47.16,0,.12A16,16,0,0,1,109.39,104c-.18.27-.37.52-.57.77L88,129.45c7.49,15.22,23.41,31,38.83,38.51l24.34-20.71a8.12,8.12,0,0,1,.75-.56,15.93,15.93,0,0,1,15.17-1.4l.13.06,47.11,21.11A16,16,0,0,1,223.88,183.08Zm-15.88-2s-.07,0-.11,0h0l-47-21.06-24.35,20.72a8.44,8.44,0,0,1-.74.56,16,16,0,0,1-15.75,1.14c-18.73-9.05-37.4-27.58-46.46-46.11a16,16,0,0,1,1-15.7,6.13,6.13,0,0,1,.57-.77L96,95.15l-21-47a.61.61,0,0,1,0-.12A40.2,40.2,0,0,0,40,88,128.14,128.14,0,0,0,168,216,40.21,40.21,0,0,0,208,181.07Z"/>' +
      '</symbol>' +

      '<symbol id="ph-backpack" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M168,40.58V32A24,24,0,0,0,144,8H112A24,24,0,0,0,88,32v8.58A56.09,56.09,0,0,0,40,96V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V96A56.09,56.09,0,0,0,168,40.58ZM112,24h32a8,8,0,0,1,8,8v8H104V32A8,8,0,0,1,112,24Zm56,136H88v-8a8,8,0,0,1,8-8h64a8,8,0,0,1,8,8ZM88,176h48v8a8,8,0,0,0,16,0v-8h16v40H88Zm112,40H184V152a24,24,0,0,0-24-24H96a24,24,0,0,0-24,24v64H56V96A40,40,0,0,1,96,56h64a40,40,0,0,1,40,40V216ZM152,88a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,88Z"/>' +
      '</symbol>' +

      '<symbol id="ph-fire" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M143.38,17.85a8,8,0,0,0-12.63,3.41l-22,60.41L84.59,58.26a8,8,0,0,0-11.93.89C51,87.53,40,116.08,40,144a88,88,0,0,0,176,0C216,84.55,165.21,36,143.38,17.85ZM128,216a72.08,72.08,0,0,1-72-72c0-22,8.09-44.79,24.06-67.84l26.37,25.58a8,8,0,0,0,13.09-3l22.27-61.07C164.21,58.08,200,97.91,200,144A72.08,72.08,0,0,1,128,216Z"/>' +
      '</symbol>' +

      '<symbol id="ph-tree" viewBox="0 0 256 256">' +
        '<path fill="currentColor" d="M230.32,187.09l-46-59.09H208a8,8,0,0,0,6.34-12.88l-80-104a8,8,0,0,0-12.68,0l-80,104A8,8,0,0,0,48,128H71.64l-46,59.09A8,8,0,0,0,32,200h88v40a8,8,0,0,0,16,0V200h88a8,8,0,0,0,6.32-12.91ZM48.36,184l46-59.09A8,8,0,0,0,88,112H64.25L128,29.12,191.75,112H168a8,8,0,0,0-6.31,12.91L207.64,184Z"/>' +
      '</symbol>' +

    '</svg>'
  );
});

/* ==========================================================================
   [3] VIEWPORT E ECRÃ
   ========================================================================== */

/* ---- 3.1 Altura real do ecrã ----
   Corrige bugs de 100vh/100dvh em Android (a barra de navegação do sistema
   nem sempre é bem calculada). O valor fica em --app-height (usado no CSS). */
function setAppHeight() {
  var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', vh + 'px');
}

setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', function () {
  setTimeout(setAppHeight, 300); // dá tempo à UI do browser para estabilizar
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight);
}

/* ---- 3.2 Meta viewport ----
   Bloqueia zoom; viewport-fit=cover permite usar as safe-areas no CSS. */
(function () {
  var VIEWPORT_CONTENT =
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, ' +
    'user-scalable=no, viewport-fit=cover';

  if (!document.querySelector('meta[name="viewport"]')) {
    $('<meta name="viewport" content="' + VIEWPORT_CONTENT + '">').appendTo('head');
  } else {
    $('meta[name="viewport"]').attr('content', VIEWPORT_CONTENT);
  }
})();

/* ---- 3.3 Favicons ---- */
$('<link rel="apple-touch-icon" sizes="180x180" href="' + base + 'apple-touch-icon.png">').appendTo('head');
$('<link rel="icon" type="image/png" sizes="32x32" href="' + base + 'favicon-32x32.png">').appendTo('head');
$('<link rel="icon" type="image/png" sizes="16x16" href="' + base + 'favicon-16x16.png">').appendTo('head');


/* ---- 3.4 Bloqueio de zoom (necessário no iOS Safari) ---- */

// Pinch-zoom (2+ dedos)
document.addEventListener('touchmove', function (e) {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Gestos nativos do Safari
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (evt) {
  document.addEventListener(evt, function (e) { e.preventDefault(); }, { passive: false });
});

// Double-tap zoom
var lastTouchEnd = 0;
document.addEventListener('touchend', function (e) {
  var now = Date.now();
  var isControl = e.target.closest &&
    e.target.closest('.phone-key, .phone-call, #phone-backspace, button, a, input, select');
  if (!isControl && now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// Pinch do touchpad / Ctrl + roda do rato (desktop)
window.addEventListener('wheel', function (e) {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

/* ---- 3.5 Bloqueio do modo paisagem ----
   Tenta bloquear a orientação via API; se não for possível, o CSS mostra
   .rotate-overlay quando o ecrã está em paisagem. */
function tentarBloquearOrientacao() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(function () { /* não suportado: ignora */ });
  }
}

/* Cria o aviso "Rode o dispositivo" (visibilidade controlada pelo CSS). */
function criarAvisoDeRotacao() {
  if ($('.rotate-overlay').length) return;

  var $rotate = $(
    '<div class="rotate-overlay">' +
      '<div class="rotate-content">' +
        '<div class="rotate-message">' +
          '<div class="rotate-icon">' + ph('device-rotate') + '</div>' +
          '<p class="rotate-text">Rode o dispositivo para a posição vertical</p>' +
          '<p class="rotate-sub">— Melhor experiência em modo retrato —</p>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  $('body').append($rotate);
}


/* ==========================================================================
   [4] ACESSIBILIDADE
   ========================================================================== */

/* ---- 4.1 Gestão de foco em diálogos modais ----
   Aplica-se a [role="dialog"][aria-modal="true"]:
   - ao abrir: guarda o elemento que abriu e foca o 1.º elemento focável;
   - Tab fica "preso" dentro do diálogo ativo;
   - ao fechar: devolve o foco ao elemento que abriu.
   Exposto em window.__a11yOpenDialog / __a11yCloseDialog para os restantes
   módulos (definições e alertas). */
(function () {
  var FOCUSABLE_SEL =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  var lastTrigger = null;

  function getFocusables(root) {
    return $(root).find(FOCUSABLE_SEL).filter(function () {
      return $(this).is(':visible') && $(this).css('visibility') !== 'hidden';
    });
  }

  function focusInto(root) {
    var $els = getFocusables(root);
    var $target = $els.length ? $els.first() : $(root);
    $target.focus();
  }

  function trapTab(e, root) {
    var $els = getFocusables(root);
    if ($els.length < 2) return;
    var first = $els[0];
    var last  = $els[$els.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDialog($dialog) {
    lastTrigger = document.activeElement;
    focusInto($dialog[0]);
  }

  function closeDialog() {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  }

  window.__a11yOpenDialog  = openDialog;
  window.__a11yCloseDialog = closeDialog;

  // Trap de Tab: só quando há um modal visível
  $(document).on('keydown.a11y-trap', function (e) {
    if (e.key !== 'Tab') return;

    var $active = $('[role="dialog"][aria-modal="true"]').filter(function () {
      // o painel de definições fechado continua "visível" (só tem opacity 0)
      if (this.id === 'settings-overlay' && !$(this).hasClass('open')) return false;
      return $(this).is(':visible') && $(this).css('visibility') !== 'hidden';
    }).first();

    if (!$active.length) return;
    trapTab(e, $active[0]);
  });
})();

/* ==========================================================================
   [5] ÁUDIO
   Faixas definidas no StoryInit/ficheiros de áudio (SimpleAudio):
     contínuas: birds, fire, heartbeat, ear-ringing
     curtas:    ver SONS_CURTOS
   ========================================================================== */

/* ---- Estado do áudio ---- */
var birdsStarted = false;                 // evita iniciar os pássaros duas vezes
var earRinging21FadeIniciado = false;     // o fade longo da passagem 21 só corre uma vez
var silenciadoAutomaticamente = false;    // mute por jogo em segundo plano

/* ---- 5.1 Pássaros ----
   Contínuo, com continuidade entre passagens. Volume: exterior 0.8,
   interior 0.5. 'fadeout' faz fade de 1 s e pára. */
var birdsStartTimer = null;   // temporizador da descida na página inicial

function ajustarVolumeBirds(nivel) {
  var birds = SimpleAudio.tracks.get('birds');
  if (!birds) return;

  if (nivel === 'fadeout') {
    if (birds.isPlaying()) fadeTrack('birds', 0, 1000);
    return;
  }

  var vol = BIRDS_VOL[nivel];
  if (!birds.isPlaying()) {
    birds.loop(true).volume(vol).play();
  } else {
    fadeTrack('birds', vol, BIRDS_FADE_MS);   // transição suave entre níveis
  }
}

/* Arranca os pássaros (1.ª vez). Se o browser bloquear o autoplay,
   volta a permitir nova tentativa. */
function TocarBirds() {
  if (birdsStarted) return;
  var birds = SimpleAudio.tracks.get('birds');
  if (!birds) return;

  birdsStarted = true;
  var p = birds.loop(true).volume(BIRDS_VOL.medio).play();

  if (p && typeof p.catch === 'function') {
    p.catch(function () { birdsStarted = false; });
  }
}

/* ---- 5.2 Fogo ----
   Contínuo (nunca pára); só o volume muda, com fade de 0.8 s. */
function ajustarVolumeFogo(nivel, duracaoMs) {
  var fire = getTrack('fire');
  if (!fire) return;

  if (!fire.isPlaying()) {
    fire.loop(true).volume(0.001);
    var p = fire.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }

  // Nunca chega a 0 literal: a lib trataria como "parado" e reiniciaria a faixa
  var volumes = {
    'muito_longe': 0.05, 'longe': 0.18, 'perto': 0.38,
    'muito_perto': 0.62, 'aqui': 0.85, 'fadeout': 0.001
  };
  var vol = volumes[nivel] !== undefined ? volumes[nivel] : 0.001;
  fadeTrack('fire', vol, duracaoMs || 800);
}

/* ---- 5.3 Zumbido nos ouvidos (ear-ringing) ---- */
/* play() devolve uma Promise; ignora o AbortError (play interrompido por
   um stop/pause logo a seguir) e regista os restantes erros. */
function tocarEarRingingSeguro(track) {
  var p = track.play();
  if (p && typeof p.catch === 'function') {
    p.catch(function (err) {
      if (err && err.name === 'AbortError') {
        console.log('[ear-ringing] play() interrompido (AbortError) — ignorado.');
      } else {
        console.warn('[ear-ringing] erro inesperado ao dar play:', err);
      }
    });
  }
}

/* ---- Fade genérico (não usa track.fade, que tem outra assinatura) ---- */
var trackFades = {};

function getTrack(id) {
  var t = SimpleAudio.tracks.get(id);
  if (!t) console.warn('[áudio] faixa em falta:', id);
  return t;
}

/* Toca uma faixa curta/contínua; ignora faixas em falta e promessas rejeitadas. */
function tocarSom(id, vol, loop) {
  var t = getTrack(id);
  if (!t) return null;
  t.loop(!!loop).volume(vol);
  var p = t.play();
  if (p && typeof p.catch === 'function') p.catch(function () {});
  return t;
}

function cancelarFade(id) {
  if (trackFades[id]) { clearInterval(trackFades[id]); trackFades[id] = null; }
}

/* Muda o volume até "to" em "ms". Se to <= 0, pára a faixa no fim. */
function fadeTrack(id, to, ms) {
  var track = SimpleAudio.tracks.get(id);
  if (!track) return;
  if (trackFades[id]) { clearInterval(trackFades[id]); trackFades[id] = null; }

  var from = track.volume();
  var steps = Math.max(1, Math.round(ms / 50));
  var i = 0;
  trackFades[id] = setInterval(function () {
    i++;
    var v = from + (to - from) * (i / steps);
    track.volume(Math.max(0.001, Math.min(1, v)));
    if (i >= steps) {
      clearInterval(trackFades[id]);
      trackFades[id] = null;
      if (to <= 0) track.stop(); else track.volume(to);
    }
  }, 50);
}

function cancelarFadesCurtos() {
  for (var id in trackFades) {
    if (trackFades[id]) { clearInterval(trackFades[id]); trackFades[id] = null; }
  }
}

/* ---- 5.4 Regras de áudio por passagem (chamadas em :passagestart) ---- */

/* Pára os sons curtos ao mudar de passagem. */
function pararSonsCurtos(name) {
  cancelarFadesCurtos();
  SONS_CURTOS.forEach(function (id) {
    if (id === 'sirene' && name === '35') return;   // continuidade 34 → 35
    var track = SimpleAudio.tracks.get(id);
    if (track) track.stop();
  });
}

function aplicarSomBirds(name) {
  // Página inicial: começa médio e, ao fim de uns segundos, desce para muito baixo
  if (name === 'Start') {
    ajustarVolumeBirds('medio');
    agendarNaPassagem(BIRDS_START_ESPERA, function () {
      fadeTrack('birds', BIRDS_VOL.muito_baixo, BIRDS_START_FADE);
    });
    return;
  }
  for (var nivel in BIRDS_NIVEIS) {
    if (BIRDS_NIVEIS[nivel].indexOf(name) > -1) {
      ajustarVolumeBirds(nivel);
      return;
    }
  }
  ajustarVolumeBirds('fadeout');
}

/* Fogo: nível de proximidade conforme FOGO_PROXIMIDADE. */
function aplicarSomFogo(name) {
  if (FOGO_RECUA[name]) return;   // tratada em aplicarFogoARecuar
  for (var nivel in FOGO_PROXIMIDADE) {
    if (FOGO_PROXIMIDADE[nivel].indexOf(name) > -1) {
      ajustarVolumeFogo(nivel);
      return;
    }
  }
  ajustarVolumeFogo('fadeout'); // não listada: volume mínimo
}

/* Fogo a apagar-se → pássaros a entrar (27, final-2, final-3; ver FOGO_RECUA) */
function aplicarFogoARecuar(name) {
  var cfg = FOGO_RECUA[name];
  if (!cfg) return;

  var fogo = getTrack('fire');
  if (fogo) fogo.volume(cfg.fogoVol);
  ajustarVolumeFogo('fadeout', cfg.fogoMs);

  agendarNaPassagem(cfg.fogoMs - cfg.passarosAntesMs, function () {
    var birds = getTrack('birds');
    if (!birds) return;
    birds.loop(true).volume(0.001);
    var p = birds.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
    fadeTrack('birds', cfg.passarosVol, cfg.passarosFadeMs);
  });
}

/* Tempos da passagem 34 (partilhados entre o áudio e a espera da cena) */
function temposPassagem34() {
  var durMs = lerDuracaoCss('--fim34-dur', 24000);
  return {
    sireneInicio: animationsEnabled ? Math.round(durMs * 0.55) : 500,   // 55% = 1.º preto total (.fumo-preto)
    subida:       animationsEnabled ? SIRENE_34_SUBIDA_MS : 4000
  };
}

/* Esperas de cena: os botões só aparecem depois disto (ver [8B]) */
function registarEsperasDaPassagem(name) {
  if (name === '28') esperaDeCena(animationsEnabled ? 6500 : 0);   // fogo-floresta + fogo-aparece
  if (name === '34') {
    var t = temposPassagem34();
    esperaDeCena(t.sireneInicio + t.subida + 800);   // +800 ms: pausa depois do som
  }
}

/* Sons pontuais, por ordem de passagem. */
function aplicarSonsPontuais(name) {

  // ---- Contínuos entre passagens ----
  if (name !== '12') {                                   // rádio: fade-out ao sair da 12
    var radioOff = SimpleAudio.tracks.get('radio');
    if (radioOff && radioOff.isPlaying()) fadeTrack('radio', 0, 800);
  }
  var heartbeat = SimpleAudio.tracks.get('heartbeat');   // batimento: só em HEART_PASSAGES
  if (heartbeat) {
    if (HEART_PASSAGES.indexOf(name) > -1) {
      if (!heartbeat.isPlaying()) heartbeat.loop(true).volume(0.1).play();
    } else if (heartbeat.isPlaying()) {
      heartbeat.stop();
    }
  }

  // ---- Por passagem ----
  if (name === '4') {                                    // tosse única, fumo ligeiro
    agendarNaPassagem(1500, function () { tocarSom('cough', 0.2); });
  }
  if (name === '5')  tocarSom('phone', 0.5);             // (na 2.1 toca ao ligar; ver [9.4])
  if (name === '6')  tocarSom('sinos', 0.3);
  if (name === '11') tocarSom('car-stopping', 0.6);
  if (name === '12') tocarSom('radio', 0.2);
  if (name === '13') tocarSom('keys', 0.5);
  if (name === '13-Laurinda') tocarSom('car-start', 0.6);

  if (name === '16') {                                   // fumo nv4 + proteção civil bate à porta
    tocarSom('cough', 0.6, true);
    agendarNaPassagem(2200, function () { tocarSom('knock', 0.7); });
  }

  if (name === '20') {                                   // pânico
    earRinging21FadeIniciado = false;
    agendarNaPassagem(1400, function () { tocarSom('heavy-breathing', 0.5, true); });
  }
  if (name === '21') tocarSom('breathing-exercise', 0.5);
  if (name === '22') tocarSom('car-start', 0.6);
  if (name === '26') tocarSom('crowd', 0.6, true);

  if (name === '28') {                                   // fumo muito perto
    tocarSom('heavy-breathing', 0.5, true);
    tocarSom('cough', 0.3, true);
  }

  // 29 e 35 com animações ligadas: tratadas em sequenciaDesfalecer ([7C])
  if ((name === '29' || name === '35') && duracaoDesfalecer() === 0) {
    tocarSom('hospital', 0.6);
    agendarNaPassagem(1500, function () { tocarSom('breathing-exercise', 0.5); });

    if (name === '35') {
      var LUZES_MS = 3000;   // duração das luzes com animações desligadas
      var sirene35 = getTrack('sirene');
      if (sirene35) {
        if (!sirene35.isPlaying()) sirene35.loop(true).volume(0.1).play();
        fadeTrack('sirene', SIRENE_35_VOL, 1200);
        agendarNaPassagem(LUZES_MS - SIRENE_35_FADE_MS, function () {
          fadeTrack('sirene', 0, SIRENE_35_FADE_MS);     // desvanece com as luzes
        });
      }
    }
  }

  if (name === '33') {                                   // sirene a aproximar-se + passos → batida
    var t0 = 300;
    var sirene33 = getTrack('sirene');
    if (sirene33) {
      sirene33.loop(true).volume(SALVO_SIRENE_INICIO_VOL).play();
      fadeTrack('sirene', SALVO_SIRENE_VOL, SALVO_SIRENE_SUBIDA_MS);
    }
    agendarNaPassagem(t0, function () { tocarSom('footsteps', 0.5); });
    agendarNaPassagem(t0 + SALVO_PASSOS_MS - 500, function () { fadeTrack('footsteps', 0, 500); });
    agendarNaPassagem(t0 + SALVO_PASSOS_MS, function () { tocarSom('knock', 0.7); });
  }

  if (name === '34') {                                   // preto → sirene ao longe → porta a rebentar
    tocarSom('heavy-breathing', 0.5, true);
    var d34 = temposPassagem34();
    agendarNaPassagem(d34.sireneInicio, function () {
      var sirene = getTrack('sirene');
      if (!sirene) return;
      sirene.loop(true).volume(SIRENE_34_INICIO_VOL).play();
      fadeTrack('sirene', SIRENE_34_MAX_VOL, d34.subida);
    });
    agendarNaPassagem(d34.sireneInicio + d34.subida, function () { tocarSom('porta-rebentada', 0.85); });
  }

  if (name === '37') {                                   // bate à porta da D. Laurinda
    agendarNaPassagem(400, function () { tocarSom('knock', 0.7); });
  }

  if (name === '39') {                                   // fumo preto → tosse → respira fundo
    tocarSom('cough', 0.5, true);
    agendarNaPassagem(4800, function () { fadeTrack('cough', 0, 1500); });
    agendarNaPassagem(5500, function () { tocarSom('breathing-exercise', 0.5); });   // ~34% de 16 s
  }
}

/* Zumbido: gerido à parte para dar continuidade entre passagens
   (ex.: 20 → 21 não reinicia o som). */
function aplicarSomEarRinging(name) {
  var track = getTrack('ear-ringing');
  if (!track) return;

  if (name === '21') {
    // Volume baixo e fade-out lento até desaparecer
    if (!track.isPlaying()) {
      track.loop(true).volume(0.05);
      tocarEarRingingSeguro(track);
    } else {
      cancelarFade('ear-ringing');
      track.volume(0.05);
    }
    if (!earRinging21FadeIniciado) {
      earRinging21FadeIniciado = true;
      agendarNaPassagem(1500, function () { fadeTrack('ear-ringing', 0, 15000); });
    }

  } else if (EAR_RINGING_PASSAGES.indexOf(name) > -1) {
    // 20 / 28 / 34 / 29 / 35: entrada suave
    if (!track.isPlaying()) {
      track.loop(true).volume(0.001);
      tocarEarRingingSeguro(track);
      fadeTrack('ear-ringing', 0.10, 1500);
    } else {
      fadeTrack('ear-ringing', 0.10, 500);
    }

  } else {
    cancelarFade('ear-ringing');
    if (track.isPlaying()) track.stop();
  }
}

/* ---- 5.5 Silenciar em segundo plano ----
   Silencia quando o jogo deixa de estar visível (separador, minimizar,
   trocar de app, ecrã bloqueado) e volta a ligar ao regressar.
   Não mexe no botão de som: se a pessoa tinha silenciado, continua assim. */
function atualizarSomPorVisibilidade() {
  var escondido = document.hidden;
  var silenciadoPeloUtilizador = $('#sound-btn').hasClass('muted');

  if (escondido && !silenciadoPeloUtilizador && !silenciadoAutomaticamente) {
    silenciadoAutomaticamente = true;
    SimpleAudio.mute(true);
  } else if (!escondido && silenciadoAutomaticamente) {
    silenciadoAutomaticamente = false;
    if (!$('#sound-btn').hasClass('muted')) SimpleAudio.mute(false);
  }
}

document.addEventListener('visibilitychange', atualizarSomPorVisibilidade);
window.addEventListener('pagehide', function () {   // iOS/Safari: ao sair da página
  if (!silenciadoAutomaticamente && !$('#sound-btn').hasClass('muted')) {
    silenciadoAutomaticamente = true;
    SimpleAudio.mute(true);
  }
});
window.addEventListener('pageshow', function () {
  if (!document.hidden) atualizarSomPorVisibilidade();
});
// Se o jogo abrir já em segundo plano (ex.: link aberto num novo separador)
$(document).one(':storyready', atualizarSomPorVisibilidade);

/* ---- 5.6 Sons de interface ---- */

// Teclas do telemóvel (2.1)
$(document).on('click', '.phone-key', function () { tocarSom('phone-tap', 0.3); });

// Som de clique nas linhas do caderno
$(document).on('click', '.notebook .nb-row', function () { tocarSom('hover', 0.3); });

/* ---- 5.7 Botão de som (canto superior esquerdo) ----
   Criado na 1.ª passagem. O painel de definições comanda este botão
   via .trigger('click') (ver setMute em [11]). */
$(document).one(':passagestart', function () {
  var $btn = $(
    '<button id="sound-btn" aria-label="Desligar som">' +
      '<span class="sound-btn-icon">' + ICON_VOLUME_ON + '</span>' +
    '</button>'
  );
  $('body').append($btn);

  $btn.on('click', function () {
    var mute = !$btn.hasClass('muted');
    SimpleAudio.mute(mute);
    $btn.toggleClass('muted', mute)
        .attr('aria-label', mute ? 'Ligar som' : 'Desligar som');
  });
});

/* ==========================================================================
   [6] TEMPORIZADORES
   --------------------------------------------------------------------------
   6A. Temporizador de decisão (passagens 7, 8, 13-Laurinda e 16”)
       - só começa a contar quando o texto e os botões já apareceram;
       - pára com o jogo em segundo plano, definições/sair abertos;
       - retoma com o tempo que restava (não recomeça);
       - ao esgotar → pânico (passagem 20), exceto na 13-Laurinda (→ 36);
       - depois do 1.º pânico deixa de ser usado (exceto na 13).
   6B. Fim automático ("Será o fim?", passagens 28 e 34)
   ========================================================================== */

/* ---- Estado do temporizador de decisão ---- */
var passageTextDone = false;   // texto da passagem atual já terminou de aparecer
var decisionTimer = null;      // setTimeout do fim do tempo
var countdownInterval = null;  // setInterval que atualiza o visual
var timerPassage = null;       // passagem a que o temporizador pertence
var timerRemaining = TIMER_MS; // ms que faltam (guardado enquanto está parado)
var timerEndTime = null;       // instante de fim (só enquanto está a correr)
var timerRunning = false;
var timerTextReady = false;    // true quando texto + botões já apareceram
var timerLastSecs = null;      // último segundo mostrado (para o "tic")

/* ms que faltam, esteja o relógio a correr ou parado */
function timerMsLeft() {
  return timerRunning ? Math.max(0, timerEndTime - Date.now()) : timerRemaining;
}

/* Metade do tempo: a partir daqui o contador fica vermelho e o "tic" mais forte */
function timerWarnSecs() { return Math.ceil(TIMER_MS / 2000); }

/* Atualiza o número e a cor do contador */
function renderTimer() {
  var $t = $('#decision-timer');
  if (!$t.length) return;
  var secs = Math.ceil(timerMsLeft() / 1000);
  $t.text(secs).toggleClass('urgente', secs <= timerWarnSecs());
}

/* Cria o círculo do contador. Tamanho/posição por largura do ecrã
   (em ≤768px o CSS sobrepõe com !important; ver #decision-timer). */
function criarTimerUI() {
  $('#decision-timer').remove();
  $('body').append('<div id="decision-timer"></div>');
  renderTimer();
}

/* Pára o relógio mas guarda o tempo que restava (o visual fica parado). */
function pauseTimer() {
  if (timerRunning) {
    timerRemaining = Math.max(0, timerEndTime - Date.now());
    timerRunning = false;
  }
  timerEndTime = null;
  if (decisionTimer)     { clearTimeout(decisionTimer);      decisionTimer = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  var tic = SimpleAudio.tracks.get('tic');
  if (tic) tic.stop();
  renderTimer();
}

/* Apaga tudo: usado ao sair das passagens com temporizador ou ao recomeçar. */
function resetTimer() {
  pauseTimer();
  timerPassage = null;
  timerRemaining = TIMER_MS;
  timerTextReady = false;
  $('#decision-timer').remove();
}

/* O relógio deve estar a correr agora? */
function timerShouldRun() {
  return timerPassage !== null
    && timerTextReady
    && !document.hidden
    && !$('#settings-overlay').hasClass('open')
    && State.variables.entrouPanico !== true
    && passage() === timerPassage;
}

/* Depois do 1.º pânico o temporizador deixa de ser usado
   (exceto na 13, que não leva a pânico). */
function temporizadorPermitido(p) {
  if (State.variables.entrouPanico === true) return false;
  if (State.variables.jaEntrouPanico === true && p !== '13-Laurinda') return false;
  return true;
}

/* Liga/desliga o relógio conforme as condições atuais.
   Chamar sempre que algo relevante muda (definições, visibilidade, texto pronto). */
function syncTimer() {
  syncAutoFim();
  if (timerPassage === null) return;
  if (timerShouldRun()) {
    if (!timerRunning) runTimer();
  } else if (timerRunning) {
    pauseTimer();
  }
}

function runTimer() {
  if (timerRemaining <= 0) {
    timerRunning = true;     // permite a handleTimerExpired() continuar
    handleTimerExpired();
    return;
  }
  timerRunning = true;
  timerEndTime = Date.now() + timerRemaining;
  timerLastSecs = Math.ceil(timerRemaining / 1000);
  renderTimer();
  countdownInterval = setInterval(timerTick, 250);
  decisionTimer = setTimeout(handleTimerExpired, timerRemaining);
}

/* Corre a cada 250 ms: atualiza o visual e toca o "tic" a cada segundo. */
function timerTick() {
  if (!timerRunning) return;
  if (State.variables.entrouPanico === true) { resetTimer(); return; }

  var msLeft = timerMsLeft();
  var secs = Math.ceil(msLeft / 1000);
  renderTimer();

  if (secs !== timerLastSecs) {
    timerLastSecs = secs;
    var tic = SimpleAudio.tracks.get('tic');
    if (tic && secs > 0) tic.volume(secs <= timerWarnSecs() ? 0.5 : 0.2).play();
  }
  if (msLeft <= 0) handleTimerExpired();
}

/* Tempo esgotado → consequência no jogo */
function handleTimerExpired() {
  if (!timerRunning) return;
  var expiredPassage = timerPassage;
  resetTimer();

  if (expiredPassage === '13-Laurinda') {
    // Passagem 13: demorou a decidir → evacua sem ajudar a D. Laurinda
    State.variables.demorouLaurinda = true;
    Engine.play('36');
  } else {
    // Comportamento padrão: pânico
    State.variables.entrouPanico = true;
    State.variables.panicOrigin = expiredPassage;   // passagem de onde veio o pânico
    Engine.play('20');
  }
}

/* Prepara o temporizador da passagem atual. Fica parado até o texto
   terminar (timerTextReady passa a true em finishAnimation / sem texto). */
function startDecisionTimer() {
  if (timerMode === 'off') return;
  if (!temporizadorPermitido(passage())) return;

  var current = passage();
  if (timerPassage !== current) {
    timerPassage = current;
    timerRemaining = TIMER_MS;
  }
  timerTextReady = false;
  criarTimerUI();
}

/* Muda o modo do temporizador (também a meio de uma passagem).
   O tempo restante é reescalado proporcionalmente ao novo modo. */
function setTimerMode(mode) {
  if (!TIMER_MODES.hasOwnProperty(mode)) mode = 'normal';
  var oldMs = TIMER_MS;

  timerMode = mode;
  try { localStorage.setItem('hfna-timer-mode', mode); } catch (e) {}

  if (mode === 'off') {
    resetTimer();            // pára e remove o contador
    return;
  }

  TIMER_MS = TIMER_MODES[mode];
  var current = passage();

  if (timerPassage !== null) {
    // Já há temporizador: reescala o tempo restante
    pauseTimer();
    timerRemaining = Math.round(timerRemaining * TIMER_MS / oldMs);
    renderTimer();
    syncTimer();
  } else if (TIMER_PASSAGES.indexOf(current) > -1 && temporizadorPermitido(current)) {
    // Estava desligado e a passagem atual tem temporizador: liga-o
    timerPassage = current;
    timerRemaining = TIMER_MS;
    timerTextReady = passageTextDone;   // recupera o estado real do texto
    criarTimerUI();
    syncTimer();
  }
}

// Segundo plano: pára ao esconder o jogo e retoma ao voltar
document.addEventListener('visibilitychange', syncTimer);
window.addEventListener('pagehide', pauseTimer);
window.addEventListener('pageshow', syncTimer);

/* ---- 6B. Fim automático: "Será o fim?" (28 e 34) e avanço por tempo de leitura (13, ver AUTO_FIM) ---- */
var passageStartTime = Date.now();
var autoFimPassage = null;
var autoFimTimeout = null;
var autoFimEnd = null;
var autoFimRemaining = 0;

function cancelarAutoFim() {
  if (autoFimTimeout) { clearTimeout(autoFimTimeout); autoFimTimeout = null; }
  autoFimPassage = null;
  autoFimEnd = null;
  autoFimRemaining = 0;
  removerBarraCena($('.cena-progresso.auto'));
}

/* Pára com as definições abertas, o jogo em segundo plano, etc. */
function syncAutoFim() {
  if (autoFimPassage === null) return;
  var deveCorrer = !document.hidden
    && !$('#settings-overlay').hasClass('open')
    && passage() === autoFimPassage;
  
    $('.cena-progresso.auto').toggleClass('pausada', !deveCorrer);
  
    if (deveCorrer && autoFimEnd === null) {
    autoFimEnd = Date.now() + autoFimRemaining;
    autoFimTimeout = setTimeout(avancarAutoFim, autoFimRemaining);
  } else if (!deveCorrer && autoFimEnd !== null) {
    autoFimRemaining = Math.max(0, autoFimEnd - Date.now());
    autoFimEnd = null;
    clearTimeout(autoFimTimeout);
    autoFimTimeout = null;
  }
}

function avancarAutoFim() {
  var p = autoFimPassage;
  var cfg = AUTO_FIM[p];
  cancelarAutoFim();
  if (!cfg || passage() !== p) return;
  if (cfg.resgatado) State.variables.foiResgatado = true;   // o mesmo que o [$foiResgatado = true] do link
  Engine.play(cfg.destino);
}

function iniciarAutoFim() {
  var cfg = AUTO_FIM[passage()];
  if (!cfg || timerMode === 'off') return;
  if (cfg.semVoltar && State.length < State.size) return;   // chegou a recuar: não avança sozinho

  var mult = (timerMode === 'extended' ? 2 : 1);
  var espera;

  if (cfg.leitura) {
    // tempo de leitura = palavras × ms/palavra, contado desde o início da passagem
    var palavras = $('.text-box .text-scroll p').text().trim().split(/\s+/).length;
    var total = palavras * cfg.leitura * mult;
    espera = Math.max((cfg.minEspera || 0) * mult,
                      total - (Date.now() - passageStartTime));
  } else {
      espera = cfg.espera * mult;
  }

  cancelarAutoFim();
  autoFimPassage = passage();
  autoFimRemaining = espera;

  if (!cfg.semFade) {
    $('.fade-black-overlay').css('animation',
      'fade-to-black 4s ease-in ' + Math.max(0, espera - 4000) + 'ms forwards');
  }

  // Barra por cima da text-box (a mesma das cenas em sequência)
  if (cfg.leitura) {
    var passado = Date.now() - passageStartTime;
    criarBarraCena(passado + espera, passado).addClass('auto');
  }

  syncAutoFim();
}

/* ---- 6C. Utilitários de tempo ---- */
var agendadas = [];

/* setTimeout que só corre se ainda estiveres na mesma passagem.
   Cancelado em :passagestart por cancelarAgendadas(). */
function agendarNaPassagem(ms, fn) {
  var p = passage();
  agendadas.push(setTimeout(function () { if (passage() === p) fn(); }, ms));
}
function cancelarAgendadas() { agendadas.forEach(clearTimeout); agendadas = []; }

/* Lê uma duração em segundos de uma variável CSS (ex.: '--fim34-dur') → ms */
function lerDuracaoCss(nomeVar, fallbackMs) {
  try {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nomeVar).trim();
    if (v) return parseFloat(v) * 1000;
  } catch (e) {}
  return fallbackMs;
}

/* ==========================================================================
   [7A] TOASTS (notificações)
   Uso nas passagens: mostrarToast('bom' | 'perigoso' | 'achievement',
                                   'Título\nTexto opcional', 'ícone opcional')
   ========================================================================== */
window.mostrarToast = function (tipo, conteudo, iconeCustom) {
  setTimeout(function () {
    $('.toast-notif').remove();   // só um toast de cada vez

    var icone;
    if (iconeCustom && typeof iconeCustom === 'string' && iconeCustom.length > 0) {
      // 3.º argumento explícito manda sempre (para overrides pontuais)
      icone = ph(iconeCustom);
    } else if (tipo === 'fogo') {
      icone = ph('fire');
    } else if (tipo === 'arvore') {
      icone = ph('tree');
    } else if (tipo === 'perigoso' || tipo === 'atencao') {
      icone = ph('warning');
    } else if (tipo === 'achievement') {
      icone = ph('medal');
    } else {
      icone = ph('check-circle');
    }

    // 1.ª linha = título; 2.ª linha (opcional) = texto
    var partes = conteudo.split('\n');
    var titulo = partes[0];
    var texto  = partes[1] || '';

    var $toast = $('<div class="toast-notif toast-' + tipo + '"></div>');

    var html = '<span class="toast-icone">' + icone + '</span>';
    html += '<span class="toast-corpo">';
    html += '<span class="toast-titulo">' + titulo + '</span>';
    if (texto) html += '<span class="toast-texto">' + texto + '</span>';
    html += '</span>';

    $toast.html(html);
    $('body').append($toast);

    setTimeout(function () { $toast.addClass('toast-visivel'); }, 50);   // entra

    setTimeout(function () {                                              // sai
      $toast.removeClass('toast-visivel');
      setTimeout(function () { $toast.remove(); }, 500);
    }, 3500);

  }, 300);
};

/* ==========================================================================
   [7B] CHEGADA AO PONTO DE ENCONTRO
   --------------------------------------------------------------------------
   Sequência da passagem do ponto de encontro (fase A: vizinhos/bombeiros →
   preto com tics → camadas). Constantes em [1]; CSS em [10].
   Uso nas passagens: <<run sequenciaChegada('vizinhos' | 'bombeiros' | 'direto')>>
   ========================================================================== */

function sequenciaChegada(modo) {
  var agendar = agendarNaPassagem;

  function tocar(id, vol) {
    var t = getTrack(id);
    if (t) t.loop(false).volume(vol).play();
  }
  function cena() { return $('.scene').not('.alarm-scene'); }

  function tocarMultidao() {
    var crowd = getTrack('crowd');
    if (!crowd) return;
    if (!crowd.isPlaying()) crowd.loop(true).volume(0.001).play();
    fadeTrack('crowd', CHEGADA_MULTIDAO_VOL, CHEGADA_MULTIDAO_FADE_MS);
  }

  function mostrarPontoEncontro() {
    cena().removeClass('fase-preto').addClass('fase-b');
    tocarMultidao();
  }

  // fade para preto + tics (tempo a passar) → ponto de encontro
    function passarTempo(inicio) {
    agendar(inicio, function () { cena().addClass('fase-preto'); });
    var primeiro = inicio + CHEGADA_PRETO_MS;
    for (var i = 0; i < CHEGADA_TIC_N; i++) {
      agendar(primeiro + i * CHEGADA_TIC_INTERVALO_MS, function () { tocar('tic', 0.4); });
    }
    var tRevela = primeiro + CHEGADA_TIC_N * CHEGADA_TIC_INTERVALO_MS;
    agendar(tRevela, function () {
      fadeTrack('tic', 0, 400);          // corta o tic quando o preto abre
      mostrarPontoEncontro();
    });
    return tRevela;
  }

  function batidaEPreto(inicio, comPassos) {
    var tBatida = inicio;
    if (comPassos) {
      agendar(inicio, function () { tocar('footsteps', 0.5); });
      agendar(inicio + CHEGADA_PASSOS_MS - 500, function () { fadeTrack('footsteps', 0, 500); });
      tBatida = inicio + CHEGADA_PASSOS_MS;
    }
    agendar(tBatida, function () { tocar('knock', 0.7); });
    return passarTempo(tBatida + CHEGADA_BATER_PAUSA_MS);
  }

  if (modo === 'vizinhos') {
    esperaDeCena(batidaEPreto(300, true) + CHEGADA_FOLGA_MS);

  } else if (modo === 'bombeiros') {
    var sirene = getTrack('sirene');
    if (sirene) {
      sirene.loop(true).volume(CHEGADA_SIRENE_INICIO_VOL).play();
      fadeTrack('sirene', CHEGADA_SIRENE_MAX_VOL, CHEGADA_SIRENE_SUBIDA_MS);
    }
    agendar(CHEGADA_SIRENE_SUBIDA_MS, function () {
      fadeTrack('sirene', 0, CHEGADA_SIRENE_SAIDA_MS);
    });
    esperaDeCena(batidaEPreto(CHEGADA_SIRENE_SUBIDA_MS, false) + CHEGADA_FOLGA_MS);

  } else {
    esperaDeCena(2500);                   // sem fase A: só as camadas
    agendar(300, mostrarPontoEncontro);
  }
}

window.sequenciaChegada = sequenciaChegada;   // as passagens só veem o que estiver em window

/* Ponto de encontro: o jogador preparou-se? (decide fundo e céu) */
window.pontoEncontroPreparado = function () {
  var V = State.variables;
  return V.fezCasa === true && V.casaPreparada === true;
};

/* ==========================================================================
   [7C] PASSAGEM 29 — SIRENES A DESFALECER
   --------------------------------------------------------------------------
   Ecrã preto: sirene "abafada" a aproximar-se e a vacilar, com luzes
   (.desfalecer-luzes) → hospital + respiração + texto.
   Duração em CSS (--desf29-dur). Com animações desligadas: 0 (sem sequência).
   ========================================================================== */

function duracaoDesfalecer() {
  if (!animationsEnabled) return 0;
  return lerDuracaoCss('--desf29-dur', 8000);
}

function sequenciaDesfalecer() {
  var D = duracaoDesfalecer();
  if (!D) return;

  var agendar = agendarNaPassagem;
  var $box = $('.text-box');
  $box.css({ visibility: 'hidden', opacity: 0 });   // o texto só aparece com o hospital

  // Sirene: começa quase inaudível e vai oscilando; no fim esvai-se
  var sirene = getTrack('sirene');
  if (sirene) {
    if (!sirene.isPlaying()) sirene.loop(true).volume(0.001).play();   // na 35 já vem da 34
    DESFALECER_SIRENE_ONDAS.forEach(function (o) {
      agendar(o[0] * D, function () { fadeTrack('sirene', o[1], o[2] * D); });
    });
    agendar(D * 0.8, function () { fadeTrack('sirene', 0, D * 0.2 - 100); });
  }

  // Hospital + respiração
  agendar(D, function () {
    var hospital = getTrack('hospital');
    if (hospital) hospital.loop(false).volume(DESFALECER_HOSPITAL_VOL).play();
  });
  agendar(D + 1500, function () {
    var respirar = getTrack('breathing-exercise');
    if (respirar) respirar.loop(false).volume(0.5).play();
  });

  // Texto: aparece com o hospital e só então começa a animação palavra a palavra
  agendar(D, function () {
    $('.desfalecer-luzes').remove();
    $box.css('visibility', 'visible').animate({ opacity: 1 }, 600);
    iniciarTextoAnimado();
  });
}

window.sequenciaDesfalecer = sequenciaDesfalecer;

/* ==========================================================================
   [8] TEXTO ANIMADO E TAMANHO DA LETRA
   ========================================================================== */

/* ---- 8.1 Animações ligadas/desligadas ---- */
function applyAnimationsState() {
  document.body.classList.toggle('reduce-motion', !animationsEnabled);
}

/* ---- 8.2 Tamanho da letra ----
   Reaplicado a cada passagem (aoTerminarPassagem) e ao mudar nas definições. */
function aplicarFonte() {
  // Calcula a altura extra para os modais (Guia, Alertas, etc.) consoante a fonte
  // Nível 0: +0vh | Nível 1: +2vh | Nível 2: +4vh | Nível 3: +6vh
  var extraHeights = ['0vh', '2vh', '4vh', '6vh'];
  var extraHeight = extraHeights[fontIndex] || '0vh';
  
  // Guarda o valor numa variável CSS global
  document.documentElement.style.setProperty('--ui-extra-height', extraHeight);
  document.documentElement.style.setProperty('--ui-scale', guideScales[fontIndex]);

  document.querySelectorAll('.text-box, .alarm:not(.guide-modal)').forEach(function (el) {
    el.style.setProperty('font-size', fontSizes[fontIndex], 'important');
  });
  document.querySelectorAll('.guide-modal').forEach(function (el) {
    el.style.setProperty('--guide-scale', guideScales[fontIndex]);
  });
  document.querySelectorAll('.sombrinha p.readable').forEach(function (el) {
    el.style.setProperty('font-size', readableFontSizes[fontIndex], 'important');
  });
}

/* ---- 8.3 Animação palavra a palavra ----
   Corre no fim de cada passagem. Passos:
   1. Garante que o conteúdo da .text-box está dentro de .text-scroll.
   2. Esconde os filhos e desativa as escolhas.
   3. Mostra elemento a elemento; os que têm a classe .animar aparecem
      palavra a palavra (com pausas em pontuação).
   4. Quando acaba (ou o jogador clica/prime Espaço) → finishAnimation():
      mostra tudo, ativa as escolhas, liberta o scroll e arranca os
      temporizadores.
   Sem .text-box, ou com animações desligadas, termina de imediato. */
function iniciarTextoAnimado() {
  var $box = $('.text-box');

  // Passagens sem caixa de texto: os temporizadores podem arrancar já
  if ($box.length === 0) {
    timerTextReady = true;
    passageTextDone = true;
    syncTimer();
    return;
  }

  // 1. Envolve o conteúdo em .text-scroll (menos os botões .ui-btn)
  var $scroll = $box.children('.text-scroll');
  if ($scroll.length === 0) {
    $scroll = $('<div class="text-scroll"></div>');
    $box.children().not('.ui-btn').each(function () {
      $scroll.append(this);
    });
    $box.prepend($scroll);
  }

  // Elementos a revelar. Um <div id=...> com filhos conta pelos filhos.
  var $children = $();
  $scroll.children().each(function () {
    var $el = $(this);
    if ($el.is('div[id]') && $el.children().length > 0) {
      $children = $children.add($el.children());
    } else {
      $children = $children.add($el);
    }
  });

  var animating = true;
  var wordInterval = null;
  var elementIndex = 0;

  // 2. Escolhas desativadas até o texto terminar
  $scroll.find('.choices a, .choices button').css({
    'pointer-events': 'none',
    'opacity': '0.4'
  });

  $scroll.css('overflow-y', 'hidden');

  $children.each(function () {
    $(this).css({ opacity: 0, visibility: 'visible' });
  });

  function finishAnimation() {
    if (!animating) return;
    animating = false;

    if (wordInterval) {
      clearInterval(wordInterval);
      wordInterval = null;
    }

    $children.each(function () {
      $(this).css('opacity', 1);
      $(this).find('.word').css('opacity', 1);
    });

    $scroll.css('overflow-y', 'auto');

    aguardarCena(function () {
      $box.find('.choices a, .choices button').css({
        'pointer-events': 'auto',
        'opacity': '1'
      });

      iniciarAutoFim();

      timerTextReady = true;
      passageTextDone = true;
      syncTimer();
    });
  }

  // Saltar a animação: clique/toque na caixa ou tecla Espaço
  $box.one('click touchstart', function (e) {
    if (animating) {
      e.stopPropagation();
      finishAnimation();
    }
  });

  $(document).one('keydown.skipAnim', function (e) {
    if (e.key === ' ' && animating) {
      e.preventDefault();
      finishAnimation();
    }
  });

  function showNext() {
    if (elementIndex >= $children.length) {
      finishAnimation();
      $(document).off('keydown.skipAnim');
      return;
    }

    var $el = $($children[elementIndex]);
    elementIndex++;

    if ($el.hasClass('animar')) {
      // Envolve cada palavra num <span class="word"> (sem tocar nas tags HTML)
      var original = $el.html();
      var wrapped = original.replace(/(<[^>]+>)|([^\s<]+)/g, function (match, tag, word) {
        if (tag) return tag;
        return '<span class="word" style="opacity:0;display:inline;">' + word + ' </span>';
      });
      $el.html(wrapped).css('opacity', 1);

      var $words = $el.find('.word');
      var i = 0;

      wordInterval = setInterval(function tickWord() {
        if (!animating) return;

        var wordText = $($words[i]).text().trim();
        $($words[i]).animate({ opacity: 1 }, 100);
        i++;

        // Última palavra deste elemento → pausa e passa ao seguinte
        if (i >= $words.length) {
          clearInterval(wordInterval);
          wordInterval = null;

          var delay = 0;
          if (/[.!?]$/.test(wordText))      delay = PAUSE_END;
          else if (/[,;:]$/.test(wordText)) delay = PAUSE_COMMA;

          setTimeout(function () {
            if (animating) showNext();
          }, delay);
          return;
        }

        // Pausa extra em pontuação
        if (/[.!?]$/.test(wordText)) {
          clearInterval(wordInterval);
          wordInterval = null;
          setTimeout(function () {
            if (animating) wordInterval = setInterval(tickWord, WORD_MS);
          }, PAUSE_END);
        } else if (/[,;:]$/.test(wordText)) {
          clearInterval(wordInterval);
          wordInterval = null;
          setTimeout(function () {
            if (animating) wordInterval = setInterval(tickWord, WORD_MS);
          }, PAUSE_COMMA);
        }

      }, WORD_MS);

    } else {
      // Elemento sem .animar: aparece com um fade curto
      $el.animate({ opacity: 1 }, 150, function () {
        if (animating) showNext();
      });
    }
  }

  // Animações desligadas: mostra tudo de imediato
  if (!animationsEnabled) {
    $(document).off('keydown.skipAnim');
    finishAnimation();
    return;
  }

  showNext();
}

/* ==========================================================================
   [8B] CENAS EM SEQUÊNCIA
   --------------------------------------------------------------------------
   Os botões só aparecem no fim da cena. esperaDeCena(ms) regista a espera
   (nas passagens: <<run esperaDeCena(5000)>>); aguardarCena(fn) corre fn no fim.
   Em CENA_SALTAVEL um clique/Espaço salta para o fim.
   ========================================================================== */

var cenaEsperaMs = 0;
var cenaTimer = null;
var cenaLiberta = null;   // função que termina a espera (se houver uma a decorrer)

window.esperaDeCena = function (ms) {
  cenaEsperaMs = Math.max(cenaEsperaMs, ms);
};

function esperaRestanteCena() {
  if (!animationsEnabled) return 0;
  return Math.max(0, cenaEsperaMs - (Date.now() - passageStartTime));
}

function cancelarCena() {
  if (cenaTimer) { clearTimeout(cenaTimer); cenaTimer = null; }
  cenaLiberta = null;
  cenaEsperaMs = 0;
  $(document).off('keydown.skipCena');
  $('.scene').off('click.skipCena'); 
}

// Se a janela muda de tamanho com uma cena a decorrer, a barra acompanha
$(window).on('resize.barraCena orientationchange.barraCena', function () {
  var barra = document.querySelector('.cena-progresso');
  if (barra) posicionarBarraCena(barra);
});

/* Termina de imediato as animações CSS finitas da cena (as infinitas continuam). */
function saltarAnimacoesCss() {
  var sc = document.querySelector('.scene:not(.alarm-scene)');
  if (!sc || !sc.getAnimations) return;
  sc.getAnimations({ subtree: true }).forEach(function (a) {
    var t = a.effect && a.effect.getComputedTiming();
    if (t && t.iterations !== Infinity) { try { a.finish(); } catch (e) {} }
  });
}

function bloquearEscolhas(on) {
  var $c = $('.text-box .choices');
  $c.toggleClass('choices-esperar', on);
  if (on) {
    $c.find('a, button').each(function () {
      // Guarda estado anterior (só na 1.ª vez)
      if (!$(this).data('bloqueado-orig')) {
        $(this).data('bloqueado-orig', {
          tabindex: this.getAttribute('tabindex'),
          pe: this.style.pointerEvents,
          opacity: this.style.opacity
        });
      }
      this.setAttribute('tabindex', '-1');
      this.setAttribute('aria-disabled', 'true');
      this.style.pointerEvents = 'none';
    });
    $c.attr('inert', '');
  } else {
    $c.removeAttr('inert');
    $c.find('a, button').each(function () {
      var orig = $(this).data('bloqueado-orig');
      if (orig) {
        if (orig.tabindex == null) this.removeAttribute('tabindex');
        else this.setAttribute('tabindex', orig.tabindex);
        this.style.pointerEvents = orig.pe || '';
        this.style.opacity = orig.opacity || '';
        $(this).removeData('bloqueado-orig');
      }
      this.removeAttribute('aria-disabled');
    });
  }
}

/* Coloca a .cena-progresso encostada ao topo da .text-box, com a largura dela.
   Chamado ao criar a barra e em cada resize/orientationchange. */
function posicionarBarraCena(barra) {
  if (!barra) return;
  var box = document.querySelector('.text-box');
  if (!box) return;
  var r = box.getBoundingClientRect();
  barra.style.left = r.left + 'px';
  barra.style.width = r.width + 'px';
  // bottom = distância do fundo da janela ao topo da text-box
  barra.style.bottom = (window.innerHeight - r.top) + 'px';
}

/* Cria a barra de progresso por cima da text-box.
   totalMs = duração total da barra; jaPassouMs = quanto já devia estar preenchido
   (a barra nasce já com o progresso real, em vez de começar sempre a 0). */
function criarBarraCena(totalMs, jaPassouMs) {
  var $b = $('<div class="cena-progresso" aria-hidden="true"><i></i></div>');
  $b[0].style.setProperty('--cena-total', totalMs + 'ms');
  $b[0].style.setProperty('--cena-atraso', -jaPassouMs + 'ms');
  $('body').append($b);
  posicionarBarraCena($b[0]);
  setTimeout(function () { $b.addClass('ativa'); }, 50);
  return $b;
}

function removerBarraCena($b) {
  if (!$b || !$b.length) return;
  $b.removeClass('ativa');
  setTimeout(function () { $b.remove(); }, 350);
}

/* Corre fn quando a cena acabar (ou já, se não houver espera). */
function aguardarCena(fn) {
  var resto = esperaRestanteCena();
  if (resto <= 0) { fn(); return; }

  var p = passage();
  var feito = false;
  var total = cenaEsperaMs;   // guardado antes de cancelarCena() o repor a 0
  bloquearEscolhas(true);

  // Barra de progresso da cena (só nas cenas saltáveis e com espera longa)
  var $hint = null;
  if (CENA_SALTAVEL.indexOf(p) > -1 && resto >= CENA_BARRA_MIN_MS) {
    $hint = criarBarraCena(total, total - resto);
  }

  function removerHint() { removerBarraCena($hint); }

  function acabar() {
    if (feito) return;
    feito = true;
    removerHint();
    cancelarCena();
    bloquearEscolhas(false);
    fn();
  }

  cenaLiberta = acabar;
  cenaTimer = setTimeout(acabar, resto);

  if (CENA_SALTAVEL.indexOf(p) > -1) {
    var saltar = function (ev) {
      // Ignora cliques em botões/links da UI (⟲, back, settings, etc.)
      if (ev && ev.target && $(ev.target).closest(
            'a, button, .ui-btn, #settings-nook, #sound-btn, #decision-timer'
          ).length) return;
      saltarAnimacoesCss();
      acabar();
    };
    // .on em vez de .one: o guard pode fazer "return" sem consumir o listener
    $('.scene').not('.alarm-scene').on('click.skipCena', saltar);
    $(document).one('keydown.skipCena', function (e) {
      if (e.key === ' ') { e.preventDefault(); saltar(); }
    });
  }
}
window.liberarCena = function () { if (cenaLiberta) cenaLiberta(); };

/* ==========================================================================
   [9] TELEMÓVEL (passagem 2.1 — marcar o 112)
   ========================================================================== */

/* ---- 9.1 Dimensionar o telemóvel ----
   Smartphones/tablets em retrato: o telefone é um único bloco que cabe na área
   acima da caixa de texto. Desktop/paisagem: usa limites de altura/largura. */
function ajustarPhone() {
  var scene = document.querySelector('.phone-scene');
  if (!scene) return;

  var img = scene.querySelector('img');
  if (!img) return;

  function aplicarProporcao() {
    if (!img.naturalWidth || !img.naturalHeight) return;

    var w = window.innerWidth;
    var h = window.innerHeight;
    var ratio = img.naturalWidth / img.naturalHeight;
    var portrait = window.matchMedia('(orientation: portrait)').matches;

    /* ----- Mobile/tablet em retrato ----- */
    if (portrait && w <= 1024) {
      var textBox   = document.querySelector('.phone-text-box');
      var rootScene = document.querySelector('.scene');

      var sceneRect = rootScene ? rootScene.getBoundingClientRect() : null;
      var textRect  = textBox ? textBox.getBoundingClientRect() : null;

      var sceneTop   = sceneRect ? sceneRect.top : 0;
      var sceneWidth = sceneRect ? sceneRect.width : w;

      // A caixa de texto é a fronteira inferior real
      var textTop = textRect
        ? (textRect.top - sceneTop)
        : h * (w <= 600 ? 0.70 : 0.72);

      var safeTop = Math.max(12, Math.min(24, h * 0.02));
      var safeGap = w <= 375
        ? Math.max(14, Math.min(22, h * 0.022))
        : Math.max(12, Math.min(20, h * 0.018));

      var safeBottom = Math.max(safeTop + 180, textTop - safeGap);
      var availableH = Math.max(180, safeBottom - safeTop);

      var targetW = (w <= 600)
        ? Math.min(sceneWidth * 1.00, w * 1.00, 520)
        : Math.min(sceneWidth * 0.68, w * 0.68, 600);

      var targetH = targetW / ratio;
      var heightLimit = availableH * (w <= 375 ? 1.00 : 1.01);
      var phoneH = Math.min(targetH, heightLimit);
      var phoneW = phoneH * ratio;

      // Centra verticalmente na área acima da caixa de texto
      var freeH = Math.max(0, availableH - phoneH);
      var phoneTop = safeTop + freeH / 2;

      scene.style.setProperty('width',  phoneW + 'px', 'important');
      scene.style.setProperty('height', phoneH + 'px', 'important');
      // Smartphones: centrado. Tablets em retrato: lado direito da ilustração.
      var tabletPortrait = portrait && w > 600 && w <= 1024;
      scene.style.setProperty('left', tabletPortrait ? '73%' : '50%', 'important');
      scene.style.setProperty('right', 'auto', 'important');
      scene.style.setProperty('top', phoneTop + 'px', 'important');
      scene.style.setProperty('transform', 'translateX(-50%)', 'important');
      scene.style.setProperty('transform-origin', 'center center', 'important');

      // Tablet: centra os overlays no corpo visível do telefone
      alinharOverlaysAoTelefone(scene, img);
      return;
    }

    /* ----- Desktop / paisagem ----- */
    scene.style.removeProperty('left');
    scene.style.removeProperty('right');
    scene.style.removeProperty('top');
    scene.style.removeProperty('transform');
    scene.style.removeProperty('transform-origin');

    var maxH = Math.min(h * 0.58, 560);
    if (h <= 700) maxH = Math.min(h * 0.58, 430);
    if (h <= 600) maxH = Math.min(h * 0.56, 390);

    var maxW = Math.min(w * 0.42, 420);
    if (w <= 900) maxW = Math.min(w * 0.58, 360);

    var phoneHDesktop = maxH;
    var phoneWDesktop = phoneHDesktop * ratio;

    if (phoneWDesktop > maxW) {
      phoneWDesktop = maxW;
      phoneHDesktop = phoneWDesktop / ratio;
    }

    scene.style.setProperty('width',  phoneWDesktop + 'px', 'important');
    scene.style.setProperty('height', phoneHDesktop + 'px', 'important');
  }

  if (img.complete && img.naturalWidth) {
    aplicarProporcao();
  } else {
    img.addEventListener('load', aplicarProporcao, { once: true });
  }
}

/* ---- 9.2 Centro real do telefone (tablet em retrato) ----
   Calcula o centro horizontal da área não transparente de phone.png e guarda-o
   em --phone-visible-center-x, para o teclado não variar entre proporções.
   O resultado fica em cache em img.__phoneVisibleCenterX. */
function alinharOverlaysAoTelefone(scene, img) {
  if (!scene || !img) return;

  var isTabletPortrait =
    window.matchMedia('(orientation: portrait)').matches &&
    window.innerWidth > 600 &&
    window.innerWidth <= 1024;

  if (!isTabletPortrait) return;

  function aplicarCentro(cx) {
    if (!isFinite(cx)) return;
    scene.style.setProperty('--phone-visible-center-x', (cx * 100) + '%');
  }

  if (img.__phoneVisibleCenterX != null) {
    aplicarCentro(img.__phoneVisibleCenterX);
    return;
  }

  try {
    // Imagem ainda não carregou: tenta de novo quando carregar
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      img.addEventListener('load', function onPhoneLoad() {
        img.removeEventListener('load', onPhoneLoad);
        alinharOverlaysAoTelefone(scene, img);
      });
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var minX = canvas.width, maxX = -1;

    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        var alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 20) {                // pixel visível
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (maxX < minX) return;             // imagem totalmente transparente

    var centerX = ((minX + maxX) / 2) / canvas.width;
    img.__phoneVisibleCenterX = centerX;
    aplicarCentro(centerX);
  } catch (e) {
    // getImageData pode falhar (CORS); nesse caso mantém o centro por defeito
  }
}

/* ---- 9.3 Ecrã do telemóvel (dígitos + apagar) ----
   Criado no fim da passagem 2.1. */
function criarEcraTelemovel() {
  if ($('#phone-screen').length !== 0) return;

  var $screen = $('<div id="phone-screen"></div>');
  $screen.css({
    'position': 'absolute',
    'top': '21%',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'width': '45%',
    'text-align': 'center',
    'font-size': '1.3em',
    'font-weight': 'bold',
    'color': 'white',
    'letter-spacing': '0.3em',
    'z-index': '5',
    'pointer-events': 'none',
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'center'
  });
  $screen.html(
    '<span id="phone-digits">___</span>' +
    '<span id="phone-backspace" role="button" tabindex="0" aria-label="Apagar número">' + ICON_BACKSPACE + '</span>'
  );
  $('.phone-scene').append($screen);
}

/* Lê os dígitos já marcados (ignora os "_" de preenchimento) */
function lerDigitosMarcados() {
  return $('#phone-digits').text().replace(/_/g, '').replace(/[^0-9*#]/g, '');
}

/* Mostra uma mensagem de erro durante 1,5 s e repõe "___" */
function mostrarErroTelemovel(mensagem) {
  var $digits = $('#phone-digits');
  $digits.addClass('error-message');
  $digits.css('color', '#cc2222').text(mensagem);
  setTimeout(function () {
    $digits.removeClass('error-message');
    $digits.text('___').css('color', 'white');
  }, 1500);
}

/* ---- 9.4 Teclado: dígitos, apagar e ligar ---- */

// Tecla numérica (máx. 3 dígitos; só "112" é válido)
$(document).on('click', '.phone-key', function () {
  var $digits = $('#phone-digits');
  var num = $(this).data('num');
  var current = lerDigitosMarcados();

  if (current.length < 3) {
    var next = current + num;
    var display = next + '___'.slice(next.length);
    $digits.text(display).css('color', 'white');

    if (next.length === 3 && next !== '112') {
      mostrarErroTelemovel('Nº inválido');
    }
  }
});

// Apagar o último dígito
$(document).on('click', '#phone-backspace', function () {
  var $digits = $('#phone-digits');
  var current = lerDigitosMarcados();

  if (current.length > 0) {
    var next = current.slice(0, -1);
    var display = next + '___'.slice(next.length);
    $digits.text(display).css('color', 'white');
  }
  tocarSom('phone-tap', 0.3);
});

// Acessibilidade: o botão apagar também funciona com Enter/Espaço
$(document).on('keydown', '#phone-backspace', function (e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    $(this).trigger('click');
  }
});

// Botão verde de ligar
$(document).on('click', '.phone-call', function () {
  var current = lerDigitosMarcados();

  if (current === '112') {
    if ($(this).data('chamando')) return;           // evita duplo clique
    $(this).data('chamando', true);
    $('.scene .image-overlay').removeClass('pose-112before').addClass('pose-112');
    tocarSom('phone', 0.5);
    agendarNaPassagem(CHAMADA_112_MS, function () { Engine.play('2'); });
  } else if (current.length === 0) {
    mostrarErroTelemovel('Marca um nº');
  } else {
    mostrarErroTelemovel('Nº errado');
  }
});


/* ==========================================================================
   [10] RECOMEÇAR E GUIA DE JOGO (caixas .alarm)
   Passagens especiais: '⟲' (confirmar recomeçar), 'Guia de Jogo', 'Sobre'.
   ========================================================================== */

/* ---- 10.1 Guardar a cena anterior ----
   Em cada passagem normal, guarda o fundo/overlay (imagem, tamanho, posição)
   para a passagem '⟲' os mostrar por trás da caixa de confirmação.
   Corre em :passageend porque é aí que o DOM já existe (mais fiável que no clique). */
function guardarCenaParaRecomecar() {
  if (passage() === '⟲') return;

  var $s  = $('.scene').not('.alarm-scene').first();
  var $bg = $s.find('.image-bg').first();
  var $ov = $s.find('.image-overlay').first();

  window.__restartBg = $bg.length ? {
    img:  $bg[0].style.backgroundImage || getComputedStyle($bg[0]).backgroundImage,
    size: getComputedStyle($bg[0]).backgroundSize,
    pos:  getComputedStyle($bg[0]).backgroundPosition,
    rep:  getComputedStyle($bg[0]).backgroundRepeat
  } : null;

  window.__restartOv = $ov.length ? {
    img:  getComputedStyle($ov[0]).backgroundImage,
    size: getComputedStyle($ov[0]).backgroundSize,
    pos:  getComputedStyle($ov[0]).backgroundPosition,
    rep:  getComputedStyle($ov[0]).backgroundRepeat
  } : null;
}

/* ---- 10.2 Aplicar a cena guardada na passagem '⟲' ---- */
function aplicarCenaNoRecomecar() {
  if (passage() !== '⟲') return;

  var $bg = $('.alarm-scene .image-bg').first();
  var $ov = $('.alarm-scene .image-overlay').first();

  if ($bg.length && window.__restartBg) {
    $bg[0].style.setProperty('background-image',    window.__restartBg.img,  'important');
    $bg[0].style.setProperty('background-size',     window.__restartBg.size, 'important');
    $bg[0].style.setProperty('background-position', window.__restartBg.pos,  'important');
    $bg[0].style.setProperty('background-repeat',   window.__restartBg.rep,  'important');
  }

  if ($ov.length && window.__restartOv) {
    $ov[0].style.setProperty('background-image',    window.__restartOv.img,  'important');
    $ov[0].style.setProperty('background-size',     window.__restartOv.size, 'important');
    $ov[0].style.setProperty('background-position', window.__restartOv.pos,  'important');
    $ov[0].style.setProperty('background-repeat',   window.__restartOv.rep,  'important');
  }
}

/* ---- 10.3 Botão X (e tecla Escape) ----
   Dispara o link interno do X (o <<back>> da passagem). Se não houver,
   usa o "Manter progresso" da caixa de recomeçar. */
$(document).on('click', '.alarm-close', function (e) {
  e.preventDefault();
  var $innerLink = $(this).find('a').first();
  if ($innerLink.length) {
    $innerLink.trigger('click');
  } else {
    $('.alarm .cancel-restart a').first().trigger('click');   // comportamento legado
  }
});

$(document).on('keydown.alarm-escape', function (e) {
  if (e.key !== 'Escape') return;

  if ($('#settings-overlay').hasClass('open')) {        // 1. Definições
    $('#settings-close').trigger('click');
  } else {                                              // 2. Caixas .alarm
    var $close = $('.alarm .alarm-close').first();
    if ($close.length) {
      $close.trigger('click');
    } else {
      $('.alarm .cancel-restart a, .alarm .cancel-restart .macro-back').first().trigger('click');
    }
  }
});

/* ---- 10.4 Foco ao abrir/fechar o alerta ---- */

// Abrir: quando aparece uma .alarm, move o foco para dentro dela
function abrirFocoDoAlerta() {
  var $alarm = $('.alarm');
  if ($alarm.length) {
    setTimeout(function () { window.__a11yOpenDialog($alarm); }, 50);
  }
}

// Fechar: qualquer passagem que não seja '⟲' devolve o foco a quem abriu
$(document).on(':passagestart', function (ev) {
  if (ev.passage.title !== '⟲') window.__a11yCloseDialog();
});

/* ---- 10.5 Ícones do Guia de Jogo ----
   Preenche todos os [data-icon="nome"] com o SVG de GUIDE_ICONS. */
function preencherIconesDoGuia() {
  $('[data-icon]').each(function () {
    var svg = GUIDE_ICONS[this.getAttribute('data-icon')];
    if (svg) this.innerHTML = svg;
  });
}

/* X de fechar em todas as caixas .alarm (Recomeçar, Sobre, Guia de Jogo):
   troca o "✕" de texto do <<back>> pelo SVG. O X das Definições já é
   criado com ICON_CLOSE em [11.1]. */
function aplicarIconeFechar() {
  $('.alarm .alarm-close').each(function () {
    var $inner = $(this).find('a, .macro-back').first();
    var $target = $inner.length ? $inner : $(this);
    $target.html(ICON_CLOSE).attr('aria-label', 'Fechar');
  });
}

/* ======== 10A - Ajuste do Caderno */
/* Quiz em caderno: altura disponível = espaço acima da text-box */
function ajustarCaderno() {
  var ov  = document.querySelector('.notebook-overlay');
  var box = document.querySelector('.text-box');
  if (!ov || !box) return;
  
  ov.style.setProperty('--nb-textbox-px', box.getBoundingClientRect().height + 'px');

  var list = document.querySelector('.notebook-list');
  var actions = document.querySelector('.notebook-actions');
  if (!list || !actions) return;

  // Remove setas antigas
  var oldHint = actions.querySelector('.nb-scroll-hint');
  if (oldHint) oldHint.remove();

  // Cria a setinha
  var hint = document.createElement('div');
  hint.className = 'nb-scroll-hint';
  hint.innerHTML = '<svg class="ph-icon" viewBox="0 0 256 256"><path fill="currentColor" d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>';

  // Ação de clicar para scrollar para baixo
  hint.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    list.scrollBy({ top: list.clientHeight * 0.8, behavior: 'smooth' });
  });

  // Anexa a seta ao RODAPÉ (a mesma secção do botão)
  actions.appendChild(hint);

  function verificarScroll() {
    var hasScroll = list.scrollHeight > list.clientHeight + 5;
    var isNearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 20;
    hint.classList.toggle('visible', hasScroll && !isNearBottom);
    actions.classList.toggle('aguarda-fim', hasScroll && !isNearBottom);
  }

  verificarScroll();               // já, para o botão nunca "piscar" no início
  setTimeout(verificarScroll, 50); // e outra vez quando o layout assentar
  
  if (list._scrollHandler) {
    list.removeEventListener('scroll', list._scrollHandler);
  }
  list._scrollHandler = verificarScroll;
  list.addEventListener('scroll', verificarScroll);
}

/* ==========================================================================
   [11] DEFINIÇÕES (botão + painel lateral)
   Tudo é criado na 1.ª passagem, dentro de uma única função (partilha de
   variáveis jQuery e funções internas). Sub-blocos:
     11.1 criar HTML        11.5 tamanho da letra    11.9 abrir/fechar
     11.2 animações         11.6 temporizador        11.10 botões inferiores
     11.3 som               11.7 narração (placeholder)
     11.4 idioma (placeholder)  11.8 ecrã cheio + sair do jogo
   ========================================================================== */
$(document).one(':passagestart', function () {

  // Limpa qualquer versão anterior (evita duplicados)
  $('#settings-overlay').remove();
  $('#settings-nook').remove();

  /* ---------- 11.1 HTML ---------- */

   // Botão "Definições" (nook, canto superior direito)  
   $('body').append(    
    '<button id="settings-nook" type="button" aria-label="Abrir definições" aria-haspopup="dialog">' +      
      '<span class="settings-icon" aria-hidden="true">' + ICON_SETTINGS + '</span>' +      
      '<span class="settings-label">Definições</span>' +    
    '</button>' 
    );

  // Painel lateral  
  $('body').append(    
    '<div id="settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title" aria-hidden="true">' +      
      '<aside id="settings-panel">' +         
        '<header class="settings-header">' +          
          '<h2 class="settings-title" id="settings-title">' +            
            '<span class="settings-icon" aria-hidden="true">' + ICON_SETTINGS + '</span> Definições' +          
          '</h2>' +          
          '<button id="settings-close" type="button" aria-label="Fechar definições">' + ICON_CLOSE + '</button>' +        
        '</header>' +         
        
        '<div class="settings-body">' +           
        
          /* ===== Grupo 1 — Geral (sem título) ===== */          
          '<section class="settings-group" aria-labelledby="sg-geral">' +
            '<h3 class="settings-group-title" id="sg-geral">Geral</h3>' +            
              (FEATURES.idioma ?
              '<div class="settings-row settings-row-language">' +
                '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_GLOBE + '</span> Idioma</span>' +
                '<select id="language-select" class="language-select" aria-label="Idioma">' +
                  '<option value="pt" selected>Português</option><option value="en">English</option>' +
                  '<option value="es">Español</option><option value="fr">Français</option>' +
                  '<option value="de">Deutsch</option><option value="it">Italiano</option>' +
                  '<option value="el">Ελληνικά</option><option value="ru">Русский</option>' +
                '</select>' +
              '</div>' : '') +

            '<div class="settings-row">' +              
              '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_FULLSCREEN + '</span> Ecrã cheio</span>' +              
              '<div class="toggle-switch" id="toggle-fullscreen" role="switch" aria-checked="false" tabindex="0" aria-label="Ecrã cheio"></div>' +            
            '</div>' +           
          '</section>' +

          /* ===== Grupo 2 — Áudio ===== */          
          '<section class="settings-group" aria-labelledby="sg-audio">' +            
            '<h3 class="settings-group-title" id="sg-audio">Áudio</h3>' +             
              '<div class="settings-row settings-row-sound">' +              
                '<button type="button" class="sound-icon-btn" id="sound-icon-btn" aria-label="Silenciar som">' +                
                  '<span class="sound-icon" aria-hidden="true">' + ICON_VOLUME_ON + '</span>' +                
                  '<span class="sound-label">Som Geral</span>' +              
                '</button>' +              
                '<div class="sound-slider-wrap">' +                
                  '<input type="range" min="0" max="100" step="1" value="100" id="volume-slider" aria-label="Nível de volume">' +              
                '</div>' +              
                '<span class="volume-value" id="volume-value">100%</span>' +            
              '</div>' +             
              (FEATURES.narracao ?
                '<div class="settings-row">' +
                  '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_MIC + '</span> Narração</span>' +
                  '<div class="toggle-switch" id="toggle-voice" role="switch" aria-checked="false" tabindex="0" aria-label="Narração de voz"></div>' +
                '</div>' : '') +        
          '</section>' +

          /* ===== Grupo 3 — Acessibilidade ===== */          
          '<section class="settings-group" aria-labelledby="sg-acess">' +            
            '<h3 class="settings-group-title" id="sg-acess">Acessibilidade</h3>' +             
              '<div class="settings-row settings-row-font">' +              
                '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_FONT + '</span> Tamanho da letra</span>' +              
                '<div class="font-levels" id="font-levels" role="radiogroup" aria-label="Tamanho da letra">' +                
                  '<button type="button" class="font-level" data-level="0" aria-label="Tamanho A">A</button>' +                
                  '<button type="button" class="font-level" data-level="1" aria-label="Tamanho A mais">A+</button>' +                
                  '<button type="button" class="font-level" data-level="2" aria-label="Tamanho A mais mais">A++</button>' +                
                  '<button type="button" class="font-level" data-level="3" aria-label="Tamanho A mais mais mais">A+++</button>' +              
                '</div>' +            
              '</div>' +             
              '<div class="settings-row">' +              
                '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_ANIMATION + '</span> Animações</span>' +              
                '<div class="toggle-switch on" id="toggle-animations" role="switch" aria-checked="true" tabindex="0" aria-label="Animações"></div>' +            
              '</div>' +             
              '<div class="settings-row settings-row-font">' +              
                '<span class="settings-row-label"><span class="icon" aria-hidden="true">' + ICON_TIMER + '</span> Temporizador</span>' +              
                '<div class="font-levels" id="timer-levels" role="radiogroup" aria-label="Temporizador de decisão">' +                
                  '<button type="button" class="font-level" role="radio" data-mode="normal">Normal</button>' +                
                  '<button type="button" class="font-level" role="radio" data-mode="extended">Alargado</button>' +                
                  '<button type="button" class="font-level" role="radio" data-mode="off">Desligado</button>' +              
                '</div>' +              
                '<span class="settings-hint" id="timer-hint" aria-live="polite"></span>' +            
              '</div>' +           
          '</section>' +

          /* ===== Guia de jogo — NÃO é um botão de ação, é uma ligação de navegação.             
          Fora dos grupos, sem fundo, ícone dourado + chevron + linha a crescer.             
          (opcional: acrescentar a classe is-journal para a variante "diário") ===== */          
          '<button type="button" class="settings-guide-link" id="settings-guide">' +            
            '<span class="sgl-icon" aria-hidden="true">' + ICON_GUIDE + '</span>' +            
            '<span class="sgl-label">Guia de jogo</span>' +            
            '<span class="sgl-chevron" aria-hidden="true">' + ICON_CHEVRON + '</span>' +          
          '</button>' +         
        '</div>' +         
        '<div class="settings-actions">' +          
          '<button type="button" class="settings-btn settings-btn-back" id="settings-back">' + ICON_BACK + ' Decisão anterior</button>' +          
          '<button type="button" class="settings-btn settings-btn-restart" id="settings-restart">' + ICON_RESTART + ' Recomeçar</button>' +              
      '</div>' +      
    '</aside>' +    
  '</div>'  
);

  /* ---------- Referências aos elementos ---------- */
  var $overlay      = $('#settings-overlay');
  var $soundIcon    = $('#sound-icon-btn');
  var $soundIconEl  = $soundIcon.find('.sound-icon');
  var $volumeSlider = $('#volume-slider');
  var $volumeValue  = $('#volume-value');
  var $voiceToggle  = $('#toggle-voice');
  var $fullToggle   = $('#toggle-fullscreen');
  var $fontLevels   = $('#font-levels');
  var $fontButtons  = $fontLevels.find('.font-level');
  var $langSelect   = $('#language-select');
  var $animToggle   = $('#toggle-animations');

  // Interruptores: também funcionam com Espaço/Enter (acessibilidade)
  function ativarTeclado($toggle) {
    $toggle.off('keydown.settings').on('keydown.settings', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        $(this).trigger('click');
      }
    });
  }

  /* ---------- 11.2 Animações ---------- */
  function setAnimations(on) {
    animationsEnabled = on;
    $animToggle.toggleClass('on', on).attr('aria-checked', on ? 'true' : 'false');
    applyAnimationsState();
    try { localStorage.setItem('hfna-animations', on ? '1' : '0'); } catch (e) {}
  }

  $animToggle.off('click.settings').on('click.settings', function () {
    var on = !$animToggle.hasClass('on');
    setAnimations(on);
    if (!on) {
      $('.text-box').trigger('click');   // termina o texto
      window.liberarCena();              // e a espera da cena
    }
  });
  ativarTeclado($animToggle);

  /* ---------- 11.3 Som: estado, volume e mute ----------
     O mute real vive no #sound-btn ([5.7]); aqui só o comandamos/espelhamos. */
  function getVolume() {
    // SimpleAudio.volume() devolve 0..1 → convertemos para 0..100
    try {
      if (typeof SimpleAudio !== 'undefined' && SimpleAudio.volume) {
        return Math.round(SimpleAudio.volume() * 100);
      }
    } catch (e) {}
    return 100;
  }

  function isMuted() {
    var $s = $('#sound-btn');
    return $s.length ? $s.hasClass('muted') : false;
  }

  function setMute(mute) {
    var $s = $('#sound-btn');
    if ($s.length && $s.hasClass('muted') !== mute) {
      $s.trigger('click');
    }
    syncSoundUI();
  }

  function setVolume(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    try {
      if (typeof SimpleAudio !== 'undefined' && SimpleAudio.volume) {
        SimpleAudio.volume(v / 100);
      }
    } catch (e) {}

    $volumeSlider.val(v).css('--volume-pct', v + '%');
    $volumeValue.text(v + '%');

    // Volume 0 = mudo; sair do 0 = volta a ligar
    if (v === 0 && !isMuted()) {
      setMute(true);
    } else if (v > 0 && isMuted()) {
      setMute(false);
    } else {
      syncSoundUI();
    }
  }

  function syncSoundUI() {
    var muted = isMuted();
    $soundIcon.toggleClass('muted', muted);
    $soundIconEl.html(muted ? ICON_VOLUME_OFF : ICON_VOLUME_ON);
    $soundIcon.attr('aria-label', muted ? 'Ligar som' : 'Silenciar som');

    var vol = muted ? 0 : getVolume();
    $volumeSlider.val(vol).css('--volume-pct', vol + '%');
    $volumeValue.text(vol + '%');
  }

  $soundIcon.off('click.settings').on('click.settings', function () {
    setMute(!isMuted());
  });

  $volumeSlider.off('input.settings').on('input.settings', function () {
    setVolume(parseInt(this.value, 10) || 0);
  });

  /* ---------- 11.4 Idioma (placeholder) ---------- */
  $langSelect.off('change.settings').on('change.settings', function () {
    // aqui entra a lógica de troca de idioma quando existir
  });

  /* ---------- 11.5 Tamanho da letra ---------- */
  function setFontLevel(level) {
    level = Math.max(0, Math.min(3, parseInt(level, 10) || 0));
    fontIndex = level;
    aplicarFonte();

    $fontButtons.each(function () {
      var lv = parseInt(this.getAttribute('data-level'), 10);
      $(this).toggleClass('active', lv === level)
             .attr('aria-checked', lv === level ? 'true' : 'false');
    });

    // A fake scrollbar precisa de recalcular depois de o texto mudar de tamanho
    setTimeout(function () {
      reajustarCenas();
      if (window.refreshFakeScrollbars) window.refreshFakeScrollbars();
    }, 60);
  }

  $fontButtons.off('click.settings').on('click.settings', function () {
    setFontLevel(this.getAttribute('data-level'));
  });

  /* ---------- 11.6 Temporizador (seletor) ---------- */
  var $timerButtons = $('#timer-levels .font-level');
  var $timerHint    = $('#timer-hint');

  function syncTimerUI() {
    $timerButtons.each(function () {
      var on = this.getAttribute('data-mode') === timerMode;
      $(this).toggleClass('active', on).attr('aria-checked', on ? 'true' : 'false');
    });
    $timerHint.text(timerMode === 'off'
      ? 'Sem limite de tempo nas decisões.'
      : (TIMER_MODES[timerMode] / 1000) + ' segundos por decisão.');
  }

  $timerButtons.off('click.settings').on('click.settings', function () {
    setTimerMode(this.getAttribute('data-mode'));
    syncTimerUI();
  });

  syncTimerUI();

  /* ---------- 11.7 Narração de voz (placeholder) ---------- */
  $voiceToggle.off('click.settings').on('click.settings', function () {
    var on = !$voiceToggle.hasClass('on');
    $voiceToggle.toggleClass('on', on).attr('aria-checked', on ? 'true' : 'false');
  });
  ativarTeclado($voiceToggle);

  /* ---------- 11.8 Ecrã cheio ---------- */
function updateFullToggle() {
  var on = !!document.fullscreenElement;
  $fullToggle.toggleClass('on', on).attr('aria-checked', on ? 'true' : 'false');
}

$fullToggle.off('click.settings').on('click.settings', function () {
  if (!document.fullscreenElement) {
    var p = document.documentElement.requestFullscreen &&
            document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(function () {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});
ativarTeclado($fullToggle);
$(document).off('fullscreenchange.settings').on('fullscreenchange.settings', updateFullToggle);

  /* ---------- 11.9 Abrir / fechar o painel ---------- */
  function openSettings() {
    // Sincroniza todos os controlos com o estado real antes de mostrar
    syncSoundUI();
    $volumeSlider.css('--volume-pct', (parseInt($volumeSlider.val(), 10) || 0) + '%');
    setFontLevel(fontIndex);
    updateFullToggle();
    setAnimations(animationsEnabled);
    $overlay.addClass('open').attr('aria-hidden', 'false');
    syncTimer();   // pausa o temporizador
    syncTimerUI();
    window.__a11yOpenDialog($overlay);
  }

  function closeSettings() {
    $overlay.removeClass('open').attr('aria-hidden', 'true');
    syncTimer();   // retoma o temporizador onde ficou
    window.__a11yCloseDialog();
  }

  function toggleSettings() {
    if ($overlay.hasClass('open')) closeSettings();
    else openSettings();
  }

  $('#settings-nook').off('click.settings').on('click.settings', toggleSettings);
  $('#settings-close').off('click.settings').on('click.settings', closeSettings);

  $overlay.off('click.settings').on('click.settings', function (e) {
    if (e.target === $overlay[0]) closeSettings();   // clique no fundo escuro
  });

  /* ---------- 11.10 Botões inferiores ---------- */
  // O botão ↻ da text-box (.ui-btn) está escondido por CSS: serve de "botão fantasma" para estas definições
  // Recomeçar: reutiliza o botão ↻ da text-box (abre a passagem '⟲')
  $('#settings-restart').off('click.settings').on('click.settings', function () {
    closeSettings();
    var $btn = $('.text-box .ui-btn a:first-child');
    if ($btn.length) {
      $btn.trigger('click');
    } else if (typeof Engine !== 'undefined' && Engine.restart) {
      Engine.restart();
    }
  });

  // Voltar atrás: reutiliza o <<back>> da text-box
  $('#settings-back').off('click.settings').on('click.settings', function () {
    closeSettings();
    var $back = $('.text-box .ui-btn .macro-back');
    if ($back.length) {
      $back.trigger('click');
    } else if (typeof Engine !== 'undefined' && Engine.back) {
      Engine.back();
    }
  });

  $('#settings-guide').off('click.settings').on('click.settings', function () {
    closeSettings();
    Engine.play('Guia de Jogo');
  });

  // Estado inicial dos botões de fonte
  setFontLevel(fontIndex);
});


/* ==========================================================================
   [12] ECRÃ DE CARREGAMENTO E PRÉ-CARREGAMENTO DE IMAGENS
   --------------------------------------------------------------------------
   Em :storyready mostra #loading-screen (título + chama Lottie + barra).
   A barra avança com imagesCritical. Quando acaba (mín. 2,2 s), o título
   "viaja" até à posição do título real (.sombrinha h1) e o overlay desaparece.
   Depois arranca o pré-carregamento de imagesBackground.
   ========================================================================== */

/* Carrega o resto das imagens em segundo plano, 1–2 de cada vez, só quando o
   browser está livre e com prioridade baixa (para não competir com o jogo). */
function startBackgroundPreload() {
  if (startBackgroundPreload.started) return;
  startBackgroundPreload.started = true;

  var conn = navigator.connection || {};
  if (conn.saveData) return; // modo "poupança de dados": só carrega o que for preciso

  var queue = [].concat.apply([], imagesBackground);   // achata PRONTO_EVACUAR_IMGS
  var maxParallel = /(^|-)2g$/.test(conn.effectiveType || '') ? 1 : 2;
  var active = 0;
  var idle = window.requestIdleCallback
    ? function (fn) { window.requestIdleCallback(fn, { timeout: 1500 }); }
    : function (fn) { setTimeout(fn, 200); };

  function done() { active--; idle(next); }

  function next() {
    while (active < maxParallel && queue.length) {
      var img = new Image();
      img.decoding = 'async';
      if ('fetchPriority' in img) img.fetchPriority = 'low';
      img.onload = done;
      img.onerror = done;     // uma imagem em falta não bloqueia a fila
      active++;
      img.src = queue.shift();
    }
  }

  idle(next);
}

$(document).one(':storyready', function () {

  // Injeta o script do Lottie (animação da chama)
  if (!document.querySelector('script[src*="dotlottie-wc"]')) {
    var lottieScript = document.createElement('script');
    lottieScript.type = 'module';
    lottieScript.src = 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-wc@0.9.26/dist/dotlottie-wc.js';
    document.head.appendChild(lottieScript);
  }

  var overlay = document.createElement('div');
  overlay.id = 'loading-screen';
  overlay.innerHTML =
    '<div class="loading-background"></div>' +
    '<main class="loading-content">' +
      '<h1 class="loading-title">Há fogo na aldeia.</h1>' +
      '<div class="loading-flame">' +
        '<dotlottie-wc src="https://cdn.jsdelivr.net/gh/letceo/ha-fogo-na-aldeia@main/images/animations/Flame_animation.json" autoplay loop mode="forward"></dotlottie-wc>' +
      '</div>' +
      '<span class="custom-loader"></span>' +
      '<p class="loading-text">Carregando...</p>' +
    '</main>' +
    '<footer class="loading-footer">' +
      '<div class="prevention-tip">' +
        '<span class="tip-label">Dica: </span>' +
        '<span id="tip-text"></span>' +
      '</div>' +
    '</footer>';

  document.body.appendChild(overlay);
  TocarBirds();

  // Fogo: arranca mudo; o volume sobe conforme a passagem (aplicarSomFogo)
  var fire = SimpleAudio.tracks.get('fire');
  if (fire) {
    fire.loop(true).volume(0.001);
    var pf = fire.play();
    if (pf && typeof pf.catch === 'function') pf.catch(function () {});
  }

  /* ---- Dicas rotativas (a cada 10 s, com fade) ---- */
  var tipEl = overlay.querySelector('#tip-text');
  var tipContainer = overlay.querySelector('.prevention-tip');
  var tipIndex = 0;
  var tipRotationInterval = null;

  if (tips.length) {
    tipIndex = Math.floor(Math.random() * tips.length);
    tipEl.textContent = tips[tipIndex];

    if (tips.length > 1) {
      tipRotationInterval = setInterval(function () {
        tipContainer.classList.add('tip-fading');

        setTimeout(function () {
          tipIndex = (tipIndex + 1) % tips.length;
          tipEl.textContent = tips[tipIndex];
          tipContainer.classList.remove('tip-fading');
        }, 400);
      }, 10000);
    }
  }

  /* ---- Barra de progresso ---- */
  var loaded = 0;
  var total = imagesCritical.length;
  var tempoInicio = Date.now();
  var tempoMinimo = 2200;   // o ecrã fica pelo menos este tempo (ms)

  function updateProgress() {
    loaded++;
    var pct = Math.round((loaded / total) * 100);
    overlay.style.setProperty('--progress', pct + '%');
    if (loaded >= total) finishLoading();
  }

  var carregamentoFechado = false;

  function finishLoading() {
    if (carregamentoFechado) return;
    carregamentoFechado = true;
    var passado = Date.now() - tempoInicio;
    var faltam = Math.max(0, tempoMinimo - passado);
    setTimeout(morphOut, faltam + 300);
  }

  /* ---- Saída: o título do loading "voa" até ao título real ---- */
  function morphOut() {
    if (tipRotationInterval) {
      clearInterval(tipRotationInterval);
      tipRotationInterval = null;
    }

    var titleEl = overlay.querySelector('.loading-title');
    var targetTitle = document.querySelector('.sombrinha h1');

    if (targetTitle) {
      targetTitle.style.transition = 'none';
      targetTitle.style.opacity = '0';
    }

    // Dois rAF: garante que o browser já pintou o estado inicial
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        animarTitulo(titleEl, targetTitle);
      });
    });
  }

  function animarTitulo(titleEl, targetTitle) {
    // Fallback: sem título de destino → só faz fade do overlay
    if (!titleEl || !targetTitle) {
      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
        startBackgroundPreload();
        if (targetTitle) {
          targetTitle.style.transition = 'opacity 0.4s ease';
          targetTitle.style.opacity = '1';
          targetTitle.setAttribute('tabindex', '-1');
          targetTitle.focus();
        }
      }, 700);
      return;
    }

    // Calcula a translação/escala que leva o título do loading ao título real
    var fromRect = titleEl.getBoundingClientRect();
    var toRect   = targetTitle.getBoundingClientRect();

    var scaleX = toRect.width / fromRect.width;
    var scaleY = toRect.height / fromRect.height;
    var deltaX = toRect.left - fromRect.left;
    var deltaY = toRect.top - fromRect.top - 30;   // -30: ajuste fino visual

    titleEl.style.transform = 'translate(0px, 0px) scale(1)';
    void titleEl.offsetWidth;                      // força reflow

    var terminou = false;

    function aoTerminar() {
      if (terminou) return;
      terminou = true;
      overlay.remove();
      startBackgroundPreload();

      // Foco vai para o conteúdo principal
      var $title = $('.sombrinha h1');
      if ($title.length) $title.attr('tabindex', '-1').focus();
    }

    titleEl.style.transition = 'transform 1.0s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
    titleEl.addEventListener('transitionend', aoTerminar, { once: true });
    setTimeout(aoTerminar, 1400);                  // salvaguarda se transitionend não disparar

    // Título final: pronto para aparecer
    targetTitle.style.transition = 'opacity 0.6s ease';
    targetTitle.style.opacity = '0';

    requestAnimationFrame(function () {
      titleEl.style.transform =
        'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scaleX + ', ' + scaleY + ')';

      titleEl.style.opacity = '0';                 // clone desaparece
      targetTitle.style.opacity = '1';             // título real aparece (crossfade)

      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
    });
  }

  /* ---- Arranque do pré-carregamento crítico ---- */
  imagesCritical.forEach(function (src) {
    var img = new Image();
    var retried = false;
    img.onload = updateProgress;
    img.onerror = function () {
      if (!retried) {
        retried = true;
        // 2.ª tentativa com query string para contornar uma resposta em cache
        img.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'retry=1';
      } else {
        console.warn('[preload] falhou:', src);
        updateProgress();   // não deixa a barra encravar
      }
    };
    img.src = src;
  });

  // Imagem crítica que nunca responde: avança ao fim de 15 s
  setTimeout(function () {
    if (carregamentoFechado) return;
    overlay.style.setProperty('--progress', '100%');
    finishLoading();
  }, 15000);
});

/* ==========================================================================
   [13] AJUSTES DE ALTURA (passagens 13, 19 e finais)
   ========================================================================== */
function ajustarProntoEvacuar() {
  var stage = document.querySelector('.prontoevacuar-stage');
  var box = document.querySelector('#prontoevacuarScene .text-box');
  if (!stage || !box) return;
  stage.style.setProperty('--pe-textbox-px', box.getBoundingClientRect().height + 'px');
}

/* Passagem 19: altura da camada evacuar = espaço acima da text-box */
function ajustarEvacuar() {
  var ov  = document.querySelector('.image-overlay.evacuar');
  var box = document.querySelector('.text-box');
  if (!ov || !box) return;
  ov.style.setProperty('--ev-textbox-px', box.getBoundingClientRect().height + 'px');
}

/* Passagens com pan (casa ardida / final-2): altura da imagem = espaço acima da text-box */
function ajustarCasaArdida() {
  var box = document.querySelector('.text-box');
  if (!box) return;
  var h = box.getBoundingClientRect().height + 'px';
  document.querySelectorAll('.image-bg.casa-ardida, .pan-final, .resultado-casa .image-bg, .resultado-seguranca .image-bg, .resultado-kit .image-overlay').forEach(function (el) {
    el.style.setProperty('--ca-textbox-px', h);
  });
}

/* Um só ponto de reajuste: chamado no resize, ao mudar a letra e no :passageend */
function reajustarCenas() {
  ajustarProntoEvacuar();
  ajustarEvacuar();
  ajustarCasaArdida();
  ajustarCaderno();
}
$(window).on('resize', reajustarCenas);

/* ==========================================================================
   [14] SCROLLBAR FALSA (telemóvel/tablet — ecrãs touch)
   Esconde a scrollbar nativa (CSS) e desenha uma barra com o mesmo estilo do
   desktop sobre .text-scroll e .alarm. Só ativa com (pointer: coarse).
   window.refreshFakeScrollbars() recalcula (usado ao mudar o tamanho da letra).
   ========================================================================== */
(function () {
  if (!window.matchMedia('(pointer: coarse)').matches) return;

  var instances = [];

  function makeBar() {
    var track = document.createElement('div');
    track.className = 'fake-scrollbar-track';
    var thumb = document.createElement('div');
    thumb.className = 'fake-scrollbar-thumb';
    track.appendChild(thumb);
    document.body.appendChild(track);
    return { track: track, thumb: thumb };
  }

  // Posiciona a barra sobre o elemento e mostra-a durante 0,9 s
  function update(inst) {
    var el = inst.scrollEl;
    var rect = el.getBoundingClientRect();
    var scrollable = el.scrollHeight > el.clientHeight + 1;

    if (!scrollable || rect.height === 0) {
      inst.track.classList.remove('visible');
      return;
    }

    var trackH = rect.height - 12;
    var thumbH = Math.max(26, (el.clientHeight / el.scrollHeight) * trackH);
    var maxThumbTop = trackH - thumbH;
    var maxScroll = el.scrollHeight - el.clientHeight;
    var ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
    var thumbTop = maxThumbTop * ratio;

    inst.track.style.top = (rect.top + 6) + 'px';
    inst.track.style.height = trackH + 'px';
    inst.track.style.left = (rect.right - 8) + 'px';
    inst.thumb.style.height = thumbH + 'px';
    inst.thumb.style.transform = 'translateY(' + thumbTop + 'px)';

    inst.track.classList.add('visible');
    clearTimeout(inst.hideTimer);
    inst.hideTimer = setTimeout(function () {
      inst.track.classList.remove('visible');
    }, 900);
  }

  function attach(el) {
    if (!el || el.__fakeScrollbar) return;
    el.__fakeScrollbar = true;
    var bar = makeBar();
    var inst = { scrollEl: el, track: bar.track, thumb: bar.thumb, hideTimer: null };
    instances.push(inst);
    el.addEventListener('scroll', function () { update(inst); }, { passive: true });
    update(inst);
  }

  function detachAll() {
    instances.forEach(function (inst) {
      inst.track.remove();
      inst.scrollEl.__fakeScrollbar = false;
    });
    instances = [];
  }

  function scanAndAttach() {
    detachAll();
    document.querySelectorAll('.text-scroll, .alarm').forEach(attach);
  }

  window.refreshFakeScrollbars = function () {
    instances.forEach(update);
  };

  // A cada passagem recria as barras (o DOM mudou)
  $(document).on(':passageend', function () {
    setTimeout(scanAndAttach, 80);
  });

  $(window).on('resize', function () {
    instances.forEach(update);
  });
})();

/* ==========================================================================
   [14B] CONTINUIDADE DE CAMADAS (casa / fumo)
   --------------------------------------------------------------------------
   O SugarCube recria o DOM a cada passagem, o que faz as animações das
   camadas reiniciarem. Aqui guardamos o estado das camadas da casa ao sair
   de uma passagem e, na seguinte, as camadas que já existiam:
     - animações finitas (fade de entrada) ficam logo no estado final;
     - animações infinitas (drift, vibrar, subida do fumo) retomam a fase.
   Só as camadas novas fazem a animação de entrada.
   Para incluir mais imagens neste comportamento, acrescentar a classe
   a CAMADAS_CASA_RE.
   ========================================================================== */
var CAMADAS_CASA_RE = /^(casa|casa-semjanela|casa-semjanela-jardim|casafumo[1-6]|fumo-casa)$/;
var CAMADAS_CASA_SEL = '.image-bg, .image-overlay, .image-fumo, .fumo-casa, .fumo-casa > i';
var camadasAnteriores = null;

/* Identifica uma camada pela imagem (não pelas classes de animação, que
   mudam entre passagens). Os focos de .fumo-casa identificam-se pela posição. */
function assinaturaCamada(el) {
  var pai = el.parentNode;
  if (pai && pai.classList && pai.classList.contains('fumo-casa')) {
    return 'fumo-casa>i' + Array.prototype.indexOf.call(pai.children, el);
  }
  var partes = [];
  for (var i = 0; i < el.classList.length; i++) {
    if (CAMADAS_CASA_RE.test(el.classList[i])) partes.push(el.classList[i]);
  }
  return partes.length ? partes.sort().join('.') : null;
}

/* Chamado em :passagestart (a cena anterior ainda está no DOM). */
function capturarCamadasCasa(nomePassagem) {
  camadasAnteriores = null;
  if (nomePassagem === 'Start' || nomePassagem === '⟲' ||
      nomePassagem === '29' || nomePassagem === '35') return;

  var mapa = {}, algum = false;
  $('.scene').not('.alarm-scene').find(CAMADAS_CASA_SEL).each(function () {
    var sig = assinaturaCamada(this);
    if (!sig || !this.getAnimations) return;

    var anims = {};
    this.getAnimations().forEach(function (a) {
      if (a.animationName && a.currentTime != null) anims[a.animationName] = a.currentTime;
    });
    mapa[sig] = anims;
    algum = true;
  });
  camadasAnteriores = algum ? mapa : null;
}

/* Chamado em :passageend (as camadas novas já estão no DOM, no mesmo
   "tick", por isso não chega a haver um frame com o fade a zero). */
function aplicarContinuidadeCamadas() {
  var ant = camadasAnteriores;
  camadasAnteriores = null;
  if (!ant) return;

  $('.scene').not('.alarm-scene').find(CAMADAS_CASA_SEL).each(function () {
    var sig = assinaturaCamada(this);
    if (!sig || !ant[sig] || !this.getAnimations) return;

    this.getAnimations().forEach(function (a) {
      if (!a.animationName || !a.effect) return;
      if (a.animationName === 'fumo-sobe-acalma') return;   // 39: deixa correr desde o início
      var infinita = a.effect.getComputedTiming().iterations === Infinity;
      if (infinita) {
        if (ant[sig][a.animationName] != null) a.currentTime = ant[sig][a.animationName];
      } else {
        a.finish();
      }
    });
  });
}

/* ==========================================================================
   [14C] CENA SÓ APARECE COM AS IMAGENS PRONTAS
   --------------------------------------------------------------------------
   Evita ver o fumo/overlays sem o fundo quando uma imagem ainda não carregou
   ou não foi descodificada. Se tudo já estiver pronto, não faz nada.
   ========================================================================== */
var IMG_CENA_MAX_MS = 3000;   // limite de espera (nunca bloqueia mais do que isto)
var imgsProntas = {};         // urls já carregados e descodificados

function urlsDeFundoDaCena($cena) {
  var urls = [];
  $cena.find('*').addBack().each(function () {
    var bg = getComputedStyle(this).backgroundImage;
    if (!bg || bg === 'none') return;
    var re = /url\(["']?([^"')]+)["']?\)/g, m;
    while ((m = re.exec(bg))) {
      if (m[1].indexOf('data:') !== 0 && urls.indexOf(m[1]) === -1) urls.push(m[1]);
    }
  });
  return urls;
}

function aguardarImagensDaCena() {
  var p = passage();
  if (p === 'Start') return;                       // o ecrã de carregamento já trata disto

  var $cena = $('.scene').not('.alarm-scene');
  if (!$cena.length) return;

  var pendentes = urlsDeFundoDaCena($cena).filter(function (u) { return !imgsProntas[u]; });
  if (!pendentes.length) return;

  var restantes = pendentes.length;
  var revelado = false;
  $cena.addClass('a-carregar');

  function revelar() {
    if (revelado || passage() !== p) return;       // já saiu da passagem: não mexe na nova
    revelado = true;
    $('.scene').removeClass('a-carregar');
  }

  function pronta(u) {
    imgsProntas[u] = true;
    if (--restantes <= 0) revelar();
  }

  pendentes.forEach(function (u) {
    var img = new Image();
    img.src = u;
    if (img.decode) {
      img.decode().then(function () { pronta(u); }, function () { pronta(u); });
    } else if (img.complete) {
      pronta(u);
    } else {
      img.onload = img.onerror = function () { pronta(u); };
    }
  });

  setTimeout(revelar, IMG_CENA_MAX_MS);
}

/* ==========================================================================
   [15] EVENTOS PRINCIPAIS DO SUGARCUBE
   --------------------------------------------------------------------------
   :passagestart → antes de a passagem aparecer (reset de estado, áudio)
   :passageend   → depois de o DOM existir (texto, UI, cenas)
   ========================================================================== */

/* ---- 15.1 :passagestart ---- */
$(document).on(':passagestart', function (ev) {
  passageStartTime = Date.now();
  var name = ev.passage.title;
  capturarCamadasCasa(name);   // [14B] antes de qualquer outra coisa mexer na cena
  applyAnimationsState();

  // Passagem inicial: repõe o estado dos pássaros, do pânico e do temporizador
  if (name === 'Start') {
    birdsStarted = false;
    var birds = SimpleAudio.tracks.get('birds');
    if (birds) birds.stop();
    earRinging21FadeIniciado = false;
    resetTimer();
    Object.assign(State.variables, setup.estadoInicial);   // reset completo para novas jogadas
  }

  // Limpa o que pertencia à passagem anterior
  cancelarAutoFim();
  cancelarCena();
  cancelarAgendadas();
  TocarBirds();
  pauseTimer();
  timerTextReady = false;
  passageTextDone = false;
  $('#decision-timer').remove();

  var porCima = CAIXAS_POR_CIMA.indexOf(name) > -1;   // Sobre / Guia / ⟲: não mexem em nada

  if (!porCima) {
    pararSonsCurtos(name);
    aplicarSomBirds(name);
    aplicarSomFogo(name);
    aplicarFogoARecuar(name);
  }

  // Cronómetro: passagens com contador criam-no; as restantes limpam-no
  if (TIMER_PASSAGES.indexOf(name) > -1) {
    startDecisionTimer();
  } else if (!porCima) {
    resetTimer();
  }

  if (!porCima) {
    aplicarSonsPontuais(name);
    aplicarSomEarRinging(name);
  }
  registarEsperasDaPassagem(name);


  // Passagem 13: dispara a sequência de imagens (.play ativa as animações CSS)
  if (name === '13' || name === '13-Laurinda') {
    setTimeout(function () {
      $('.prontoevacuar-stage').addClass('play');
    }, 100);
  }

  // Passagem 2.1 (telemóvel): dimensiona o telefone e reajusta ao rodar/redimensionar
  if (name === '2.1') {
    setTimeout(function () {
      ajustarPhone();
      var scene = document.querySelector('.phone-scene');
      if (scene) {
        scene.style.display = 'flex';
        scene.style.alignItems = 'center';
        scene.style.justifyContent = 'center';
      }
    }, 200);
    $(window).off('resize.phone').on('resize.phone', ajustarPhone);
  } else {
    $(window).off('resize.phone');
  }
});

/* ---- 15.2 :passageend ---- */
$(document).on(':passageend', function () {

  aplicarContinuidadeCamadas();   // [14B] camadas que já existiam não reaparecem
  aguardarImagensDaCena();        // [14C] esconde as camadas até as imagens estarem prontas
  aplicarFonte();   // reaplica o tamanho da letra a cada passagem

  // O botão de recomeçar nativo (.ui-btn) mostra só o símbolo ↻
  if (passage() === '2.1') criarEcraTelemovel();

  // 29: o texto só arranca depois da sequência das sirenes (ver [7C])
  if ((passage() === '29' || passage() === '35') && duracaoDesfalecer() > 0) {
    sequenciaDesfalecer();
  } else if (passage() !== '⟲') {
    // A passagem '⟲' (confirmar recomeçar) não tem texto animado
    iniciarTextoAnimado();
  }

  // Recomeçar: guardar cena / aplicar cena guardada
  guardarCenaParaRecomecar();
  aplicarCenaNoRecomecar();

  abrirFocoDoAlerta();
  preencherIconesDoGuia();

  // Chevron nos botões principais da página inicial (ex.: "Começar")
  $('.sombrinha .choices > a, .sombrinha .choices > button').each(function () {
    if (!$(this).find('.btn-chevron').length) {
      $(this).append('<span class="btn-chevron" aria-hidden="true">' + ICON_CHEVRON + '</span>');
    }
  });

  aplicarIconeFechar();
  $('.alarm .confirm-restart a').each(function () {
    if (!$(this).find('.ph-icon').length) $(this).prepend(ICON_RESTART + ' ');
  });
  reajustarCenas();
  setTimeout(reajustarCenas, 60);   // depois de aplicarFonte() assentar
});

/* ---- 15.3 :passagestart (uma vez) — elementos fixos da interface ----
   O botão de som e o painel de definições registam-se à parte ([5.7] e [11]). */
$(document).one(':passagestart', function () {
  criarAvisoDeRotacao();
  tentarBloquearOrientacao();
});