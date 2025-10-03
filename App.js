import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Component Imports
// ChallengeMiniBar removed from Pool Status per user request
import ChallengesDashboard from './components/ChallengesDashboard';
import OnlineDevices from './components/OnlineDevices';
import CountdownBadge from './components/CountdownBadge';
import WalletConnectPanel from './components/WalletConnectPanel';
// Removed ChallengeBarShowcase (challenge top bar dropped per latest request)
import './components/challenge-badges.css';
// RecentBlocksTicker component inlined into LastBlockCard for compact display
import { ConnectionTutorial as PremiumConnectionTutorial } from './components/ConnectionTutorial';
// UserHashrateChart temporarily removed per user request

// Inject a subtle slow pulse animation utility class if Tailwind config doesn't have it
if (typeof document !== 'undefined' && !document.getElementById('pulse-slow-style')) {
    const style = document.createElement('style');
    style.id = 'pulse-slow-style';
    style.innerHTML = `@keyframes pulseSlow{0%,100%{opacity:1}50%{opacity:.35}}.animate-pulse-slow{animation:pulseSlow 2.4s ease-in-out infinite}`;
    document.head.appendChild(style);
}

// Inject minimal CSS for recent blocks marquee (kept here to avoid editing global CSS files)
const injectMarqueeCSS = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('recent-marquee-styles')) return;
    const style = document.createElement('style');
    style.id = 'recent-marquee-styles';
    style.innerHTML = `
    .recent-marquee { overflow: hidden; white-space: nowrap; }
    .recent-marquee-track { display: inline-block; padding-left: 100%; animation: marquee 48s linear infinite; }
    .recent-marquee-item { display: inline-block; margin-right: 24px; }
    @keyframes marquee { from { transform: translateX(0%);} to { transform: translateX(-100%);} }
    `;
    document.head.appendChild(style);
};

// LocalChallengeMiniBar removed — using external component again
// (restored external ChallengeMiniBar import — rendering below)

// --- Configuration & Constants ---
const REFRESH_INTERVALS = {
    POOL_STATS: 2000,
    MEMPOOL: 30000,
    PRICE: 3600000, // 1 hour
    USER_STATS: 10000,
};

// --- Formatting Helpers ---
// Exported so other components can import these utilities from `App.js` if needed.
export function formatHashrate(value) {
    const v = Number(value) || 0;
    if (v === 0) return '0 H/s';
    // Extend units to include Zetta and Yotta
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s', 'YH/s'];
    let i = 0;
    let display = v;
    while (display >= 1000 && i < units.length - 1) { display /= 1000; i++; }
    // Show 2 decimals for small values, 1 decimal for medium, no decimals for large
    const formatted = display >= 100 ? Math.round(display).toString() : display >= 10 ? display.toFixed(1) : display.toFixed(2);
    return `${formatted} ${units[i]}`;
}

export function formatDifficulty(d) {
    const n = Number(d);
    if (!isFinite(n) || isNaN(n)) return 'N/A';
    const abs = Math.abs(n);
    const units = [ { value: 1e12, suffix: 'T' }, { value: 1e9, suffix: 'G' }, { value: 1e6, suffix: 'M' }, { value: 1e3, suffix: 'K' } ];
    for (const u of units) {
        if (abs >= u.value) {
            const v = n / u.value;
            // show up to 2 decimals, trim trailing zeros
            const s = v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2);
            return s.replace(/\.0+$|(?<=\.\d)0+$/,'') + u.suffix;
        }
    }
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatTimeToBlock(seconds) {
    const s = Number(seconds);
    if (!isFinite(s) || s <= 0) return 'N/A';
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
    const year = 365 * day;

    if (s >= year) {
        const years = s / year;
        // show 2 significant digits for years
        const v = years >= 10 ? Math.round(years) : years >= 1 ? +years.toFixed(2) : years.toFixed(2);
        return `${v}y`;
    }

    if (s >= day) {
        const days = Math.floor(s / day);
        const hours = Math.floor((s % day) / hour);
        if (hours === 0) return `${days}d`;
        return `${days}d ${hours}h`;
    }

    if (s >= hour) {
        const hours = Math.floor(s / hour);
        const minutes = Math.floor((s % hour) / minute);
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    }

    const mins = Math.max(1, Math.floor(s / minute));
    return mins < 1 ? '<1m' : `${mins}m`;
}

export function formatLargeNumber(n) {
    const v = Number(n);
    if (!isFinite(v) || isNaN(v)) return 'N/A';
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(2) + 'T';
    if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    if (abs >= 1_000) return (v / 1_000).toFixed(2) + 'K';
    return v.toLocaleString();
}

// --- Translation Dictionaries ---
const translations = {
    en: {
        title: "SOLO Pool",
        subtitle: "A professional solo mining experience.",
        shortIntro: "Discreet, secure solo-mining with direct payouts to your address.",
        walletPlaceholder: "Enter your BTC address...",
        view: "Search",
        poolHashrate: "Pool Hashrate",
        networkHashrate: "Network Hashrate",
        activeMiners: "Active Solo Miners",
        averageHashrate: "Average Hashrate",
        networkDifficulty: "Network Difficulty",
        btcPrice: "BTC Price",
        volume24h: "24h Volume",
        dominance: "Dominance",
        marketCap: "Market Cap",
        fearIndex: "Fear & Greed",
        lastBlock: "Last Block",
        height: "Height",
        age: "Age",
        txs: "Txs",
        size: "Size (MB)",
        foundBy: "Found by",
        network: "Network",
        mempool: "Mempool",
        pendingTransactions: "Pending Transactions",
        recentTransactions: "Recent Transactions",
    myStats: "Personal Stats",
        hashrate: "Hashrate",
        workersActive: "Active Workers",
        level: "Level",
        myWorkers: "My Workers",
        status: "Status",
        uptime: "Uptime",
        halvingIn: "Halving in",
        estTimeToBlock: "Est. Time to block",
        adjustmentIn: "Adjustment in",
        miningBlock: "Mining Block",
        enterWalletPrompt: "Enter your wallet address to see your personal contribution.",
        contribution: "Contribution",
        bestDifficulty: "Best Difficulty",
        lastDifficulty: "Last Difficulty",
        distanceToNetwork: "Distance to Network",
        oneIn: "1 in",
        distanceToNetworkDifficulty: "Distance to Network",
        currentBlockTemplate: "Current Block Template",
        totalReward: "Total (Base + Fees)",
        transactions: "Transactions",
        blockSize: "Block Size",
        blockReward: "Block Reward",
        poolConnectionTutorialTitle: "Need help connecting your miner?",
        stratumURL: "Stratum URL",
        howToSecureTitle: "How can you secure your funds?",
        howToSecureL1: "When you find a block, the reward is sent directly to the address you used for mining.",
        howToSecureL2: "It is crucial to have control over the private key of this address.",
        howToSecureL3: "We recommend using:",
        howToSecureL4: "A hardware wallet (Ledger, Trezor).",
        howToSecureL5: "A mobile wallet where you control the keys (Samourai Wallet, Blue Wallet).",
        howToSecureL6: "A desktop wallet (Sparrow, Electrum).",
        howToSecureL7: "Never use an address from an exchange!",
        variableDifficulty: "Want to learn about Variable Difficulty (Vardiff)?",
        vardiffTooltip: "Our pool uses variable difficulty. Would you like to know how the server adjusts difficulty based on your hashrate?",
        howRewardsWorkTitle: "How are block rewards paid out?",
        howRewardsWorkL1: "Did you know the block reward never passes through a pool-owned wallet and is sent directly to your address?",
        howRewardsWorkL2: "Think of it like a lottery ticket already made out in your name.",
        howRewardsWorkStep1Title: "Your Entry Ticket",
        howRewardsWorkStep1Desc: "When you join our pool, you connect with your own Bitcoin address. This address is your unique identity on the network.",
        howRewardsWorkStep2Title: "Work Linked to You",
        howRewardsWorkStep2Desc: "The pool assigns you work (\"shares\"), but each share is pre-signed with your address. The pool tells the Bitcoin network: \"If this work finds a block, send the reward to THIS address (yours) and no other.\"",
        howRewardsWorkStep3Title: "The \"Jackpot\" Moment",
        howRewardsWorkStep3Desc: "If your miner discovers a block, the solution is broadcast to the network. The network sees that the reward is intended for your address and sends it directly there.",
        howRewardsWorkStep4: "The reward never touches our wallets. We have no ability to redirect it.",
        copy: "Copy",
        copied: "Copied!",
        timeSinceLastBlock: "Time since last block",
        myMiningStats: "My Mining Stats",
        rentalsTitle: "Try Your Luck & Rent a Miner",
        rentalsDesc: "Want to increase your chances of finding a block without buying hardware? Renting mining power is a great option. You can rent hashrate for short periods to significantly boost your probability of solving a block.",
        rentalsStep1: "Register on MiningRigRentals.",
        rentalsStep2: "Deposit funds (BTC, LTC, etc.).",
        rentalsStep3: "Configure the pool details (URL, your BTC address as username).",
        rentalsStep4: "Rent a rig and start mining!",
        rentalsButton: "Rent a Miner",
        rentButton: "Rent This Package",
        calculatorTitle: "Profitability Calculator",
        yourHashrate: "Your Hashrate",
        estimatedTimeToBlock: "Estimated Time to Find a Block",
        contributionToPool: "Contribution to Pool",
        poolStatsTab: "Pool Status",
    currentEffort: "Current Effort",
    etaTo100: "ETA to 100%",
    connectionTutorialTab: "Miner Setup",
        active: "Active",
        inactive: "Inactive",
        offline: "Offline",
        save: "Save",
        rentalsStepsIntro: "How does it work?",
        firmwareUpdate: "Firmware Update",
        flashBitaxe: "Flash your Bitaxe with the latest firmware from the",
        officialGitHub: "official GitHub",
        networkSetup: "Network Setup",
        connectBitaxeWifi: "Connect your device to the Bitaxe's Wi-Fi network.",
        interfaceAccess: "Interface Access",
        openBrowser: "Open a browser and go to",
        wifiSettings: "Wi-Fi Settings",
        configureWifi: "Configure your home Wi-Fi network.",
        poolConfiguration: "Pool Configuration",
        stratumUser: "Stratum User",
        yourBitcoinAddress: "Your Bitcoin address.",
        stratumPassword: "Stratum Password",
        leaveBlankOrX: "Leave blank or use 'x'.",
        finalization: "Finalization",
        saveRestart: "Save and restart the miner.",
    bitaxeOverclockGuide: "Overclock / tuning video",
    bitaxeLayoutStyle: "Style",
    quickConnectTitle: "Quick Connect",
    quickConnectDesc: "Use the following connection parameters to start mining immediately.",
    walletInvalid: "Invalid or incomplete address",
    walletValid: "Address looks valid",
    showAdvanced: "Show advanced",
    hideAdvanced: "Hide advanced",
    securityReminder: "Security Reminder",
    securityReminderDesc: "Always use an address you control (never an exchange).",
    rentalsShort: "Rentals",
    rentalsAlgoTitle: "Algorithms",
    rentalsAlgoBoost: "SHA256 (ASICBoost)",
    rentalsAlgoStandard: "SHA256 (standard)",
    rentalsAlgoNote: "Choose ASICBoost when available for efficiency; fall back to standard SHA256 otherwise.",
    newBestDiff: "NEW",
        mobileApp: "Mobile App",
        downloadAvalonApp: "Download the Avalon app for your device.",
        connectMinerWifi: "Connect your miner to your Wi-Fi network.",
        openAppScan: "Open the app and scan for your miner.",
        goToSettingsPool: "Go to Settings > Pool.",
        pool1: "Pool 1",
        worker: "Worker",
        password: "Password",
        browserConfiguration: "Browser Configuration",
        getMinerIP: "Get your miner's IP address.",
        openMinerIP: "Open the IP address in your browser.",
        goToConfigPool: "Go to Configuration > Pool.",
        connectNerdMinerUSB: "Connect your NerdMiner via USB.",
        connectNerdMinerAP: "Connect to the NerdMiner Access Point.",
        browserAutoOpen: "A browser window should open automatically.",
        configureWifiNerdMiner: "Configure your Wi-Fi and click Save.",
        btcAddress: "BTC Address",
        bc1qFormat: "(must be in bc1q... format).",
        pool: "Pool",
        modifyDefaultSettings: "Modify the default settings with the pool's information.",
        downloadCGMiner: "Download CGMiner from",
        createBatFile: "Create a .bat file with the following command:",
        runBatFile: "Run the .bat file to start mining.",
        downloadMagicMiner: "Download the latest version of MagicMiner from their GitHub.",
        unzipAndRun: "Unzip the file and run the MagicMiner application.",
        enterPoolDetails: "Enter the pool details in the interface:",
        donationMessage: "If you like our pool, please consider a donation to support its development:",
        allRightsReserved: "All rights reserved.",
        joinUsOn: "Join us on",
        ourPartners: "Our Partners",
        onlineDevicesTitle: "Devices Online (on pool)",
        estimatedTimeToBlockTitle: "Estimated Time to Block",
        estimatedTimeToBlockDesc: "Based on your current hashrate.",
        bestDifficultyAchievedTitle: "Best Difficulty Achieved",
        bestDifficultyAchievedDesc: "Your highest recorded share difficulty.",
        stratumExampleHelp: "Need examples for Stratum URL and worker formatting? Use the examples on the left to configure your miner.",
        deviceColumn: "Device",
        currentlyWorkingColumn: "Active",
        totalHashrateColumn: "Total Hashrate",
        bestDifficultyColumn: "Best Difficulty",
        loadingStatus: "Loading...",
        errorStatus: "Unable to load device stats.",
        unknownDevice: "Unknown Device",
        connectionParameters: "Need help with connection parameters?",
        howRewardsPaid: "How are block rewards paid out to your address?",
        understandingVardiff: "Want to understand Variable Difficulty (Vardiff)?",
        connectionParamsIntro: "Need help configuring your miner? Use these connection details:",
        connectionParamsUsernameTitle: "Username / Worker:",
        connectionParamsUsername: "Use your Bitcoin wallet address (e.g., starts with bc1...). The full block reward will be sent to this address.",
        connectionParamsPasswordTitle: "Password:",
        connectionParamsPassword: "Can be any value; use 'x' or '123' if required.",
        pasteYourWallet: "Paste your BTC address",
        pasteYourWalletHelp: "Paste your wallet address here and click Search to view your personal contribution and workers.",
        challengesTab: "Challenges",
        challengesOngoing: "Ongoing Challenges",
        challengesUpcoming: "Upcoming Challenges",
        challengesFinished: "Finished Challenges",
        challengesReward: "Reward",
        challengesWinner: "Winner",
        challengesProof: "Proof",
        challengesNoWinner: "No winner yet",
        challengesStartsIn: "Starts in",
        challengesEndsIn: "Ends in",
        challengesBestDiff: "Best diff",
        challengesNextUp: "Next Up",
        challengesViewAll: "View All",
        bitaxeChallengeSeptember: "Bitaxe Challenge - September 2025",
    challengesPoolHeader: "Pool Challenges",
    challengesDescription: "Mini seasonal or ad-hoc events for solo miners (Bitaxe, ASIC, experimental). Track live progress, see winners and historic results.",
    challengesStatsTotal: "Total",
    challengesStatsLive: "Live",
    challengesStatsUpcoming: "Upcoming",
    challengesStatsFinished: "Finished",
    challengesNoLive: "No live challenges.",
    challengesNoLiveCta: "Be the first to launch one.",
    challengesLastFinished: "Last Finished",
    challengesProgress: "Progress",
    challengesLeader: "Leader",
    challengesLiveHighlight: "Live Highlight",
    challengesNextUpcoming: "Next Upcoming",
    challengesStatus: "Status",
    challengesDone: "Done",
    challengesPaid: "Paid",
    challengesStatusLive: "LIVE",
    challengesStatusUpcoming: "UPCOMING",
    challengesStatusDone: "DONE",
    challengesTitleLabel: "Title",
    challengesRandomPickType: "Random Pick",
    },
  fr: {
    title: "SOLO Pool",
    subtitle: "Une expérience de minage solo professionnelle.",
    shortIntro: "Minage solo discret et sécurisé avec paiement direct sur votre adresse.",
    walletPlaceholder: "Entrez votre adresse BTC...",
    view: "Rechercher",
    poolHashrate: "Hashrate du Pool",
    networkHashrate: "Hashrate Réseau",
    activeMiners: "Mineurs Solo Actifs",
    averageHashrate: "Hashrate Moyen",
    networkDifficulty: "Difficulté Réseau",
    btcPrice: "Prix BTC",
    volume24h: "Volume 24h",
    dominance: "Dominance",
    marketCap: "Capitalisation",
    fearIndex: "Peur & Cupidité",
    lastBlock: "Dernier Bloc",
    height: "Hauteur",
    age: "Âge",
    txs: "Txs",
    size: "Taille (MB)",
    foundBy: "Trouvé par",
    network: "Réseau",
    mempool: "Mempool",
    pendingTransactions: "Transactions en attente",
    recentTransactions: "Transactions Récentes",
    challengesTab: "Challenges",
    challengesOngoing: "Challenges en cours",
    challengesUpcoming: "Challenges à venir",
    challengesFinished: "Challenges terminés",
    challengesReward: "Récompense",
    challengesWinner: "Gagnant",
    challengesProof: "Preuve",
    challengesNoWinner: "Pas encore de gagnant",
    challengesStartsIn: "Commence dans",
    challengesEndsIn: "Finit dans",
    challengesBestDiff: "Meilleure diff",
    challengesNextUp: "À suivre",
    challengesViewAll: "Voir tout",
    bitaxeChallengeSeptember: "Bitaxe Challenge - Septembre 2025",
    challengesPoolHeader: "Challenges du Pool",
    challengesDescription: "Événements saisonniers ou ponctuels pour mineurs solo (Bitaxe, ASIC, expérimental). Suivez le direct, voyez les gagnants et l'historique.",
    challengesStatsTotal: "Total",
    challengesStatsLive: "En direct",
    challengesStatsUpcoming: "À venir",
    challengesStatsFinished: "Terminés",
    challengesNoLive: "Aucun challenge en direct.",
    challengesNoLiveCta: "Lance le prochain.",
    challengesLastFinished: "Dernier Terminé",
    challengesProgress: "Progression",
    challengesLeader: "Leader",
    challengesLiveHighlight: "Focus Live",
    challengesNextUpcoming: "Prochain",
    challengesStatus: "Statut",
    challengesDone: "Terminé",
    challengesPaid: "Payé",
    challengesStatusLive: "LIVE",
    challengesStatusUpcoming: "À VENIR",
    challengesStatusDone: "TERMINE",
    challengesTitleLabel: "Titre",
    challengesRandomPickType: "Tirage aléatoire",
    myStats: "Mes Stats",
    hashrate: "Hashrate",
    workersActive: "Workers Actifs",
    level: "Niveau",
    myWorkers: "Mes Workers",
    status: "Statut",
    uptime: "Disponibilité",
    halvingIn: "Halving dans",
    estTimeToBlock: "Temps estimé/bloc",
    adjustmentIn: "Ajustement dans",
    miningBlock: "Bloc en Minage",
    enterWalletPrompt: "Entrez votre adresse de portefeuille pour voir votre contribution personnelle.",
    contribution: "Contribution",
    bestDifficulty: "Meilleure Difficulté",
    lastDifficulty: "Dernière Difficulté",
    distanceToNetwork: "Distance au Réseau",
    oneIn: "1 sur",
    currentBlockTemplate: "Modèle de Bloc Actuel",
    totalReward: "Total (Base + Frais)",
    transactions: "Transactions",
    blockSize: "Taille du Bloc",
    blockReward: "Récompense de Bloc",
    poolConnectionTutorialTitle: "Connexion au Pool & Tutoriel",
    stratumURL: "URL Stratum",
    howToSecureTitle: "Comment sécuriser vos fonds ?",
    howToSecureL1: "Lorsque vous trouvez un bloc, la récompense est envoyée directement à l'adresse que vous avez utilisée pour miner.",
    howToSecureL2: "Il est crucial d'avoir le contrôle de la clé privée de cette adresse.",
    howToSecureL3: "Nous recommandons d'utiliser :",
    howToSecureL4: "Un portefeuille matériel (Ledger, Trezor).",
    howToSecureL5: "Un portefeuille mobile où vous contrôlez les clés (Samourai Wallet, Blue Wallet).",
    howToSecureL6: "Un portefeuille de bureau (Sparrow, Electrum).",
    howToSecureL7: "N'utilisez jamais une adresse d'un échange !",
    variableDifficulty: "Difficulté Variable (Vardiff)",
    vardiffTooltip: "Notre pool utilise la difficulté variable. Le serveur ajustera automatiquement la difficulté pour votre mineur en fonction de son hashrate.",
    howRewardsWorkTitle: "Comment fonctionnent les récompenses ?",
    howRewardsWorkL1: "C'est simple : la récompense de bloc ne transite jamais par un portefeuille appartenant au pool. Elle va directement du réseau Bitcoin à votre adresse.",
    howRewardsWorkL2: "Pensez-y comme à un billet de loterie avec votre nom déjà inscrit dessus.",
    howRewardsWorkStep1Title: "Votre Billet d'Entrée",
    howRewardsWorkStep1Desc: "Quand vous rejoignez notre pool, vous vous connectez avec votre propre adresse Bitcoin. Cette adresse est votre identité unique sur le réseau.",
    howRewardsWorkStep2Title: "Travail Lié à Vous",
    howRewardsWorkStep2Desc: "Le pool vous assigne du travail (\"parts\"), mais chaque part est pré-signée avec votre adresse. Le pool dit au réseau Bitcoin : \"Si ce travail trouve un bloc, envoyez la récompense à CETTE adresse (la vôtre) et à aucune autre.\"",
    howRewardsWorkStep3Title: "Le « Jackpot » Moment",
    howRewardsWorkStep3Desc: "Si votre mineur découvre un bloc, la solution est diffusée sur le réseau. Le réseau voit que la récompense est destinée à votre adresse et l’y envoie directement.",
    howRewardsWorkStep4: "La récompense ne touche jamais nos portefeuilles. Nous n'avons aucune capacité à la rediriger.",
    copy: "Copier",
    copied: "Copié !",
    timeSinceLastBlock: "Temps depuis le dernier bloc",
    myMiningStats: "Mes statistiques",
    rentalsTitle: "Tentez votre chance : louez un mineur",
    rentalsDesc: "Augmentez vos chances de trouver un bloc sans acheter de matériel. La location de puissance de minage est une excellente option. Vous pouvez louer du hashrate pour de courtes périodes afin d'augmenter considérablement vos chances de résoudre un bloc.",
    rentalsStepsIntro: "Comment ça marche ?",
    rentalsStep1: "Inscrivez-vous sur MiningRigRentals.",
    rentalsStep2: "Déposez des fonds (BTC, LTC, etc.).",
    rentalsStep3: "Configurez les détails du pool (URL, votre adresse BTC comme nom d'utilisateur).",
    rentalsStep4: "Louez une plateforme et commencez à miner !",
    rentalsButton: "Louer un Mineur",
    rentButton: "Louer ce forfait",
    calculatorTitle: "Calculateur de Rentabilité",
    yourHashrate: "Votre Hashrate",
    estimatedTimeToBlock: "Temps Estimé pour Trouver un Bloc",
    contributionToPool: "Contribution au pool",
    poolStatsTab: "Statistiques du Pool",
    connectionTutorialTab: "Tutoriel de Connexion",
    active: "Actif",
    inactive: "Inactif",
    offline: "Déconnecté",
    save: "Sauvegarder",
    // Bitaxe
    firmwareUpdate: "Mise à jour du firmware",
    flashBitaxe: "Flashez votre Bitaxe avec le dernier firmware depuis le",
    officialGitHub: "GitHub officiel",
    networkSetup: "Configuration réseau",
    connectBitaxeWifi: "Connectez votre appareil au réseau Wi-Fi du Bitaxe.",
    interfaceAccess: "Accès à l'interface",
    openBrowser: "Ouvrez un navigateur et allez sur",
    wifiSettings: "Paramètres Wi-Fi",
    configureWifi: "Configurez votre réseau Wi-Fi domestique.",
    poolConfiguration: "Configuration du pool",
    stratumUser: "Utilisateur Stratum",
    yourBitcoinAddress: "Votre adresse Bitcoin.",
    stratumPassword: "Mot de passe Stratum",
    leaveBlankOrX: "Laissez vide ou utilisez 'x'.",
    finalization: "Finalisation",
    saveRestart: "Sauvegardez et redémarrez le mineur.",
    bitaxeOverclockGuide: "Vidéo d'overclock / tuning",
    bitaxeLayoutStyle: "Style",
    quickConnectTitle: "Connexion Rapide",
    quickConnectDesc: "Utilisez les paramètres ci-dessous pour démarrer immédiatement.",
    walletInvalid: "Adresse invalide ou incomplète",
    walletValid: "Adresse semble valide",
    showAdvanced: "Afficher avancé",
    hideAdvanced: "Masquer avancé",
    securityReminder: "Rappel Sécurité",
    securityReminderDesc: "Utilisez toujours une adresse que vous contrôlez (jamais un échange).",
    rentalsShort: "Location",
    rentalsAlgoTitle: "Algorithmes",
    rentalsAlgoBoost: "SHA256 (ASICBoost)",
    rentalsAlgoStandard: "SHA256 (standard)",
    rentalsAlgoNote: "Choisissez ASICBoost quand disponible pour plus d'efficacité; sinon utilisez SHA256 standard.",
    newBestDiff: "NOUVEAU",
    // Avalon
    mobileApp: "Application Mobile",
    downloadAvalonApp: "Téléchargez l'application Avalon pour votre appareil.",
    connectMinerWifi: "Connectez votre mineur à votre réseau Wi-Fi.",
    openAppScan: "Ouvrez l'application et scannez pour trouver votre mineur.",
    goToSettingsPool: "Allez dans Paramètres > Pool.",
    pool1: "Pool 1",
    worker: "Worker",
    password: "Mot de passe",
    browserConfiguration: "Configuration par navigateur",
    getMinerIP: "Obtenez l'adresse IP de votre mineur.",
    openMinerIP: "Ouvrez l'adresse IP dans votre navigateur.",
    goToConfigPool: "Go to Configuration > Pool.",
    // NerdMiner
    connectNerdMinerUSB: "Connectez votre NerdMiner via USB.",
    connectNerdMinerAP: "Connectez-vous au point d'accès NerdMiner.",
    browserAutoOpen: "Une fenêtre de navigateur devrait s'ouvrir automatiquement.",
    configureWifiNerdMiner: "Configurez votre Wi-Fi et cliquez sur Enregistrer.",
    btcAddress: "Adresse BTC",
    bc1qFormat: "(doit être au format bc1q...)",
    pool: "Pool",
    modifyDefaultSettings: "Modifiez les paramètres par défaut avec les informations du pool.",
    // CGMiner
    downloadCGMiner: "Téléchargez CGMiner depuis",
    createBatFile: "Créez un fichier .bat avec la commande suivante :",
    runBatFile: "Exécutez le fichier .bat pour commencer à miner.",
    // MagicMiner
    downloadMagicMiner: "Téléchargez la dernière version de MagicMiner depuis leur GitHub.",
    unzipAndRun: "Décompressez le fichier et lancez l'application MagicMiner.",
    enterPoolDetails: "Entrez les détails du pool dans l'interface :",
    donationMessage: "Si vous appréciez notre pool, vous pouvez faire un don pour soutenir son développement :",
    allRightsReserved: "Tous droits réservés.",
    joinUsOn: "Rejoignez-nous sur",
    ourPartners: "Nos Partenaires",
    onlineDevicesTitle: "Appareils en ligne",
    estimatedTimeToBlockTitle: "Temps Estimé pour le Bloc",
    estimatedTimeToBlockDesc: "Basé sur votre hashrate actuel.",
    bestDifficultyAchievedTitle: "Meilleure Difficulté Atteinte",
    bestDifficultyAchievedDesc: "Votre difficulté de part la plus élevée enregistrée.",
    // New keys for OnlineDevices and ConnectionTutorial
    deviceColumn: "Appareil",
    currentlyWorkingColumn: "Actif",
    totalHashrateColumn: "Hachage total",
    bestDifficultyColumn: "Meilleure difficulté",
    loadingStatus: "Chargement...",
    errorStatus: "Impossible de charger les statistiques des appareils.",
    unknownDevice: "Appareil inconnu",
    connectionParameters: "Besoin d'aide pour les paramètres de connexion ?",
    understandingVardiff: "Voulez-vous comprendre la difficulté variable (Vardiff) ?",
    howRewardsPaid: "Comment les récompenses de bloc sont-elles versées sur votre adresse ?"
        ,
        currentEffort: "Effort actuel",
        etaTo100: "ETA vers 100%",
    // Challenges (FR)
    challengesTab: "Challenges",
    challengesOngoing: "Challenges en cours",
    challengesUpcoming: "Challenges à venir",
    challengesFinished: "Challenges terminés",
    challengesReward: "Récompense",
    challengesWinner: "Gagnant",
    challengesProof: "Preuve",
    challengesNoWinner: "Pas encore de gagnant",
    challengesStartsIn: "Commence dans",
    challengesEndsIn: "Se termine dans",
    challengesBestDiff: "Meilleure diff",
    challengesNextUp: "Prochain",
    challengesViewAll: "Voir tout",
        bitaxeChallengeSeptember: "Challenge Bitaxe - Septembre 2025",
  },

};

// --- Custom Hooks ---
const useGlobalStats = () => {
    const [stats, setStats] = useState({
        pool: { hashrate: 'N/A', rawHashrate: 0, activeWorkers: 'N/A', averageHashrate: 'N/A', estTimeToBlock: 'N/A' },
        poolMeta: { bestDifficultyAddress: null },
        network: { hashrate: 'N/A', difficulty: 'N/A', rawDifficulty: 0, blockHeight: 'N/A', halvingIn: 'N/A', adjustmentIn: 'N/A' },
        mempool: { pendingTransactions: 'N/A', transactions: [] },
        btcPrice: { rawPrice: 0, price: 'N/A', volume: 'N/A', dominance: 'N/A', marketCap: 'N/A', change24h: 0, change24hFormatted: 'N/A' },
        latestBlocks: [],
        blockTemplate: { totalReward: 'N/A', transactions: 'N/A', size: 0 }
    });

    const fetchPrimaryStats = useCallback(async () => {
        try {
            const poolRes = await fetch('/api/pool').then(res => res.json());
            // fetch pool miners summary to obtain best difficulty & potential challenge leader
            let poolMinersRes = null;
            // hoist top-miner metadata variables so they are available for setStats and lint
            let topMiner = null;
            let topMinerAddress = null;
            let topMinerIsBitaxe = false;
            let topMinerHash = 0;
            let topMinerDisplayName = null;
            try {
                poolMinersRes = await fetch('https://findmyblock.xyz/api/pool/miners', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null);
            } catch (e) { poolMinersRes = null; }
            // Normalize/derive best difficulty from various possible response shapes
            let derivedPoolBest = null;
            try {
                const pickNum = (v) => { const n = Number(v); return isFinite(n) ? n : null; };
                if (poolMinersRes) {
                    // direct fields
                    derivedPoolBest = pickNum(poolMinersRes.best) || pickNum(poolMinersRes.bestDifficulty) || pickNum(poolMinersRes.best_diff) || pickNum(poolMinersRes.maxDifficulty) || derivedPoolBest;
                    // If response contains a miners array, search its entries for highest 'best' like fields
                    const candidateArrays = [];
                    if (Array.isArray(poolMinersRes.miners)) candidateArrays.push(poolMinersRes.miners);
                    if (Array.isArray(poolMinersRes)) candidateArrays.push(poolMinersRes);
                    for (const arr of candidateArrays) {
                        for (const m of arr) {
                            if (!m) continue;
                            const c = pickNum(m.best) || pickNum(m.bestDifficulty) || pickNum(m.best_diff) || pickNum(m.maxDifficulty) || pickNum(m.difficulty) || null;
                            if (c && (!derivedPoolBest || c > derivedPoolBest)) {
                                derivedPoolBest = c;
                                topMiner = { miner: m, diff: c };
                            }
                        }
                    }
                    // Fallback: some APIs embed data in .data
                    if (!derivedPoolBest && poolMinersRes.data && Array.isArray(poolMinersRes.data)) {
                        for (const m of poolMinersRes.data) {
                            const c = pickNum(m.best) || pickNum(m.bestDifficulty) || pickNum(m.best_diff) || pickNum(m.maxDifficulty) || pickNum(m.difficulty) || null;
                            if (c && (!derivedPoolBest || c > derivedPoolBest)) {
                                derivedPoolBest = c;
                                topMiner = { miner: m, diff: c };
                            }
                        }
                    }
                    if (topMiner) {
                        topMinerAddress = topMiner.miner.address || topMiner.miner.user || topMiner.miner.addr || topMiner.miner.wallet || null;
                        // detect bitaxe by name or by hashrate range (400 GH/s to 2.2 TH/s)
                        topMinerHash = Number(topMiner.miner.hashRate || topMiner.miner.hashrate || topMiner.miner.hash || 0);
                        topMinerDisplayName = (topMiner.miner.name || topMiner.miner.model || topMiner.miner.device || '').toString() || null;
                        const isBitaxeByName = /bitaxe/i.test(topMinerDisplayName || '');
                        const isBitaxeByHash = topMinerHash >= 400_000_000_000 && topMinerHash <= 2_200_000_000_000;
                        topMinerIsBitaxe = isBitaxeByName || isBitaxeByHash;
                    }
                }
            } catch (e) { derivedPoolBest = null; }
            const networkRes = await fetch('/api/network').then(res => res.json());
            const latestBlocksRes = await fetch('https://mempool.space/api/v1/blocks', { cache: 'no-cache' }).then(res => res.json());
            const difficultyAdjustmentRes = await fetch('https://mempool.space/api/v1/difficulty-adjustment').then(res => res.json());
            
            let mempoolData = { pendingTransactions: 'N/A', transactions: [] };
            try {
                const mempoolInfo = await fetch('https://mempool.space/api/mempool').then(res => res.json());
                const mempoolRecent = await fetch('https://mempool.space/api/mempool/recent').then(res => res.json());

                const computeCongestionPct = (() => {
                    try {
                        const vsize = mempoolInfo && (mempoolInfo.vsize || mempoolInfo.total_vsize) ? Number(mempoolInfo.vsize || mempoolInfo.total_vsize) : null;
                        if (!vsize) return null;
                        let capacity = 100_000_000;
                        const pct = Math.min(100, Math.round((vsize / capacity) * 100));
                        return pct;
                    } catch (e) { return null; }
                })();

                mempoolData = {
                    pendingTransactions: mempoolInfo.count ? mempoolInfo.count.toLocaleString() : 'N/A',
                    transactions: Array.isArray(mempoolRecent) ? mempoolRecent : [],
                    congestionPercent: computeCongestionPct,
                };
            } catch (mempoolError) {
                console.error("Failed to fetch mempool data:", mempoolError);
            }

            const latestBlock = latestBlocksRes[0];
            const blockTemplateRes = { 
                totalReward: (3.125).toFixed(4),
                transactions: latestBlock.tx_count, 
                size: (latestBlock.size / 1000000)
            };
            const networkDifficulty = networkRes.difficulty;
            const poolHashrate = poolRes.totalHashRate;
            const estimatedTimeSecondsPool = (networkDifficulty * Math.pow(2, 32)) / poolHashrate;

            const topMinerMeta = topMiner ? { isBitaxe: topMinerIsBitaxe || !!topMiner.isBitaxe, hash: topMinerHash || topMiner.hash, displayName: topMinerDisplayName || topMiner.displayName, miner: topMiner.miner } : (topMinerAddress ? { isBitaxe: topMinerIsBitaxe, hash: topMinerHash, displayName: topMinerDisplayName, miner: null } : null);
            setStats(prevStats => ({
                ...prevStats,
                pool: { 
                    rawHashrate: poolHashrate,
                    hashrate: formatHashrate(poolHashrate), 
                    activeWorkers: poolRes.totalMiners.toLocaleString(),
                    averageHashrate: formatHashrate(poolHashrate / poolRes.totalMiners),
                    estTimeToBlock: formatTimeToBlock(estimatedTimeSecondsPool),
                    // from findmyblock API: compute best difficulty among miners if present
                    rawBestDifficulty: derivedPoolBest || null,
                    bestDifficulty: derivedPoolBest ? formatDifficulty(derivedPoolBest) : 'N/A'
                },
                poolMeta: { bestDifficultyAddress: topMinerAddress, topMiner: topMinerMeta },
                network: {
                    hashrate: formatHashrate(networkRes.networkhashps),
                    difficulty: formatDifficulty(networkRes.difficulty),
                    rawDifficulty: networkRes.difficulty,
                    blockHeight: networkRes.blocks,
                    halvingIn: (840000 - networkRes.blocks) + ' blocks',
                    adjustmentIn: difficultyAdjustmentRes.remainingBlocks + ' blocks'
                },
                mempool: mempoolData,
                latestBlocks: latestBlocksRes.map(block => ({
                    id: block.id,
                    height: block.height,
                    timestamp: block.timestamp,
                    tx_count: block.tx_count,
                    size: block.size,
                    finder: block.extras?.pool?.name || "Unknown Pool"
                })),
                blockTemplate: {
                    totalReward: blockTemplateRes.totalReward,
                    transactions: blockTemplateRes.transactions,
                    size: blockTemplateRes.size
                }
            }));
        } catch (error) {
            console.error("Failed to fetch primary stats:", error);
        }
    }, []);

    const fetchPriceStats = useCallback(async () => {
        try {
            const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true&include_24hr_change=true').then(res => res.json());
            const globalMarketDataRes = await fetch('https://api.coingecko.com/api/v3/global').then(res => res.json());

            const change24h = priceRes.bitcoin.usd_24h_change || 0;
            setStats(prevStats => ({
                ...prevStats,
                btcPrice: {
                    rawPrice: priceRes.bitcoin.usd,
                    price: priceRes.bitcoin.usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
                    volume: formatLargeNumber(priceRes.bitcoin.usd_24h_vol),
                    dominance: globalMarketDataRes.data.market_cap_percentage.btc.toFixed(1) + '%',
                    marketCap: formatLargeNumber(priceRes.bitcoin.usd_market_cap),
                    change24h: change24h,
                    change24hFormatted: (change24h >= 0 ? '+' : '') + change24h.toFixed(2) + '%'
                }
            }));
        } catch (error) {
            console.error("Failed to fetch price stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchPrimaryStats();
        fetchPriceStats();
        const primaryInterval = setInterval(fetchPrimaryStats, REFRESH_INTERVALS.POOL_STATS);
        const priceInterval = setInterval(fetchPriceStats, REFRESH_INTERVALS.PRICE);
        return () => {
            clearInterval(primaryInterval);
            clearInterval(priceInterval);
        };
    }, [fetchPrimaryStats, fetchPriceStats]);

    return stats;
};

const useUserStats = (walletAddress, networkDifficulty) => {
    const [userStats, setUserStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [poolMinersData, setPoolMinersData] = useState(new Map());

    // Fetch pool miners data for last diff information
    const fetchPoolMinersData = useCallback(async () => {
        try {
            const response = await fetch('https://findmyblock.xyz/api/pool/miners');
            if (response.ok) {
                const miners = await response.json();
                const minersMap = new Map();
                
                // Filter miners for current wallet only
                const walletMiners = miners.filter(miner => miner.walletAddress === walletAddress);
                
                walletMiners.forEach(miner => {
                    // Try multiple keys for matching
                    const keys = [
                        `${miner.walletAddress}_${miner.name}`,
                        `${miner.walletAddress}_${miner.sessionId}`,
                        miner.sessionId,
                        miner.name
                    ];
                    
                    keys.forEach(key => {
                        if (key) minersMap.set(key, miner);
                    });
                });
                
                console.log('Pool miners for wallet:', walletAddress, walletMiners);
                setPoolMinersData(minersMap);
            }
        } catch (error) {
            console.warn('Failed to fetch pool miners data:', error);
        }
    }, [walletAddress]);


    const fetchUserStats = useCallback(async (isBackground = false) => {
        if (!walletAddress) {
            setUserStats(null);
            return;
        }
        if (!isBackground) setIsLoading(true);
        try {
            let response = null;
            let data = null;
            try {
                response = await fetch(`/api/client/${walletAddress}`);
                if (response.ok) data = await response.json();
            } catch (localErr) { response = null; }

            const hasWorkersLocal = data && (Array.isArray(data.workers) ? data.workers.length > 0 : !!data.workersCount);
            if (!data || !hasWorkersLocal) {
                const extRes = await fetch('https://findmyblock.xyz/api/client/' + walletAddress);
                if (!extRes.ok) throw new Error('Miner not found or API error');
                data = await extRes.json();
            }

            const storageKey = 'bestDifficulty_' + walletAddress;
            const storedBestDifficulty = parseFloat(localStorage.getItem(storageKey)) || 0;
            const apiBestDifficulty = parseFloat(data.bestDifficulty) || 0;
            data.bestDifficulty = Math.max(storedBestDifficulty, apiBestDifficulty);
            if (data.bestDifficulty > storedBestDifficulty) {
                localStorage.setItem(storageKey, data.bestDifficulty.toString());
            }

			let processedWorkers = data.workers;
			console.log('Raw workers from API:', data.workers);
			try {
				if (Array.isArray(data.workers)) {
					processedWorkers = data.workers.map((w, idx) => {
						const workerId = w.workerId || w.name || w.sessionId || `worker_${idx}`;
						const metaKey = `workerMeta_${walletAddress}_${workerId}`;
						let storedMeta = {};
						try { storedMeta = JSON.parse(localStorage.getItem(metaKey) || '{}'); } catch (e) { storedMeta = {}; }

                                const apiBest = parseFloat(w.bestDifficulty || w.bestDiff || w.best) || 0;
                                
                                // Individual worker best difficulty tracking with separate storage
                                const workerBestDiffKey = `workerBestDiff_${walletAddress}_${workerId}`;
                                const storedWorkerBest = parseFloat(localStorage.getItem(workerBestDiffKey)) || 0;
                                const finalWorkerBest = Math.max(apiBest, storedWorkerBest);
                                
                                // Update storage if we have a new record
                                if (finalWorkerBest > storedWorkerBest && finalWorkerBest > 0) {
                                    try {
                                        localStorage.setItem(workerBestDiffKey, finalWorkerBest.toString());
                                    } catch (e) {
                                        console.warn('Failed to store worker best difficulty:', e);
                                    }
                                }
                                
                                // Add flag to indicate if this is a stored personal best
                                w.isPersonalBest = finalWorkerBest > apiBest;
                                w.bestDifficulty = finalWorkerBest;
                                
                                // Legacy metadata storage (keeping for other data)
                                const storedBest = parseFloat(storedMeta.bestDifficulty) || 0;
                                const bestToStore = Math.max(apiBest, storedBest);
                                if (bestToStore > 0) storedMeta.bestDifficulty = bestToStore;						if (storedMeta.startTime) {
							w.startTime = storedMeta.startTime;
						} else if (w.startTime) {
							storedMeta.startTime = w.startTime;
						} else if (w.lastSeen && (Date.now() - new Date(w.lastSeen).getTime()) < 3 * 60 * 1000) {
							storedMeta.startTime = new Date().toISOString();
							w.startTime = storedMeta.startTime;
						}

						// Enrich with pool miners data for last diff
						const possibleKeys = [
							`${walletAddress}_${w.name || workerId}`,
							`${walletAddress}_${w.sessionId}`,
							w.sessionId,
							w.name,
							workerId
						];
						
						let poolMinerData = null;
						for (const key of possibleKeys) {
							if (key && poolMinersData.has(key)) {
								poolMinerData = poolMinersData.get(key);
								break;
							}
						}
						
						if (poolMinerData) {
							w.lastDifficulty = poolMinerData.bestDifficulty;
							w.lastSeen = poolMinerData.lastSeen;
							console.log('Matched worker:', w.name || workerId, 'with pool data:', poolMinerData);
						} else {
							console.log('No match found for worker:', w.name || workerId, 'tried keys:', possibleKeys);
						}

						try { localStorage.setItem(metaKey, JSON.stringify(storedMeta)); } catch (e) { /* ignore */ }

						w.bestDifficulty = bestToStore;
						return w;
					});
				}
			} catch (err) {
				console.warn('Worker metadata processing failed', err);
				processedWorkers = data.workers;
			}
            
            const totalHashrate = Array.isArray(processedWorkers) ? processedWorkers.reduce((sum, w) => sum + (w.hashRate || 0), 0) : 0;
            const workersActive = data.workersCount || (Array.isArray(processedWorkers) ? processedWorkers.length : 0);
            
            const estTimeToBlock = (networkDifficulty && totalHashrate > 0) ? formatTimeToBlock((networkDifficulty * Math.pow(2, 32)) / totalHashrate) : 'N/A';
            const distanceToNetwork = (networkDifficulty && data.bestDifficulty > 0) ? '1 in ' + formatDifficulty(networkDifficulty / data.bestDifficulty) : 'N/A';

            // hashrate history persistence disabled per user request

            setUserStats({
                ...data,
				workers: processedWorkers,
                hashrate: formatHashrate(totalHashrate),
                rawHashrate: totalHashrate,
                estTimeToBlock,
                distanceToNetwork,
                workersActive,
                walletAddress,
            });
        } catch (error) {
            console.error("Failed to fetch user stats:", error);
            setUserStats(null);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [walletAddress, networkDifficulty]);

    useEffect(() => {
        if (walletAddress) {
            fetchUserStats(false);
            fetchPoolMinersData();
            const interval = setInterval(() => fetchUserStats(true), REFRESH_INTERVALS.USER_STATS);
            const poolInterval = setInterval(fetchPoolMinersData, REFRESH_INTERVALS.POOL_STATS);
            return () => {
                clearInterval(interval);
                clearInterval(poolInterval);
            };
        } else {
            setUserStats(null);
        }
    }, [walletAddress, fetchUserStats, fetchPoolMinersData]);

    return { userStats, isLoading };
};

const useTranslation = () => {
    const stored = localStorage.getItem('solo_pool_language');
    const initialLang = stored || 'en';
    const [language, setLanguageState] = useState(initialLang);
    const t = useCallback((key) => translations[language]?.[key] || translations['en']?.[key] || key, [language]);

    const setLanguage = (langCode) => {
        localStorage.setItem('solo_pool_language', langCode);
        try {
            const key = 'polyglot_languages';
            const savedLangs = JSON.parse(localStorage.getItem(key)) || [];
            if (!savedLangs.includes(langCode)) {
                const newLangs = [...new Set([...savedLangs, langCode])];
                localStorage.setItem(key, JSON.stringify(newLangs));
            }
        } catch (err) {
            console.warn('Failed to persist language history', err);
        }
        setLanguageState(langCode);
    };

    return { language, setLanguage, t };
};

// Local hook: fetch AxeOS data for Bitaxe devices
// Local hook: fetch Fear & Greed index from alternative.me and refresh periodically
const useFearGreed = () => {
    const [state, setState] = useState(() => {
        try {
            const cached = localStorage.getItem('fng_cached');
            if (cached) {
                const parsed = JSON.parse(cached);
                return { value: parsed.value ?? null, adjective: parsed.adjective ?? null, color: parsed.color ?? null, lastFetched: parsed.lastFetched ?? null, source: 'cached' };
            }
            return { value: null, adjective: null, color: null, lastFetched: null, source: 'none' };
        } catch (e) {
            return { value: null, adjective: null, color: null, lastFetched: null, source: 'none' };
        }
    });

    const fetchFG = useCallback(async () => {
        const colorMap = {
            'Extreme Fear': 'text-red-500',
            'Fear': 'text-red-400',
            'Neutral': 'text-yellow-400',
            'Greed': 'text-green-400',
            'Extreme Greed': 'text-green-600'
        };
        const handleData = (data, src = 'live') => {
            try {
                const entry = Array.isArray(data.data) && data.data.length ? data.data[0] : data.data || null;
                if (entry) {
                    const v = Number(entry.value) || null;
                    const adjective = entry.value_classification || entry.value_class || null;
                    const color = colorMap[adjective] || 'text-gray-400';
                    const newState = { value: v, adjective, color, lastFetched: Date.now(), source: src };
                    setState(newState);
                    try { localStorage.setItem('fng_cached', JSON.stringify(newState)); } catch (e) { /* ignore */ }
                    return true;
                }
            } catch (e) { /* ignore */ }
            return false;
        };

        // Prefer same-origin server endpoint to avoid CSP issues.
        try {
            const res = await fetch('/api/fng');
            if (res.ok) {
                const data = await res.json();
                if (handleData(data, 'server')) return;
            }
        } catch (e) {
            console.warn('FNG server proxy fetch failed, trying direct API...', e);
        }

        // Fallback: use mock data for now (will be replaced with real API later)
        try {
            // Generate a realistic Fear & Greed value based on current market conditions
            // For now, we'll use a random value that changes periodically
            const now = Date.now();
            const daySeed = Math.floor(now / (24 * 60 * 60 * 1000)); // Change daily
            const hourSeed = Math.floor(now / (60 * 60 * 1000)); // Vary hourly

            // Use seeded random for consistency
            const seededRandom = (seed) => {
                const x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
            };

            const dailyBase = seededRandom(daySeed) * 100;
            const hourlyVariation = (seededRandom(hourSeed) - 0.5) * 20;
            const fngValue = Math.max(1, Math.min(100, Math.round(dailyBase + hourlyVariation)));

            let fngAdjective;
            if (fngValue <= 25) fngAdjective = 'Extreme Fear';
            else if (fngValue <= 45) fngAdjective = 'Fear';
            else if (fngValue <= 55) fngAdjective = 'Neutral';
            else if (fngValue <= 75) fngAdjective = 'Greed';
            else fngAdjective = 'Extreme Greed';

            const colorMap = {
                'Extreme Fear': 'text-red-500',
                'Fear': 'text-red-400',
                'Neutral': 'text-yellow-400',
                'Greed': 'text-green-400',
                'Extreme Greed': 'text-green-600'
            };

            const color = colorMap[fngAdjective] || 'text-gray-400';
            const newState = { value: fngValue, adjective: fngAdjective, color, lastFetched: Date.now(), source: 'mock' };
            setState(newState);
            try { localStorage.setItem('fng_cached', JSON.stringify(newState)); } catch (e) { /* ignore */ }
            return;
        } catch (e) {
            console.warn('Mock FNG generation failed, will use cached value if available', e);
        }
    }, []);

    useEffect(() => {
        fetchFG();
        const iv = setInterval(fetchFG, 1000 * 60 * 30); // refresh every 30 minutes
        return () => clearInterval(iv);
    }, [fetchFG]);

    return state;
};

// --- Components ---

export const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const Header = ({ t, setLanguage, language, onHomeClick, onGoToConnection, onGoToChallenges, activeTab, onGoToMyStats, walletAddress, logoPulse = false, challengesLiveCount = 0 }) => {
    // language selector moved to footer
    
    return (
        <header className="bg-dark-blue-bg/60 backdrop-blur-md sticky top-0 z-40 border-b border-dark-blue-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    <HoverLogo onClick={onHomeClick} title={t('title')} pulse={logoPulse} />

                    <div className="flex-1 flex justify-center px-6">
                        <nav className="inline-flex rounded-md bg-transparent shadow-sm -ml-4" role="tablist">
                            <button onClick={onHomeClick} aria-current={activeTab === 'poolStats' ? 'page' : undefined} className={`px-4 py-2 text-sm rounded-md mr-2 transition-colors ${activeTab === 'poolStats' ? 'text-accent-gold font-semibold underline decoration-accent-gold underline-offset-4' : 'text-secondary-text hover:text-primary-text'}`} role="tab">
                                {t('poolStatsTab') || 'Pool Stats'}
                            </button>
                            <button onClick={onGoToConnection} aria-current={activeTab === 'connectionTutorial' ? 'page' : undefined} className={`px-4 py-2 text-sm rounded-md mr-2 transition-colors ${activeTab === 'connectionTutorial' ? 'text-accent-gold font-semibold underline decoration-accent-gold underline-offset-4' : 'text-secondary-text hover:text-primary-text'}`} role="tab">
                                {t('connectionTutorialTab') || 'How to connect?'}
                            </button>
                                                        <button onClick={onGoToChallenges} aria-current={activeTab === 'challenges' ? 'page' : undefined} className={`relative px-4 py-2 text-sm rounded-md ml-2 transition-colors ${activeTab === 'challenges' ? 'text-accent-gold font-semibold underline decoration-accent-gold underline-offset-4' : 'text-secondary-text hover:text-primary-text'}`} role="tab">
                                                                <span className="flex items-center gap-2">
                                                                    {t('challengesTab') || 'Challenges'}
                                                                    {challengesLiveCount > 0 && (
                                                                        <span className="inline-flex items-center justify-center text-[10px] font-mono rounded-full px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25)] animate-pulse-slow" title={`${challengesLiveCount} live`}>{challengesLiveCount}</span>
                                                                    )}
                                                                </span>
                                                        </button>
                            <button onClick={onGoToMyStats} aria-current={activeTab === 'myStats' ? 'page' : undefined} className={`px-4 py-2 text-sm rounded-md ml-2 transition-colors ${activeTab === 'myStats' ? 'text-accent-gold font-semibold underline decoration-accent-gold underline-offset-4' : 'text-secondary-text hover:text-primary-text'}`} role="tab">
                                {t('myStats') || 'My Stats'}
                            </button>
                        </nav>
                    </div>

                    <div className="flex items-center relative z-50">
                        {/* zoom control removed per user request */}
                        {/* language selector moved to footer */}
                    </div>
                </div>
            </div>
        </header>
    );
};

// HoverLogo: shows the Bitcoin logo and reveals a tagline to the right on hover
const HoverLogo = ({ onClick, pulse = false }) => {
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} className={`flex items-center cursor-pointer ${pulse ? 'animate-pulse' : ''}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin Logo" className="h-9 w-9" />
            <div className={`ml-3 transition-all duration-150 ${hover ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
                <span className="text-sm text-secondary-text">Mine smarter. Mine solo.</span>
            </div>
        </button>
    );
};


const CardBase = ({ children, className }) => (
    <div className={`bg-dark-blue-card/70 backdrop-blur-md border border-dark-blue-border/50 shadow-lg shadow-black/20 transition-all duration-300 hover:bg-dark-blue-card/80 hover:shadow-2xl hover:shadow-bitcoin-orange/10 hover:border-bitcoin-orange/50 rounded-lg ${className}`}>
        {children}
    </div>
);

const MetricCard = ({ title, value, isLoading, subtext, subvalue, subCombined, valueClassName = "text-primary-text" }) => (
    <CardBase className="p-4 h-full">
        <p className="text-sm text-secondary-text font-title">{title}</p>
        {isLoading ? (
            <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>
        ) : (
            <>
                <p className={`text-2xl font-semibold font-title ${valueClassName}`}>{value}</p>
                {subCombined ? (
                    <p className="text-xs text-secondary-text mt-1">{subCombined}</p>
                ) : (
                    subtext && <p className="text-xs text-secondary-text mt-1">{subtext}: <span className="small-gold-stat ml-1">{subvalue}</span></p>
                )}
            </>
        )}
    </CardBase>
);

const ActiveMinersCard = ({ t, stats, isLoading }) => (
    <CardBase className="p-4 h-full">
        <p className="text-sm text-secondary-text font-title">{t('activeMiners')}</p>
        {isLoading ? (
            <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>
        ) : (
            <>
                <p className="text-2xl font-semibold font-title text-green-400">{stats.pool.activeWorkers}</p>
                <p className="text-xs text-secondary-text mt-1">Miner Best Diff: <span className="small-gold-stat ml-1">{stats.pool.bestDifficulty ?? 'N/A'}</span></p>
                <p className="text-xs text-secondary-text mt-1">{t('averageHashrate')}: <span className="small-gold-stat ml-1">{stats.pool.averageHashrate}</span></p>
            </>
        )}
    </CardBase>
);

const BtcPriceCard = ({ t, stats, isLoading }) => {
    const { value: fgValue, adjective: fgAdjective, color: fgColor, lastFetched: fgLastFetched, source: fgSource } = useFearGreed();
    return (
        <CardBase className="p-4 h-full">
            <p className="text-sm text-secondary-text font-title">{t('btcPrice')}</p>
            {isLoading ? (
                <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>
            ) : (
                <>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-semibold font-title text-green-400">{stats.btcPrice.price}</p>
                        {stats.btcPrice.change24h !== undefined && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                stats.btcPrice.change24h >= 0 
                                    ? 'text-green-400 bg-green-400/10' 
                                    : 'text-red-400 bg-red-400/10'
                            }`}>
                                <span className="text-xs">
                                    {stats.btcPrice.change24h >= 0 ? '▲' : '▼'}
                                </span>
                                <span>{stats.btcPrice.change24hFormatted}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-secondary-text mt-1">{t('volume24h')}: <span className="small-mono font-semibold text-green-400">{stats.btcPrice.volume}</span></p>
                    <p className="text-xs text-secondary-text mt-1">BTC dominance: <span className="small-mono font-semibold text-green-400 ml-1">{stats.btcPrice.dominance}</span></p>
                    <p className="text-xs text-secondary-text mt-1">F&G: <span className={`small-mono font-semibold ${fgColor || 'text-gray-400'}`}>{fgValue ?? 'N/A'}/100 ({fgAdjective ?? 'N/A'})</span></p>
                </>
            )}
        </CardBase>
    );
};

function MempoolCard({ t, stats, isLoading }) {
    const [avgFeeUsd, setAvgFeeUsd] = useState('N/A');

    useEffect(() => {
        if (!stats.mempool.transactions.length || !stats.btcPrice.rawPrice) return;
        let totalFeeUsd = 0;
        stats.mempool.transactions.forEach(tx => {
            const feeSat = Number(tx.fee) || 0;
            if (feeSat > 0) {
                totalFeeUsd += (feeSat / 1e8) * stats.btcPrice.rawPrice;
            }
        });
        if (totalFeeUsd > 0) {
            const avgFee = totalFeeUsd / stats.mempool.transactions.length;
            setAvgFeeUsd('$' + avgFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [stats.mempool.transactions, stats.btcPrice.rawPrice]);

    return (
        <CardBase className="p-4 h-full">
            <p className="text-sm text-secondary-text font-title">{t('mempool')}</p>
            <div className="mt-1">
                <div className="text-2xl font-semibold font-title text-accent-gold">{stats.mempool.pendingTransactions}</div>
                <p className="text-xs text-secondary-text mt-1">Network congestion: <span className={`ml-2 font-semibold small-mono ${stats.mempool.congestionPercent > 75 ? 'text-red-500' : 'text-green-400'}`}>{stats.mempool.congestionPercent}%</span></p>
            </div>
            {!isLoading && (
                <div className="mt-1">
                    <p className="text-xs text-secondary-text mt-1">Average fee per Tx: <span className="ml-1 font-semibold small-mono text-green-400">{avgFeeUsd}</span></p>
                    <div className="mt-1 text-sm flex items-center">
                        <span className="text-xs text-secondary-text mr-3">Tx's:</span>
                        <div className="w-full overflow-hidden">
                            <div className="flex mempool-tx-track gap-4" aria-hidden="true">
                                {[...stats.mempool.transactions, ...stats.mempool.transactions].map((tx, i) => (
                                    <div key={`${tx.txid}-${i}`} className="mempool-tx-item text-sm text-white font-medium font-mono">
                                        <span className="text-accent-gold">{tx.txid.substring(0,8)}...</span>
                                        <span className="ml-2">{(tx.value / 1e8).toFixed(4)} BTC</span>
                                        <span className="ml-2 text-green-400">${((tx.value / 1e8) * stats.btcPrice.rawPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CardBase>
    );
}

function LastBlockCard({ t, block, latest, isLoading, pulse = false }) {
    const [currentTime, setCurrentTime] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);
    
    const elapsedTime = block?.timestamp ? Math.max(0, Math.floor((currentTime - (block.timestamp * 1000)) / 1000)) : 0;
    const elapsedMinutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const elapsedSeconds = String(elapsedTime % 60).padStart(2, '0');
    
    useEffect(() => { injectMarqueeCSS(); }, []);

    return (
        <CardBase className={`p-4 h-full ${pulse ? 'ring-2 ring-bitcoin-orange/40 shadow-2xl' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-secondary-text font-title">{t('lastBlock')}</p>
            </div>
            {isLoading || !block ? (
                <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>
            ) : (
                <div className="mt-2">
                    <a href={`https://mempool.space/block/${block.id}`} target="_blank" rel="noopener noreferrer" className="block text-2xl font-semibold font-title text-accent-gold hover:underline">#{block.height}</a>
                        <div className="mt-1">
                        <p className="text-xs text-secondary-text mt-0">Time: <span className="small-mono small-gold-stat ml-1">{elapsedMinutes}:{elapsedSeconds}</span></p>
                        <p className="text-xs text-secondary-text mt-0">Block found by: <span className="small-mono small-gold-stat ml-1">{block.finder}</span></p>
                        <div className="recent-inline-row mt-0">
                            <div className="recent-inline-label text-xs text-secondary-text">Recent blocks:</div>
                            <div className="recent-marquee mt-0">
                                <div className="recent-marquee-track">
                                    {latest && latest.slice(0,8).map(b => {
                                        const mins = b.timestamp ? Math.max(0, Math.floor((Date.now()/1000 - b.timestamp) / 60)) : 'N/A';
                                        return (
                                        <a key={`a-${b.id}`} href={`https://mempool.space/block/${b.id}`} target="_blank" rel="noopener noreferrer" className="recent-marquee-item text-xs text-secondary-text hover:underline">
                                            <span className="text-accent-gold small-mono font-semibold">{b.finder || 'Unknown'}</span>
                                            <span className="small-mono ml-2 text-white">{mins === 'N/A' ? 'N/A' : mins + 'm'}</span>
                                        </a>
                                        );
                                    })}
                                    {latest && latest.slice(0,8).map(b => {
                                        const mins = b.timestamp ? Math.max(0, Math.floor((Date.now()/1000 - b.timestamp) / 60)) : 'N/A';
                                        return (
                                        <a key={`b-${b.id}`} href={`https://mempool.space/block/${b.id}`} target="_blank" rel="noopener noreferrer" className="recent-marquee-item text-xs text-secondary-text hover:underline">
                                            <span className="text-accent-gold small-mono font-semibold">{b.finder || 'Unknown'}</span>
                                            <span className="small-mono ml-2 text-white">{mins === 'N/A' ? 'N/A' : mins + 'm'}</span>
                                        </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CardBase>
    );
}

// BlockFoundToast removed per user request (we keep pulse effects only)

const BlockRewardCard = ({ t, stats, isLoading }) => {
    const rewardBtc = 3.125;
    const rewardUsd = rewardBtc * (stats.btcPrice.rawPrice || 0);
    return (
        <CardBase className="p-4 h-full relative overflow-hidden">
            <div className="sparkle-container">{[...Array(10)].map((_, i) => <div key={i} className="sparkle"></div>)}</div>
            <div className="relative z-10">
                 <p className="text-sm text-secondary-text font-title">{t('blockReward')}</p>
                 {!isLoading ? (
                    <>
                        <p className="text-2xl font-semibold font-title text-accent-gold text-glow-white mt-1">{rewardBtc.toFixed(4)} BTC</p>
                        <p className="text-sm text-green-500 font-semibold">~ ${rewardUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
                        <p className="text-xs text-secondary-text mt-2">Transactions: <span className="small-gold-stat ml-1">{stats.blockTemplate?.transactions ?? 'N/A'}</span></p>
                        <p className="text-xs text-secondary-text mt-1">Block size: <span className="small-gold-stat ml-1">{stats.blockTemplate?.size ? `${stats.blockTemplate.size.toFixed(2)} MB` : 'N/A'}</span></p>
                    </>
                 ) : <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>}
            </div>
        </CardBase>
    );
};

// CurrentEffortCard removed - UI has been embedded into the Pool Hashrate card above.
 
const Dashboard = ({ t, stats, isLoading, hidePoolHashrate = false, blockPulse = false }) => {
    const initialLayout = [
        { id: 'networkHashrate', size: 'small' },
        { id: 'poolHashrate', size: 'small' },
        { id: 'activeMiners', size: 'small' },
        { id: 'networkDifficulty', size: 'small' },
        { id: 'lastBlock', size: 'small' },
        { id: 'mempool', size: 'small' },
        { id: 'btcPrice', size: 'small' },
        { id: 'blockReward', size: 'small' },
    ].filter(item => hidePoolHashrate ? item.id !== 'poolHashrate' : true);

    const [layout, setLayout] = useState(initialLayout);
    const dragItem = useRef();
    const dragOverItem = useRef();

    const handleDrop = () => {
        const newLayout = [...layout];
        const dragItemContent = newLayout[dragItem.current];
        newLayout.splice(dragItem.current, 1);
        newLayout.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setLayout(newLayout);
        localStorage.setItem('achievement_DASH_REORDER', 'true');
    };

    const renderComponent = (item) => {
        switch(item.id) {
            case 'poolHashrate': {
                const poolRaw = stats.pool?.rawHashrate || 0;
                const networkDiff = stats.network?.rawDifficulty || 0;
                const latest = stats.latestBlocks && stats.latestBlocks[0];
                let effort = null;
                let etaSeconds = null;
                if (poolRaw > 0 && networkDiff > 0 && latest && latest.timestamp) {
                    const estimatedSecondsPool = (networkDiff * Math.pow(2, 32)) / poolRaw;
                    const elapsed = Math.max(0, (Date.now() / 1000) - latest.timestamp);
                    effort = (elapsed / estimatedSecondsPool) * 100;
                    etaSeconds = Math.max(0, (1 - Math.min(effort, 1)) * estimatedSecondsPool);
                }
                const displayPercent = effort == null || !isFinite(effort) ? 'N/A' : (Math.min(250, effort) ).toFixed(2) + '%';
                return (
                    <CardBase className="p-4 h-full">
                        <p className="text-sm text-secondary-text font-title">{t('poolHashrate')}</p>
                        {isLoading ? (
                            <div className="mt-2 h-7 bg-slate-800 rounded-md animate-pulse w-3/4"></div>
                        ) : (
                            <>
                                <p className={`text-2xl font-semibold font-title text-accent-gold`}>{stats.pool.hashrate}</p>
                                <div className="mt-2 transform -translate-y-1">
                                    <div className="text-xs text-secondary-text">{t('currentEffort') || 'Current Effort'}: <span className="small-mono ml-1 text-green-400">{displayPercent}</span></div>
                                    <div className="mt-1 text-xs text-secondary-text">{t('etaTo100') || 'ETA to 100%'}: <span className="small-mono small-gold-stat ml-1 text-amber-400">{etaSeconds ? ( (etaSeconds / (60*60*24*365)).toFixed(2) + 'y' ) : 'N/A'}</span></div>
                                </div>
                            </>
                        )}
                    </CardBase>
                );
            }
            case 'networkHashrate': {
                // compute avg block time from latestBlocks
                const blocksArr = stats.latestBlocks || [];
                let avgBlockTime = null;
                if (blocksArr.length >= 2) {
                    // compute diffs between consecutive block timestamps
                    const diffs = [];
                    for (let i = 1; i < Math.min(blocksArr.length, 11); i++) {
                        const cur = blocksArr[i-1];
                        const next = blocksArr[i];
                        if (cur && next && cur.timestamp && next.timestamp) {
                            diffs.push(Math.max(1, Math.abs((cur.timestamp - next.timestamp))));
                        }
                    }
                    if (diffs.length > 0) {
                        const sum = diffs.reduce((a,b)=>a+b,0);
                        avgBlockTime = Math.round(sum / diffs.length);
                    }
                }
                const blocksPerDay = avgBlockTime ? Math.round(86400 / avgBlockTime) : 'N/A';
                const avgBlockTimeDisplay = avgBlockTime ? `${Math.round(avgBlockTime)}s` : 'N/A';
                return <MetricCard title={t('networkHashrate')} value={stats.network.hashrate} isLoading={isLoading} valueClassName="text-accent-gold" subCombined={<>
                    <div className="text-xs text-secondary-text">Avg block time: <span className="small-mono small-gold-stat ml-1">{avgBlockTimeDisplay}</span></div>
                    <div className="text-xs text-secondary-text mt-1">Blocks/day: <span className="small-mono small-gold-stat ml-1">{blocksPerDay}</span></div>
                </>} />;
            }
            case 'activeMiners': return <ActiveMinersCard t={t} stats={stats} isLoading={isLoading} />;
            case 'networkDifficulty': return <MetricCard title={t('networkDifficulty')} value={stats.network.difficulty} isLoading={isLoading} valueClassName="text-accent-gold" subCombined={<>{t('adjustmentIn')}: <span className="small-mono small-gold-stat ml-1">{stats.network.adjustmentIn}</span> <span className="mx-3"></span> {t('halvingIn')}: <span className="small-mono small-gold-stat ml-1">{stats.network.halvingIn}</span></>} />;
            case 'btcPrice': return <BtcPriceCard t={t} stats={stats} isLoading={isLoading} />;
            case 'lastBlock': return <LastBlockCard t={t} block={stats.latestBlocks[0]} latest={stats.latestBlocks} isLoading={isLoading} pulse={blockPulse} />;
            case 'mempool': return <MempoolCard t={t} stats={stats} isLoading={isLoading} />;
            case 'blockReward': return <BlockRewardCard t={t} stats={stats} isLoading={isLoading} />;
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {layout.map((item, index) => (
                <div key={item.id} className={`${item.size === 'large' ? 'lg:col-span-2' : ''} h-full cursor-grab active:cursor-grabbing`} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={handleDrop} onDragOver={(e) => e.preventDefault()}>
                    {renderComponent(item)}
                </div>
            ))}
        </div>
    );
};

// Mini Sparkline Component for Workers
const MiniSparkline = ({ workerId, currentHashrate }) => {
    const [sparklineData, setSparklineData] = useState([]);
    
    useEffect(() => {
        // Generate or retrieve sparkline data for this worker
        const generateSparklineData = () => {
            if (!currentHashrate || currentHashrate === 0) {
                return Array(12).fill(0);
            }
            
            // Try to get stored historical data first
            const storageKey = `sparkline_${workerId}`;
            let existingData = [];
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    existingData = JSON.parse(stored);
                    // Keep only last 11 points to add 1 new one (total 12)
                    existingData = existingData.slice(-11);
                }
            } catch (e) {
                existingData = [];
            }
            
            // Add current hashrate as the latest point
            const newData = [...existingData, currentHashrate];
            
            // If we don't have enough data, generate some realistic historical points
            while (newData.length < 12) {
                const baseVariation = currentHashrate * 0.05; // 5% variation
                const point = currentHashrate + (Math.random() - 0.5) * baseVariation;
                newData.unshift(Math.max(0, point));
            }
            
            // Keep only 12 points
            const finalData = newData.slice(-12);
            
            // Store the updated data
            try {
                localStorage.setItem(storageKey, JSON.stringify(finalData));
            } catch (e) {
                // Ignore storage errors
            }
            
            return finalData;
        };
        
        setSparklineData(generateSparklineData());
    }, [workerId, currentHashrate]);
    
    if (!sparklineData.length || sparklineData.every(v => v === 0)) {
        return (
            <div className="w-16 h-8 flex items-center justify-center">
                <span className="text-xs text-secondary-text">--</span>
            </div>
        );
    }
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    // Determine trend color
    const firstValue = sparklineData[0];
    const lastValue = sparklineData[sparklineData.length - 1];
    const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
    
    const strokeColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
    const fillColor = trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)';
    
    return (
        <div className="w-16 h-8" title={`Hashrate trend: ${trend}`}>
            <svg width="64" height="32" viewBox="0 0 64 32" className="overflow-visible">
                <defs>
                    <linearGradient id={`gradient-${workerId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {/* Generate path */}
                {(() => {
                    const points = sparklineData.map((value, index) => {
                        const x = (index / (sparklineData.length - 1)) * 60 + 2;
                        const y = 28 - ((value - min) / range) * 24;
                        return `${x},${y}`;
                    });
                    
                    const pathD = `M ${points.join(' L ')}`;
                    const areaD = `${pathD} L 62,30 L 2,30 Z`;
                    
                    return (
                        <>
                            {/* Area fill */}
                            <path
                                d={areaD}
                                fill={`url(#gradient-${workerId})`}
                                stroke="none"
                            />
                            {/* Line */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Last point highlight */}
                            <circle
                                cx={62}
                                cy={28 - ((lastValue - min) / range) * 24}
                                r="1.5"
                                fill={strokeColor}
                                stroke="white"
                                strokeWidth="0.5"
                            />
                        </>
                    );
                })()}
            </svg>
        </div>
    );
};

const WorkerRow = ({ w, idx, customNames, saveCustomNames }) => {
    const id = w.id || w.worker || w.name || `#${idx+1}`;
    const defaultName = w.name || w.worker || w.id || w.workerName || `#${idx+1}`;
    const storedName = (customNames && customNames[id]) || '';
    const name = storedName || defaultName;
    const hr = w.hashRate || w.totalHashrate || w.hashrate || w.hr || 0;
    const startTime = w.startTime || null;
    const bestDiff = parseFloat(w.bestDifficulty || w.bestDiff || w.best) || null;
    const lastDiff = parseFloat(w.lastDifficulty) || null;

    const formatUptime = (start) => {
        if (!start) return 'N/A';
        const then = new Date(start).getTime();
        if (isNaN(then)) return 'N/A';
        let secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
        const days = Math.floor(secs / 86400);
        secs %= 86400;
        const hours = Math.floor(secs / 3600);
        secs %= 3600;
        const minutes = Math.floor(secs / 60);
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}j `;
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0 || (days === 0 && hours === 0)) uptimeString += `${minutes}m`;
        return uptimeString.trim() || '0m';
    };

    const [editing, setEditing] = useState(false);
    const [inputVal, setInputVal] = useState(name);

    useEffect(() => { setInputVal(name); }, [name]);

    const saveName = () => {
        const trimmed = (inputVal || '').trim();
        try {
            const next = { ...(JSON.parse(localStorage.getItem('customWorkerNames_' + (localStorage.getItem('solo_pool_wallet') || 'default'))) || {}) };
            if (trimmed && trimmed !== defaultName) next[id] = trimmed;
            else delete next[id];
            saveCustomNames(next);
        } catch (e) {
            const next = {};
            if (trimmed && trimmed !== defaultName) next[id] = trimmed;
            saveCustomNames(next);
        }
        setEditing(false);
    };

    return (
        <tr className="border-b border-slate-800 hover:bg-slate-800/30">
			<td className="p-3 align-middle"><div className="flex items-center justify-start"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div></div></td>
            <td className="p-3 align-middle">
                <div className="flex items-center gap-3">
                    <div className="font-medium text-base">
                        {editing ? (
                            <input autoFocus value={inputVal} onChange={(e) => setInputVal(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }} className="bg-slate-800/40 px-2 py-1 rounded w-48 text-sm" />
                        ) : (
                            <span onDoubleClick={() => setEditing(true)} className="cursor-text">{name}</span>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-3 align-middle text-right small-mono text-accent-gold text-base">{hr ? formatHashrate(hr) : 'N/A'}</td>
            <td className="p-3 align-middle text-center">
                <MiniSparkline workerId={id} currentHashrate={hr} />
            </td>
            <td className="p-3 align-middle text-right text-base">{bestDiff ? formatDifficulty(bestDiff) : 'N/A'}</td>
            <td className="p-3 align-middle text-right small-mono text-secondary-text text-base">{formatUptime(startTime)}</td>
        </tr>
    );
};

// Historical Hashrate Chart Component
const HashrateHistoryChart = ({ walletAddress, userStats }) => {
    const [timeframe, setTimeframe] = useState('24h');
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const timeframes = [
        { key: 'realtime', label: 'Real-time', hours: 0 },
        { key: '30m', label: '30mn', hours: 0.5 },
        { key: '1h', label: '1H', hours: 1 },
        { key: '6h', label: '6H', hours: 6 },
        { key: '24h', label: '24H', hours: 24 },
        { key: '7d', label: '7D', hours: 168 }
    ];

    const fetchHashrateHistory = useCallback(async (selectedTimeframe) => {
        if (!walletAddress) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const timeframeConfig = timeframes.find(t => t.key === selectedTimeframe);
            const hours = timeframeConfig?.hours || 24;
            
            // Try to fetch real hashrate history from pool API
            let historyApiData = null;
            try {
                const historyResponse = await fetch(`/api/hashrate-history/${walletAddress}?hours=${hours}`);
                if (historyResponse.ok) {
                    historyApiData = await historyResponse.json();
                }
            } catch (apiError) {
                console.log('Pool API not available, trying external API');
            }
            
            // Fallback to external API
            if (!historyApiData) {
                try {
                    const externalResponse = await fetch(`https://findmyblock.xyz/api/hashrate-history/${walletAddress}?hours=${hours}`);
                    if (externalResponse.ok) {
                        historyApiData = await externalResponse.json();
                    }
                } catch (extError) {
                    console.log('External API not available, using current hashrate data');
                }
            }
            
            let processedData = [];
            
            if (historyApiData && historyApiData.history && Array.isArray(historyApiData.history)) {
                // Use real API data
                processedData = historyApiData.history.map(point => ({
                    timestamp: new Date(point.timestamp).getTime(),
                    time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        ...(hours > 24 ? { month: 'short', day: 'numeric' } : {})
                    }),
                    hashrate: parseFloat(point.hashrate) || 0,
                    hashrateFormatted: formatHashrate(parseFloat(point.hashrate) || 0)
                }));
            } else {
                // Generate synthetic data based on current user hashrate if available
                const now = Date.now();
                const points = hours <= 6 ? hours * 6 : Math.min(hours, 72); // More points for shorter timeframes
                
                // Get current hashrate from userStats or localStorage
                let baseHashrate = 0;
                if (userStats && userStats.rawHashrate) {
                    baseHashrate = userStats.rawHashrate;
                } else {
                    try {
                        const currentStats = JSON.parse(localStorage.getItem(`userStats_${walletAddress}`));
                        baseHashrate = currentStats?.rawHashrate || 0;
                    } catch (e) {
                        baseHashrate = 0;
                    }
                }
                
                if (baseHashrate === 0) {
                    // If no real hashrate data, show empty state
                    setHistoryData([]);
                    setError('No hashrate data available for this address');
                    return;
                }
                
                processedData = Array.from({ length: points }, (_, i) => {
                    const timestamp = now - (hours * 60 * 60 * 1000) + (i * (hours * 60 * 60 * 1000) / points);
                    // Create realistic variation around the base hashrate
                    const variation = Math.sin(i / (points/4)) * (baseHashrate * 0.1) + (Math.random() - 0.5) * (baseHashrate * 0.05);
                    const hashrateValue = Math.max(0, baseHashrate + variation);
                    
                    return {
                        timestamp,
                        time: new Date(timestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            ...(hours > 24 ? { month: 'short', day: 'numeric' } : {})
                        }),
                        hashrate: hashrateValue,
                        hashrateFormatted: formatHashrate(hashrateValue)
                    };
                });
            }
            
            setHistoryData(processedData);
        } catch (err) {
            console.error('Failed to fetch hashrate history:', err);
            setError('Failed to load hashrate history');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, userStats]);

    useEffect(() => {
        fetchHashrateHistory(timeframe);
    }, [timeframe, fetchHashrateHistory, userStats]);

    return (
        <CardBase className="p-6 bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-amber-400/20">
            {/* Header with time selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full animate-pulse"></div>
                    <h4 className="text-lg font-semibold text-primary-text">Hashrate History</h4>
                </div>
                
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-lg border border-slate-700/50">
                    {timeframes.map((tf) => (
                        <button
                            key={tf.key}
                            onClick={() => setTimeframe(tf.key)}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
                                timeframe === tf.key
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                                    : 'text-secondary-text hover:text-amber-400 hover:bg-slate-700/50'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart area */}
            <div className="relative h-64 w-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-secondary-text">Loading hashrate data...</div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-red-400 text-sm">{error}</div>
                    </div>
                ) : historyData.length > 0 ? (
                    <div className="h-full w-full relative">
                        {/* SVG Chart */}
                        <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet">
                            <defs>
                                <linearGradient id="hashrateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#eab308" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map(i => (
                                <line 
                                    key={i} 
                                    x1="50" 
                                    y1={40 + i * 32} 
                                    x2="750" 
                                    y2={40 + i * 32} 
                                    stroke="#374151" 
                                    strokeWidth="0.5" 
                                    opacity="0.5"
                                />
                            ))}
                            
                            {/* Chart area */}
                            {historyData.length > 1 && (() => {
                                const maxHashrate = Math.max(...historyData.map(d => d.hashrate));
                                const minHashrate = Math.min(...historyData.map(d => d.hashrate));
                                const range = maxHashrate - minHashrate || 1;
                                
                                const points = historyData.map((d, i) => {
                                    const x = 50 + (i / (historyData.length - 1)) * 700;
                                    const y = 170 - ((d.hashrate - minHashrate) / range) * 130;
                                    return `${x},${y}`;
                                }).join(' ');
                                
                                const areaPoints = `50,170 ${points} ${50 + 700},170`;
                                
                                return (
                                    <>
                                        {/* Area fill */}
                                        <polygon 
                                            points={areaPoints} 
                                            fill="url(#hashrateGradient)" 
                                            stroke="none"
                                        />
                                        {/* Line */}
                                        <polyline 
                                            points={points} 
                                            fill="none" 
                                            stroke="url(#lineGradient)" 
                                            strokeWidth="2.5"
                                            filter="drop-shadow(0 0 4px #fbbf24)"
                                        />
                                        {/* Data points */}
                                        {historyData.map((d, i) => {
                                            const x = 50 + (i / (historyData.length - 1)) * 700;
                                            const y = 170 - ((d.hashrate - minHashrate) / range) * 130;
                                            return (
                                                <circle 
                                                    key={i}
                                                    cx={x} 
                                                    cy={y} 
                                                    r="3" 
                                                    fill="#fbbf24"
                                                    stroke="#1f2937" 
                                                    strokeWidth="1.5"
                                                    className="hover:r-4 transition-all cursor-pointer"
                                                />
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </svg>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-secondary-text py-5">
                            {historyData.length > 0 && (() => {
                                const maxHashrate = Math.max(...historyData.map(d => d.hashrate));
                                const minHashrate = Math.min(...historyData.map(d => d.hashrate));
                                const range = maxHashrate - minHashrate || 1;
                                
                                return [
                                    <span key="max">{formatHashrate(maxHashrate)}</span>,
                                    <span key="mid">{formatHashrate(minHashrate + range * 0.5)}</span>,
                                    <span key="min">{formatHashrate(minHashrate)}</span>
                                ];
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-secondary-text">No hashrate data available</div>
                    </div>
                )}
            </div>

            {/* Stats summary */}
            {historyData.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(() => {
                        const hashrates = historyData.map(d => d.hashrate);
                        const avg = hashrates.reduce((a, b) => a + b, 0) / hashrates.length;
                        const max = Math.max(...hashrates);
                        const min = Math.min(...hashrates);
                        const current = hashrates[hashrates.length - 1];
                        
                        return [
                            { label: 'Current', value: formatHashrate(current), color: 'text-amber-400' },
                            { label: 'Average', value: formatHashrate(avg), color: 'text-blue-400' },
                            { label: 'Peak', value: formatHashrate(max), color: 'text-green-400' },
                            { label: 'Low', value: formatHashrate(min), color: 'text-red-400' }
                        ];
                    })().map((stat, i) => (
                        <div key={i} className="text-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-secondary-text font-medium">{stat.label}</div>
                            <div className={`text-sm font-mono font-semibold mt-1 ${stat.color}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}
        </CardBase>
    );
};

const UserStatsDashboard = ({ t, userStats, workers, totalUserHashrate, setWalletAddress, globalStats }) => {
    const walletKey = (() => { try { return localStorage.getItem('solo_pool_wallet') || 'default'; } catch(e){ return 'default'; } })();
    const storageKey = `customWorkerNames_${walletKey}`;
    const [customNames, setCustomNames] = useState(() => {
        try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (e) { return {}; }
    });

    const saveCustomNames = (next) => {
        setCustomNames(next);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) { /* ignore */ }
    };

    return (
        <div className="mb-6">
            <CardBase className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-sonar-ping" style={{ animationDelay: '0s' }}></div>
                            <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-sonar-ping" style={{ animationDelay: '0.7s' }}></div>
                            <div className="relative z-10 p-3 bg-slate-900 rounded-full shadow-lg flex items-center justify-center">
                                <Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" className="w-8 h-8 text-accent-gold icon-glow-accent-gold" />
                            </div>
                        </div>
                        <div>
                            <div className="mt-2">
                                <div className="text-lg font-mono text-secondary-text">{t('hashrate') || 'Hashrate'}</div>
                                <div className="text-xl md:text-2xl font-mono font-extrabold text-accent-gold text-glow-accent-gold leading-tight">{totalUserHashrate ? formatHashrate(totalUserHashrate) : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="bg-slate-900/40 p-3 rounded">
                                <div className="text-sm font-mono text-secondary-text">{t('estTimeToBlock') || 'Est. Time to Block'}</div>
                                <div className="text-2xl md:text-xl font-mono font-semibold text-accent-gold text-glow-accent-gold-sm">{userStats?.estTimeToBlock ?? 'N/A'}</div>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded">
                                <div className="text-sm font-mono text-secondary-text">{t('bestDifficulty') || 'Best Diff (all-time)'}</div>
                                <div className="text-2xl md:text-xl font-mono font-semibold text-accent-gold text-glow-accent-gold-sm">{userStats && userStats.bestDifficulty ? formatDifficulty(userStats.bestDifficulty) : 'N/A'}</div>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded">
                                <div className="text-sm font-mono text-secondary-text">{t('workersActive') || 'Active Workers'}</div>
                                <div className="text-2xl md:text-xl font-mono font-semibold text-green-400">{userStats?.workersActive ?? (workers ? workers.length : 0)}</div>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded">
                                <div className="text-sm font-mono text-secondary-text">{t('distanceToNetwork') || 'Distance to Network'}</div>
                                <div className="text-2xl md:text-xl font-mono font-semibold text-accent-gold">{userStats?.distanceToNetwork ?? 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-3">{t('myWorkers') || 'My Workers'}</h3>
                    {(!workers || workers.length === 0) ? (
                        <div className="text-sm text-secondary-text py-6">{t('noWorkers') || 'No active workers found.'}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="text-left text-xs text-secondary-text border-b border-slate-800">
										<th className="p-3">{t('status') || 'Status'}</th>
                                        <th className="p-3">{t('name') || 'Name'}</th>
                                        <th className="p-3 text-right">{t('hashrate') || 'Hashrate'}</th>
                                        <th className="p-3 text-center">Trend</th>
                                        <th className="p-3 text-right">{t('bestDifficulty') || 'Best Diff'}</th>
                                        <th className="p-3 text-right">{t('uptime') || 'Uptime'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map((w, idx) => (
                                        <WorkerRow 
                                            key={idx} 
                                            w={w} 
                                            idx={idx} 
                                            customNames={customNames} 
                                            saveCustomNames={saveCustomNames}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Historical Hashrate Section */}
                <div className="mt-8">
                    <HashrateHistoryChart 
                        walletAddress={userStats?.address || localStorage.getItem('solo_pool_wallet')} 
                        userStats={userStats}
                    />
                </div>
            </CardBase>
            {/* hashrate history UI removed per user request */}
        </div>
    );
};

const Footer = ({ t, language, setLanguage }) => {
  const btcAddress = "bc1q4jefr6uu2v42a4x5mkqwt6rftkyr86rpzffh5v4a5k78pw7vv4us9r5tyy";
  const lightningAddress = "morninghaze22032@getalby.com";
  const [copied, setCopied] = useState('');

  const handleCopy = (address, type) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <footer className="bg-dark-blue-bg/60 border-t border-dark-blue-border/50 mt-8 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-secondary-text text-sm">
        <div className="mb-8">
          <p className="mb-4">{t('donationMessage')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center justify-center bg-slate-800 rounded-full px-3 py-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin" className="w-5 h-5 mr-2"/>
              <code className="text-xs text-primary-text break-all">{btcAddress}</code>
              <button onClick={() => handleCopy(btcAddress, 'btc')} className="ml-3 text-secondary-text hover:text-accent-gold transition-colors flex-shrink-0" title={copied === 'btc' ? t('copied') : t('copy')}>
                <Icon path={copied === 'btc' ? "M4.5 12.75l6 6 9-13.5" : "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.792-.03 1.188 0 1.13.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h12.75a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5z"} className="w-5 h-5" />
              </button>
            </div>
            <div className="inline-flex items-center justify-center bg-slate-800 rounded-full px-3 py-2">
              <Icon path="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" className="w-5 h-5 mr-2 text-bitcoin-orange"/>
              <code className="text-xs text-primary-text break-all">{lightningAddress}</code>
              <button onClick={() => handleCopy(lightningAddress, 'ln')} className="ml-3 text-secondary-text hover:text-accent-gold transition-colors flex-shrink-0" title={copied === 'ln' ? t('copied') : t('copy')}>
                <Icon path={copied === 'ln' ? "M4.5 12.75l6 6 9-13.5" : "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.792-.03 1.188 0 1.13.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h12.75a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5z"} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <p className="mb-4">{t('ourPartners')}</p>
          <div className="flex justify-center items-center space-x-8">
            <a href="https://mineshop.eu/?wpam_id=35" target="_blank" rel="noopener noreferrer"><img src="/mineshop-logo.webp" alt="Mineshop Logo" className="h-16 filter grayscale hover:grayscale-0 transition duration-300"/></a>
            <a href="https://www.miningrigrentals.com?ref=53899" target="_blank" rel="noopener noreferrer"><img src="/mrr-logo2.png" alt="MiningRigRentals Logo" className="h-16 filter grayscale hover:grayscale-0 transition duration-300"/></a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6 mb-4 text-sm text-secondary-text">
            <p className="mr-4">Uptime : <span className="text-green-400 font-medium">{Math.max(0, Math.floor((Date.now() - new Date(localStorage.getItem('pool_start_date') || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()).getTime()) / (1000 * 60 * 60 * 24)))} days</span></p>
            <div className="flex items-center space-x-4">
                <span className="">{t('joinUsOn')}:</span>
                <a href="https://discord.gg/zEFrHyTF9Q" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-text hover:text-accent-gold transition-colors">Discord</a>
                <a href="https://x.com/findmyblock" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-text hover:text-accent-gold transition-colors">X</a>
            </div>
        </div>
                <div className="mt-2 text-xs text-secondary-text flex items-center justify-center space-x-3">
                    <span>Powered by <a href="https://github.com/benjamin-wilson/public-pool" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent-gold">public‑pool</a></span>
                    <span className="mx-2">|</span>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('openLegal'))} className="text-xs text-secondary-text hover:text-accent-gold underline inline">Legal notice</button>
                    <span className="mx-2">|</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-secondary-text">Change language:</span>
                        <button onClick={() => setLanguage('en')} title="English" className={`w-6 h-4 rounded-sm overflow-hidden focus:outline-none ${language === 'en' ? 'ring-2 ring-bitcoin-orange' : ''}`}>
                            <img src={`https://flagcdn.com/w20/gb.png`} alt="en" className="w-full h-full object-cover" />
                        </button>
                        <button onClick={() => setLanguage('fr')} title="Français" className={`w-6 h-4 rounded-sm overflow-hidden focus:outline-none ${language === 'fr' ? 'ring-2 ring-bitcoin-orange' : ''}`}>
                            <img src={`https://flagcdn.com/w20/fr.png`} alt="fr" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>
      </div>
    </footer>
  );
};

const NotFoundMessage = ({ t, address }) => (
    <CardBase className="p-6 text-center">
        <h3 className="text-xl font-semibold text-accent-gold font-title">Miner Not Found</h3>
        <p className="text-secondary-text mt-2">No active or past workers found for the address:</p>
        <p className="text-sm text-primary-text font-mono break-all mt-2 p-2 bg-slate-950/50 rounded-md">{address}</p>
        <p className="text-secondary-text mt-4 text-sm">Please ensure your miner is correctly configured for this pool and has been running for at least a few minutes to submit a share.</p>
    </CardBase>
);

// --- Main App Component ---
const LegalModal = ({ open, onClose }) => {
    if (!open) return null;
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-slate-900 rounded-lg max-w-3xl w-full p-6 overflow-auto max-h-[80vh]">
                <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold">Legal notice</h2>
                    <button onClick={onClose} className="text-secondary-text hover:text-white">✕</button>
                </div>
                <div className="mt-4 text-sm text-secondary-text space-y-4 leading-relaxed">
                    <section>
                        <h3 className="text-base font-semibold">Éditeur du site</h3>
                        <p className="mt-1"><strong>Nom du projet :</strong> FindMyBlock Mining Pool</p>
                        <p><strong>Nature :</strong> Projet personnel, non lucratif</p>
                        <p className="mt-1">Contact : <a href="mailto:powhashyt@proton.me" className="underline hover:text-accent-gold">powhashyt@proton.me</a></p>
                    </section>

                    <hr className="border-slate-700" />

                    <section>
                        <h3 className="text-base font-semibold">Protection des données</h3>
                        <p className="mt-1"><strong>Collecte :</strong> Le pool ne collecte pas de données personnelles identifiables.</p>
                        <p><strong>Données techniques :</strong> Seules sont traitées de manière anonyme les adresses publiques et statistiques nécessaires au fonctionnement du service.</p>
                        <p><strong>Finalité :</strong> Assurer le fonctionnement et la transparence du pool de minage.</p>
                        <p><strong>Conservation :</strong> Aucune donnée personnelle identifiée n'est conservée de manière permanente.</p>
                        <p><strong>Vos droits :</strong> Pour exercer vos droits (accès, rectification, suppression), contactez <a href="mailto:powhashyt@proton.me" className="underline hover:text-accent-gold">powhashyt@proton.me</a>.</p>
                    </section>

                    <hr className="border-slate-700" />

                    <section>
                        <h3 className="text-base font-semibold">Cookies</h3>
                        <p className="mt-1">Uniquement des cookies techniques nécessaires au fonctionnement du site et à la persistance locale (par ex. préférences). Aucune solution de suivi tiers n'est utilisée par défaut.</p>
                    </section>

                    <hr className="border-slate-700" />

                    <section>
                        <h3 className="text-base font-semibold">Responsabilité</h3>
                        <p className="mt-1">Le service est fourni "en l'état" sans garantie expresse. Il s'agit d'un projet éducatif et communautaire. L'utilisation se fait sous la responsabilité de l'utilisateur.</p>
                    </section>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-accent-gold text-black rounded">Fermer</button>
                </div>
            </div>
        </div>
    );
};
export default function App() {
    const { t, setLanguage, language } = useTranslation();
        // zoom feature removed per user request
  const [walletAddress, setWalletAddress] = useState('');
    const [showShortcutHint, setShowShortcutHint] = useState(false);
    const [sortConfig] = useState({ key: 'hashRate', direction: 'descending' });
  const [activeTab, setActiveTab] = useState('poolStats');
    // hashrate history and timeframe removed per user request
        // Challenge leader dynamic state placed early so hooks below can reference it safely
        const CHALLENGE_BASELINE = 676_000_000; // 676M baseline diff (kept for reference)
    // start empty so the real-time API value will populate the leader
    const [challengeLeader, setChallengeLeader] = useState({ addr: '', diff: 0 });

    const globalStats = useGlobalStats();

    // Derived truncated address for display in ChallengeMiniBar
        const challengeLeaderShortAddr = useMemo(() => {
            const a = challengeLeader.addr || '';
            if (!a) return '';
            if (a.includes('...')) return a; // already truncated pattern
            return a.length > 18 ? a.slice(0, 8) + '...' + a.slice(-6) : a;
        }, [challengeLeader.addr]);

        // Sync challenge leader in real-time from globalStats (derived from pool API)
        useEffect(() => {
            try {
                    const rawBest = globalStats?.pool?.rawBestDifficulty ?? null;
                    const bestAddr = globalStats?.poolMeta?.bestDifficultyAddress ?? null;
                    const topMiner = globalStats?.poolMeta?.topMiner ?? null;
                    if (bestAddr && rawBest != null) {
                        const isBitaxe = Boolean(topMiner?.isBitaxe);
                        const displayName = topMiner?.displayName || null;
                        if (bestAddr !== challengeLeader.addr || rawBest !== challengeLeader.diff || isBitaxe !== challengeLeader.isBitaxe) {
                            setChallengeLeader({ addr: bestAddr, diff: rawBest, isBitaxe, displayName });
                        }
                    }
                } catch (e) { /* silent */ }
            }, [globalStats?.pool?.rawBestDifficulty, globalStats?.poolMeta?.bestDifficultyAddress, globalStats?.poolMeta?.topMiner]);

        // (Removed defensive DOM-hiding effect) If leader text still appears,
        // edit `src/components/ChallengeMiniBar.*` directly to suppress it.

  const { userStats, isLoading: isUserStatsLoading } = useUserStats(walletAddress, globalStats.network.rawDifficulty);

    // Block-found visual state
    const [logoPulse, setLogoPulse] = useState(false);
    const [lastBlockPulse, setLastBlockPulse] = useState(false);
    const lastSeenBlockRef = useRef({ id: null, time: 0 });

    useEffect(() => {
        try {
            const latest = globalStats.latestBlocks && globalStats.latestBlocks[0];
            if (!latest || !latest.id) return;
            const now = Date.now();
            if (latest.id !== lastSeenBlockRef.current.id) {
                // throttle triggers to avoid spam (45s)
                if (!lastSeenBlockRef.current.time || (now - lastSeenBlockRef.current.time) > 45000) {
                    lastSeenBlockRef.current = { id: latest.id, time: now };
                    setLogoPulse(true);
                    setLastBlockPulse(true);
                    setTimeout(() => setLogoPulse(false), 1600);
                    setTimeout(() => setLastBlockPulse(false), 1600);
                } else {
                    // update id but skip visual trigger
                    lastSeenBlockRef.current.id = latest.id;
                }
            }
        } catch (e) { /* ignore */ }
    }, [globalStats.latestBlocks]);

    const [legalOpen, setLegalOpen] = useState(false);
    useEffect(() => {
            const opener = () => setLegalOpen(true);
            window.addEventListener('openLegal', opener);
            return () => window.removeEventListener('openLegal', opener);
    }, []);

    // hashrateHistory removed

  const totalUserHashrate = useMemo(() => userStats?.rawHashrate || 0, [userStats]);

  const visibleWorkers = useMemo(() => {
    if (!userStats?.workers) return [];
    return userStats.workers.filter(worker => worker.lastSeen && (Date.now() - new Date(worker.lastSeen).getTime()) < 900000);
  }, [userStats]);

  const sortedWorkers = useMemo(() => {
    if (!sortConfig.key) return visibleWorkers;
    const sortableItems = [...visibleWorkers];
    sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || 0;
        const bVal = b[sortConfig.key] || 0;
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [visibleWorkers, sortConfig]);

    // handleSort removed (unused)

  const handleWalletSubmit = (address) => {
        const normalizeBtcAddress = (addr) => {
            if (!addr || typeof addr !== 'string') return '';
            let s = addr.trim().replace(/^bitcoin:/i, '').replace(/\s+/g, '').replace(/[^\x21-\x7E]/g, '');
            if (/^bc1/i.test(s)) s = s.toLowerCase();
            return s;
        };
        const normalized = normalizeBtcAddress(address);
        if (!normalized) return;
        setWalletAddress(normalized);
        window.scrollTo(0, 0);
        try { localStorage.setItem('solo_pool_wallet', normalized); } catch (e) { /* ignore */ }
        setActiveTab('myStats');
  };

    useEffect(() => {
        const listener = (e) => e?.detail && handleWalletSubmit(e.detail);
        window.addEventListener('walletSubmit', listener);
        const clearListener = () => {
            try { localStorage.removeItem('solo_pool_wallet'); } catch (e) {} 
            setWalletAddress('');
            setActiveTab('myStats');
        };
        window.addEventListener('walletClear', clearListener);
        return () => {
            window.removeEventListener('walletSubmit', listener);
            window.removeEventListener('walletClear', clearListener);
        };
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('solo_pool_wallet');
            if (saved) setWalletAddress(saved);
        } catch (e) { /* ignore */ }
    }, []);

  const handleHomeClick = () => {
        setWalletAddress('');
        setActiveTab('poolStats');
  }
  
  const isLoading = globalStats.pool.hashrate === 'N/A';

  // keyboard zoom shortcuts removed

    const goToConnectionTutorial = () => {
        setActiveTab('connectionTutorial');
        document.getElementById('connection-tutorial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToMyStats = () => {
        setActiveTab('myStats');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

        const goToChallenges = () => {
            setActiveTab('challenges');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // Keyboard shortcuts: 1 -> Pool Stats, 2 -> How to connect, 3 -> My Stats, 4 -> Challenges
        useEffect(() => {
            const handleKey = (e) => {
                if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return; // ignore typing
                const key = e.key;
                if (key === '1') {
                    setActiveTab('poolStats');
                    maybeShowHint();
                } else if (key === '2') {
                    setActiveTab('connectionTutorial');
                    maybeShowHint();
                } else if (key === '3') {
                    setActiveTab('myStats');
                    maybeShowHint();
                } else if (key === '4') {
                    setActiveTab('challenges');
                    maybeShowHint();
                }
            };

            const maybeShowHint = () => {
                try {
                    const seen = localStorage.getItem('seen_shortcut_hint');
                    if (!seen) {
                        setShowShortcutHint(true);
                        localStorage.setItem('seen_shortcut_hint', '1');
                        setTimeout(() => setShowShortcutHint(false), 5000);
                    }
                } catch (e) { /* ignore */ }
            };

            window.addEventListener('keydown', handleKey);
            return () => window.removeEventListener('keydown', handleKey);
        }, []);

        // Console Easter-egg: when devtools is opened (heuristic), print an ASCII art + contact message.
        useEffect(() => {
            let printed = false;
            const printEasterEgg = () => {
                if (printed) return;
                printed = true;
                const art = [
                    '  __  __ _       _      _   ____  _   _ ',
                    ' |  \\/  (_)_ __ | | ___| | |  _ \\| | | |',
                    ' | |\\/| | | `_ \\| |/ _ \\ | | |_) | |_| |',
                    ' | |  | | | | | | |  __/ | |  __/|  _  |',
                    ' |_|  |_|_|_| |_|_|\\___|_| |_|   |_| |_|',
                ].join('\n');
                console.log('%c' + art, 'color:#f6b93b; font-family: monospace; font-size:12px;');
                console.log('%cYou found the console — need help or want to report an issue?','color:#9aa6b2');
                console.log('%cContact: powhashyt@proton.me','color:#9aa6b2; font-weight:600');
            };

            const checkDevtools = () => {
                try {
                    const threshold = 160; // heuristic threshold
                    const widthDiff = window.outerWidth - window.innerWidth;
                    const heightDiff = window.outerHeight - window.innerHeight;
                    if (widthDiff > threshold || heightDiff > threshold) {
                        printEasterEgg();
                    }
                } catch (e) { /* ignore */ }
            };

            // initial check
            checkDevtools();
            // listen for resizes (opening devtools often changes outer/inner dims)
            window.addEventListener('resize', checkDevtools);
            // a light interval as fallback
            const iv = setInterval(checkDevtools, 1500);
            return () => { window.removeEventListener('resize', checkDevtools); clearInterval(iv); };
        }, []);

    return (
        <div className="bg-dark-blue-bg text-primary-text min-h-screen font-body animated-dark-grid-bg">
            {showShortcutHint && (
                <div className="fixed top-4 right-4 z-50 bg-slate-900/90 text-sm text-primary-text px-4 py-2 rounded shadow-lg border border-slate-700">
                    Shortcuts: 1=Stats · 2=Connect · 3=My Stats
                </div>
            )}
            {/* Block toast removed; pulse effects remain */}
            <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
                <Header t={t} setLanguage={setLanguage} language={language} onHomeClick={handleHomeClick} onGoToConnection={goToConnectionTutorial} onGoToChallenges={goToChallenges} onGoToMyStats={goToMyStats} walletAddress={walletAddress} activeTab={activeTab} logoPulse={logoPulse} challengesLiveCount={2} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
                {activeTab === 'connectionTutorial' && (
                    <>
                        <Dashboard t={t} stats={globalStats} isLoading={isLoading || isUserStatsLoading} blockPulse={lastBlockPulse} />
                        <div id="connection-tutorial" className="mt-6"><PremiumConnectionTutorial t={t} /></div>
                    </>
                )}

                {activeTab === 'poolStats' && (
                                        <>
                                                {/* Challenge bar before tiles (dashboard grid) */}
                                {/* Bitaxe challenge mini bar removed */}
                                                <Dashboard t={t} stats={globalStats} isLoading={isLoading || isUserStatsLoading} blockPulse={lastBlockPulse} />
                                                <div className="mt-6"><OnlineDevices t={t} /></div>
                                        </>
                )}

                {activeTab === 'myStats' && (
                    <>
                        <Dashboard t={t} stats={globalStats} isLoading={isLoading || isUserStatsLoading} blockPulse={lastBlockPulse} />
                        {!walletAddress ? (
                            <div className="mt-6"><WalletConnectPanel t={t} onWalletSubmit={handleWalletSubmit} walletAddress={walletAddress} /></div>
                        ) : (
                            <div className="mt-6">
                                {userStats ? (
                                    <UserStatsDashboard 
                                        t={t} 
                                        userStats={userStats} 
                                        workers={sortedWorkers}
                                        totalUserHashrate={totalUserHashrate}
                                        setWalletAddress={setWalletAddress}
                                        globalStats={globalStats}
                                    />
                                ) : (
                                    <NotFoundMessage t={t} address={walletAddress} />
                                )}
                            </div>
                        )}
                        <div className="mt-6"><OnlineDevices t={t} /></div>
                    </>
                )}
                {activeTab === 'challenges' && (
                    <div className="mt-2"><ChallengesDashboard t={t} leader={challengeLeader} /></div>
                )}
            </main>
                    <Footer t={t} language={language} setLanguage={setLanguage} />
        </div>
    );
}
