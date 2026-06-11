import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const en = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/i18n/messages/en.json"), "utf8")
);

function deepTranslate(obj, map) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      result[key] = deepTranslate(value, map[key] ?? {});
      continue;
    }

    result[key] = map[key] ?? value;
  }

  return result;
}

const es = deepTranslate(en, {
  nav: {
    matches: "Partidos",
    analytics: "Análisis",
    strategies: "Estrategias",
    tracks: "Seguimiento",
    portfolio: "Portafolio",
    primaryNavigation: "Navegación principal"
  },
  wallet: {
    portfolio: "Portafolio",
    referral: "Referidos",
    fastBid: "Oferta rápida",
    notification: "Notificaciones",
    logout: "Cerrar sesión",
    language: "Idioma",
    copyPolymarketAddress: "Copiar dirección de Polymarket",
    toggleNotifications: "Activar notificaciones",
    balance: "Saldo",
    deposit: "Depositar",
    openPortfolio: "Abrir portafolio",
    login: "Iniciar sesión",
    connecting: "Conectando...",
    connectingWallet: "Conectando billetera…",
    checkingDepositWallet: "Verificando billetera de depósito…",
    depositWalletDeployed: "La billetera de depósito ya está desplegada",
    deployingWallet: "Desplegando billetera…",
    awaitingSessionSignature: "Esperando firma de sesión…",
    creatingSession: "Creando sesión…",
    checkingCredentials: "Verificando credenciales…",
    tradingAlreadyEnabled: "El trading ya está habilitado",
    checkingNetwork: "Verificando red…",
    switchingToPolygon: "Cambiando a Polygon…",
    awaitingClobSignature: "Esperando firma CLOB…",
    derivingCredentials: "Derivando credenciales…",
    checkingTokenApproval: "Verificando aprobación de tokens…",
    tokensAlreadyAuthorized: "Tokens ya autorizados",
    awaitingTokenApprovalSignature: "Esperando firma de aprobación de tokens…",
    submittingTokenApproval: "Enviando aprobación de tokens…",
    verifyingReadiness: "Verificando preparación…",
    fastBidSetting: "Configuración de oferta rápida",
    fastBidAmount: "Monto de oferta rápida",
    save: "Guardar",
    close: "Cerrar"
  },
  footer: {
    copyright: "© {year} Prophet. Todos los derechos reservados.",
    privacyPolicy: "Política de privacidad",
    termsOfService: "Términos de servicio"
  },
  auth: {
    welcomeTitle: "Bienvenido a Prophet",
    welcomeDescription: "Configura tu billetera una vez para operar mercados de {brand} a través de Prophet.",
    brandName: "Polymarket",
    disclaimer: "Los datos de mercado son solo informativos y no constituyen asesoramiento financiero. Tú mantienes el control de tus fondos.",
    tradingUnavailable: "Trading no disponible",
    enableTrading: "Habilitar trading",
    connectWallet: "Conectar billetera",
    connectWalletDescription: "Conecta la billetera con la que deseas operar.",
    approveUsdc: "Aprobar USDC",
    approveUsdcDescription: "Permite que tu billetera use USDC al colocar órdenes.",
    enableOrders: "Habilitar órdenes",
    enableOrdersDescription: "Firma un mensaje para que Prophet envíe tus órdenes a Polymarket. Esto no mueve fondos.",
    polygonHint: "Cambia tu billetera a Polygon mainnet (chainId 137) antes de firmar.",
    continue: "Continuar",
    retry: "Reintentar",
    done: "Listo",
    signMessage: "Firmar mensaje",
    approveTokens: "Aprobar tokens"
  },
  common: {
    loading: "Cargando...",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    confirm: "Confirmar",
    yes: "Sí",
    no: "No",
    buy: "Comprar",
    sell: "Vender",
    unknownWalletError: "Error de billetera desconocido.",
    userRejectedRequest: "El usuario rechazó la solicitud.",
    signatureCancelled: "La solicitud de firma fue cancelada.",
    prophetHome: "Inicio de Prophet"
  },
  toast: {
    orderSubmitted: "Orden enviada",
    orderFailed: "Orden fallida",
    viewPortfolio: "Ver portafolio",
    orderCancelled: "Orden cancelada",
    ordersCancelled: "Órdenes canceladas",
    someOrdersNotCancelled: "Algunas órdenes no se cancelaron",
    cancelledFailed: "{cancelled} canceladas, {failed} fallidas",
    sellShares: "Vender {outcome} · {shares} acciones",
    buyOutcome: "{verb} {outcome} · {cost} costo est.",
    bidFor: "Ofertar por",
    order: "orden",
    orders: "órdenes"
  },
  trade: {
    placeOrder: "Colocar orden",
    buy: "Comprar",
    sell: "Vender",
    market: "Mercado",
    limit: "Límite",
    yes: "Sí",
    no: "No",
    shares: "Acciones",
    value: "Valor",
    total: "Total",
    enableTrading: "Habilitar trading",
    draw: "Empate",
    over: "Más de",
    under: "Menos de",
    home: "Local",
    away: "Visitante",
    orderbook: "Libro de órdenes",
    showOrderbook: "Mostrar libro de órdenes"
  },
  portfolio: {
    portfolio: "Portafolio",
    connectWallet: "Conectar billetera",
    deposit: "Depositar",
    withdraw: "Retirar",
    yourPositions: "Tus posiciones",
    market: "Mercado",
    redeem: "Canjear",
    sell: "Vender",
    noOpenPositions: "Sin posiciones abiertas"
  },
  strategy: {
    available: "Disponibles",
    ended: "Finalizadas",
    placeBid: "Colocar oferta",
    understood: "Entendido"
  },
  home: {
    matches: "Partidos",
    worldCupWinner: "Campeón del Mundial",
    volume: "Volumen",
    time: "Hora"
  },
  tracks: {
    emptyMessage: "Aún no sigues ningún equipo o partido.",
    startToExplore: "Empezar a explorar",
    connectWallet: "Conectar billetera"
  },
  referral: {
    referralProgram: "Programa de referidos",
    inviteFriends: "Invitar amigos",
    claim: "Reclamar"
  },
  legal: {
    termsTitle: "Términos y condiciones",
    privacyTitle: "Política de privacidad",
    translationNotice: "Este documento se proporciona en inglés. Las versiones traducidas son solo de referencia."
  },
  notification: {
    worldCupEventLabel: "Copa Mundial de la FIFA 2026",
    drawQuestionTitle: "¿Este partido terminará en empate en la {event}?",
    winQuestionTitle: "¿Ganará {teamName} la {event}?",
    matchPreviewStart: "comenzará el {kickoff}",
    matchVs: "VS",
    defaultMarket: "Mercado",
    defaultEventTitle: "este mercado",
    volumeTitle: "El trading aumentó en {eventTitle}",
    kickoffPrefix: "Inicio:",
    months: {
      jan: "ene",
      feb: "feb",
      mar: "mar",
      apr: "abr",
      may: "may",
      jun: "jun",
      jul: "jul",
      aug: "ago",
      sep: "sep",
      oct: "oct",
      nov: "nov",
      dec: "dic"
    }
  }
});

const ko = deepTranslate(en, {
  nav: {
    matches: "경기",
    analytics: "분석",
    strategies: "전략",
    tracks: "트랙",
    portfolio: "포트폴리오",
    primaryNavigation: "기본 탐색"
  },
  wallet: {
    portfolio: "포트폴리오",
    referral: "추천",
    fastBid: "빠른 입찰",
    notification: "알림",
    logout: "로그아웃",
    language: "언어",
    balance: "잔액",
    deposit: "입금",
    login: "로그인",
    connecting: "연결 중...",
    save: "저장",
    close: "닫기"
  },
  footer: {
    copyright: "© {year} Prophet. 모든 권리 보유.",
    privacyPolicy: "개인정보 처리방침",
    termsOfService: "서비스 약관"
  },
  auth: {
    welcomeTitle: "Prophet에 오신 것을 환영합니다",
    enableTrading: "거래 활성화",
    connectWallet: "지갑 연결",
    continue: "계속",
    retry: "재시도",
    done: "완료"
  },
  common: {
    loading: "로딩 중...",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    yes: "예",
    no: "아니오",
    buy: "매수",
    sell: "매도"
  },
  toast: {
    orderSubmitted: "주문 제출됨",
    orderFailed: "주문 실패",
    viewPortfolio: "포트폴리오 보기"
  },
  trade: { buy: "매수", sell: "매도", yes: "예", no: "아니오" },
  portfolio: { portfolio: "포트폴리오", deposit: "입금", withdraw: "출금" },
  home: { matches: "경기" },
  tracks: { connectWallet: "지갑 연결" },
  legal: {
    termsTitle: "이용약관",
    privacyTitle: "개인정보 처리방침"
  },
  notification: {
    worldCupEventLabel: "2026 FIFA 월드컵",
    drawQuestionTitle: "이 경기가 {event}에서 무승부로 끝날까요?",
    winQuestionTitle: "{teamName}이(가) {event}에서 우승할까요?",
    matchPreviewStart: "{kickoff}에 시작합니다",
    matchVs: "VS",
    defaultMarket: "마켓",
    defaultEventTitle: "이 마켓",
    volumeTitle: "{eventTitle} 거래가 활발해졌습니다",
    kickoffPrefix: "킥오프:",
    months: {
      jan: "1월",
      feb: "2월",
      mar: "3월",
      apr: "4월",
      may: "5월",
      jun: "6월",
      jul: "7월",
      aug: "8월",
      sep: "9월",
      oct: "10월",
      nov: "11월",
      dec: "12월"
    }
  }
});

const ja = deepTranslate(en, {
  nav: {
    matches: "試合",
    analytics: "分析",
    strategies: "戦略",
    tracks: "トラック",
    portfolio: "ポートフォリオ",
    primaryNavigation: "メインナビゲーション"
  },
  wallet: {
    portfolio: "ポートフォリオ",
    referral: "紹介",
    fastBid: "クイック入札",
    notification: "通知",
    logout: "ログアウト",
    language: "言語",
    balance: "残高",
    deposit: "入金",
    login: "ログイン",
    connecting: "接続中...",
    save: "保存",
    close: "閉じる"
  },
  footer: {
    copyright: "© {year} Prophet. All rights reserved.",
    privacyPolicy: "プライバシーポリシー",
    termsOfService: "利用規約"
  },
  auth: {
    welcomeTitle: "Prophetへようこそ",
    enableTrading: "取引を有効化",
    connectWallet: "ウォレットを接続",
    continue: "続行",
    retry: "再試行",
    done: "完了"
  },
  common: {
    loading: "読み込み中...",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    yes: "はい",
    no: "いいえ",
    buy: "買い",
    sell: "売り"
  },
  toast: {
    orderSubmitted: "注文を送信しました",
    orderFailed: "注文に失敗しました",
    viewPortfolio: "ポートフォリオを表示"
  },
  trade: { buy: "買い", sell: "売り", yes: "はい", no: "いいえ" },
  portfolio: { portfolio: "ポートフォリオ", deposit: "入金", withdraw: "出金" },
  home: { matches: "試合" },
  tracks: { connectWallet: "ウォレットを接続" },
  legal: {
    termsTitle: "利用規約",
    privacyTitle: "プライバシーポリシー"
  },
  notification: {
    worldCupEventLabel: "2026 FIFAワールドカップ",
    drawQuestionTitle: "この試合は{event}で引き分けに終わるか？",
    winQuestionTitle: "{teamName}は{event}で優勝するか？",
    matchPreviewStart: "{kickoff}に開始",
    matchVs: "VS",
    defaultMarket: "マーケット",
    defaultEventTitle: "このマーケット",
    volumeTitle: "{eventTitle}の取引が活発化",
    kickoffPrefix: "キックオフ:",
    months: {
      jan: "1月",
      feb: "2月",
      mar: "3月",
      apr: "4月",
      may: "5月",
      jun: "6月",
      jul: "7月",
      aug: "8月",
      sep: "9月",
      oct: "10月",
      nov: "11月",
      dec: "12月"
    }
  }
});

const zhTW = deepTranslate(en, {
  nav: {
    matches: "賽事",
    analytics: "分析",
    strategies: "策略",
    tracks: "追蹤",
    portfolio: "投資組合",
    primaryNavigation: "主要導覽"
  },
  wallet: {
    portfolio: "投資組合",
    referral: "推薦",
    fastBid: "快速出價",
    notification: "通知",
    logout: "登出",
    language: "語言",
    balance: "餘額",
    deposit: "入金",
    login: "登入",
    connecting: "連線中...",
    save: "儲存",
    close: "關閉"
  },
  footer: {
    copyright: "© {year} Prophet. 版權所有。",
    privacyPolicy: "隱私權政策",
    termsOfService: "服務條款"
  },
  auth: {
    welcomeTitle: "歡迎使用 Prophet",
    enableTrading: "啟用交易",
    connectWallet: "連接錢包",
    continue: "繼續",
    retry: "重試",
    done: "完成"
  },
  common: {
    loading: "載入中...",
    save: "儲存",
    cancel: "取消",
    close: "關閉",
    yes: "是",
    no: "否",
    buy: "買入",
    sell: "賣出"
  },
  toast: {
    orderSubmitted: "訂單已提交",
    orderFailed: "訂單失敗",
    viewPortfolio: "查看投資組合"
  },
  trade: { buy: "買入", sell: "賣出", yes: "是", no: "否" },
  portfolio: { portfolio: "投資組合", deposit: "入金", withdraw: "提款" },
  home: { matches: "賽事" },
  tracks: { connectWallet: "連接錢包" },
  legal: {
    termsTitle: "條款與條件",
    privacyTitle: "隱私權政策"
  },
  notification: {
    worldCupEventLabel: "2026 FIFA 世界盃",
    drawQuestionTitle: "這場比賽會在{event}以和局結束嗎？",
    winQuestionTitle: "{teamName}會贏得{event}嗎？",
    matchPreviewStart: "將於 {kickoff} 開始",
    matchVs: "VS",
    defaultMarket: "市場",
    defaultEventTitle: "此市場",
    volumeTitle: "{eventTitle} 交易升溫",
    kickoffPrefix: "開球:",
    months: {
      jan: "1月",
      feb: "2月",
      mar: "3月",
      apr: "4月",
      may: "5月",
      jun: "6月",
      jul: "7月",
      aug: "8月",
      sep: "9月",
      oct: "10月",
      nov: "11月",
      dec: "12月"
    }
  }
});

const locales = { es, ko, ja, "zh-TW": zhTW };

for (const [locale, messages] of Object.entries(locales)) {
  const filePath = path.join(ROOT, "src/i18n/messages", `${locale}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`Wrote ${filePath}`);
}
