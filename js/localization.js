var DICTIONARY={
	_:{
		DEBUGMODE:false,
		gameTitle:"Razorthought",
		gameSources:"https://github.com/kesiev/razorthought",
		gameLicense:"MIT",
		musicBy:[
			"Arnaldo Brenna",
			"Sergio Brenna"
		],
		soundsBy:[
			"Kenney",
			"https://opengameart.org/"
		],
		codeBy:[
			"KesieV"
		],
		artBy:[
			"KesieV"
		],
		artSupportBy:[
			"Bianca Brenna"
		]
	},
	IT:{
		/* GLOBAL */
		gameSubtitle:"Scontro di idee e uomini",
		gameCover:[
			"%gameTitle% &egrave; un Card Battler single player <a target='_blank' href='%gameSources%'>opensource</a> su licenza %gameLicense% e in CSS/HTML/JavaScript vanilla al quale ho lavorato nel 2020 durante il periodo di lockdown in Italia causato dalla pandemia del COVID-19. Prende a piene mani da un caposaldo del genere, &egrave; lontano dall'essere perfetto ma mi ha divertito lavorarci su. Probabilmente ci lavorer&ograve; ancora per un p&ograve;.",
			"Questo periodo mi ha concesso del tempo per riflettere come idee e persone, anche lontanissime nello spazio e nel tempo, possano incontrarsi e collaborare, combattendo e influenzandosi tra loro - che lo vogliano o no.",
			"Beh, in realt&agrave; mi ha anche concesso molto pi&ugrave; tempo del solito per disegnare, colorare, programmare e scrivere. Questo gioco raccoglie buona parte di quello che ho costruito.",
			"Ho anche avuto modo di lavorare con Arnaldo Brenna, un talentuoso musicista, imprenditore e operaio che abita nella mia stessa palazzina, e col quale abbiamo collaborato da balcone a balcone e con Bianca, mia moglie, che mi ha aiutato pazientemente e con costanza alla parte creativa.",
			"Lo lascio qua. Spero che possa essere utile per qualcuno. E, perch&egrave; no, magari anche divertente.",
			"&dash; Francesco \"KesieV\" Cottone",
			"<i>PS: Il gioco &egrave; pensato per girare su desktop. Durante il lockdown ho usato il cellulare veramente molto poco!</i>"
		],
		buttonComment:"Il gioco &egrave; ottimizzato per essere giocato su desktop e con il mouse/touchpad.",

		/* Battle */
		matchStart:"Iniza combattimento",
		player:"Giocatore",
		cpu:"Avversario",

		onPlay:"gioca",
		onAction:"usa",
		passTurn:"PASSA",
		quitMatch:"ESCI",

		pass:"passa",
		turnStart:"inizia il turno",
		gameStart:"per primo",
		targeting:"su",
		
		opponentTurn:"TURNO NEMICO",
		yourTurn:"TURNO GIOCATORE",

		victory:"VITTORIA",
		defeat:"SCONFITTA",

		/* General */
		noHero:"Nessun leader",
		freePlay:"Gioco libero",
		backButton:"Indietro",
		editDeck:"Modifica mazzo",
		
		/* Main menu */
		newGame:"Nuova partita",
		buildDeck:"Costruisci mazzo",
		noLoad:"Nessun salvataggio",

		/* Cover */
		startLoading:"Inizia",
		loading:"Caricamento",

		/* Credits */
		creditsTitle:"Crediti",
		creditsCodeBy:"Codice",
		creditsArtBy:"Grafica",
		creditsArtSupportBy:"Supporto grafico e creativo",
		creditsSoundsBy:"Effetti sonori su licenza CC0",
		creditsMusicBy:"Musica",

		/* Settings */
		settings:"Impostazioni",
		settingsTitle:"Impostazioni",
		settingEnabled:"Attivo",
		settingDisabled:"Disattivo",
		settingShow:"Mostra",
		fastAnimationsLabel:"Animazioni veloci",
		fullScreenLabel:"Schermo intero",
		table3dLabel:"Tavolo 3D",
		sfxLabel:"Effetti sonori",
		musicLabel:"Musica",
		languageLabel:"Lingua",
		creditsLabel:"Crediti",
		languageItalian:"Italiano",
		languageEnglish:"Inglese",

		/* Deck builder */
		deckBuilder:"Costruisci il tuo mazzo",

		/* Card reader */
		cardReader:"Leggi carte",
		cardReaderTitle:"Leggi carte",
		cardReaderNoArticle:"Spiacente, il testo di questa carta non &egrave; ancora pronto. Torna presto!",
		cardReaderBy:"Di",
		cardReaderInspiredBy:"Ispirato da:",
		cardReaderNoCardTitle:"Leggi carte",
		cardReaderNoCardText:"Questo gioco &egrave; una piattaforma di blogging in incognito: alcune carte nascondono qualcosa da leggere. Puoi leggere i testi delle carte che hai sbloccato da qui. Seleziona una carta e comincia a leggere!",

		/* Setup */
		setupTitle:"Prepara la battaglia",
		gameStart:"Inizio gioco",
		
		/* Game over */
		gameOver:"Fine gioco",

		/* Tournament */
		tournamentMode:"Torneo",
		tournamentModeDescription:"Scegli un mazzo e sconfiggi 4 leader di fila. Sblocchi una carta ogni incontro vinto... e perdi tutto se vieni sconfitto!",
		tournamentEasy:"Facile",
		tournamentEasyDescription:"L'intelligenza artificiale &egrave; rilassata. Le carte premio sono scelte a caso e solo una a caso tra queste sar&agrave; aggiunta alla tua collezione a fine torneo.",
		tournamentNormal:"Normale",
		tournamentNormalDescription:"L'intelligenza artificiale &egrave; un po' pi&ugrave; sfidante. Le carte premio sono scelte a caso e tutte verranno aggiunte alla tua collezione a fine torneo.",
		tournamentHard:"Difficile",
		tournamentHardDescription:"L'intelligenza artificiale &egrave; piuttosto aggressiva. Le carte non presenti nella tua collezione sono sbloccate scelte per prima e tutte verranno aggiunte alla tua collezione a fine torneo. Guadagnerai inoltre una carta leader!",
		tournamentModeContinue:"Continua torneo",
		tournamentModeTitle:"Modalit&agrave; torneo",
		tournamentChoosePrize:"Scegli un premio",
		tournamentClear:"Torneo completato!",
		tournamentFight:"Combatti!",
		tournamentAddToCollection:"Aggiungi alla collezione",
		tournamentClaimCard:"Prendi",

		/* Chaos */
		chaosMode:"Caos",
		chaosModeDescription:"Sconfiggi un leader casuale con un mazzo casuale... usando un leader casuale e un mazzo casuale! La partita non verr&agrave; salvata.",
		chaosEasy:"Facile",
		chaosEasyDescription:"L'intelligenza artificiale &egrave; rilassata. Vincerai una carta a caso per la tua collezione.",
		chaosNormal:"Normale",
		chaosNormalDescription:"L'intelligenza artificiale &egrave; un po' pi&ugrave; sfidante. Vincerai una carta a caso tra due per la tua collezione.",
		chaosHard:"Difficile",
		chaosHardDescription:"L'intelligenza artificiale &egrave; piuttosto aggressiva. Vincerai una carta a caso tra tre per la tua collezione.",
		chaosChoosePrize:"Scegli un premio",
		chaosClaimCard:"Prendi"
	},
	EN:{

		/* GLOBAL */
		gameSubtitle:"A battle of ideas and men",
		gameCover:[
			"%gameTitle% is an <a  target='_blank' href='%gameSources%'>opensource</a> single-player Card Battler game %gameLicense% licensed written in vanilla CSS/HTML/JavaScript I worked on in 2020 during the pandemic lockdown caused by COVID-19 virus. It has been heavily inspired by a stronghold of the genre, it's far for being perfect but I had fun working on it. I'll probably keep working on it a little more.",
			"This period allowed me some time to think about how ideas and people, even if far in time and space, may meet and cooperate, fighting and influencing each other - whether they want it or not.",
			"Well... it allowed me a lot of time for drawing, coloring, coding, and writing. This game collects most of the stuff I've built.",
			"I've also worked with Arnaldo Brenna, a very good musician, entrepreneur, and worker that lives in the same building I live with small meetings on the balcony, and Bianca, my wife, who patiently and daily worked at the creative part with me.",
			"I'm leaving this work here. I hope it will be useful for someone. And, why not, even entertaining.",
			"&dash; Francesco \"KesieV\" Cottone",
			"<i>PS: The game is optimized for desktop only. I've used my mobile device a little during this lockdown!</i>"
		],
		buttonComment:"The game is optimized to be played on a desktop with a mouse/touchpad.",

		/* Battle */
		matchStart:"Match start",
		player:"Player",
		cpu:"Opponent",

		onPlay:"plays",
		onAction:"uses",
		passTurn:"PASS",
		quitMatch:"EXIT",

		pass:"pass",
		turnStart:"turn starts",
		gameStart:"goes first",
		targeting:"on",
		
		opponentTurn:"OPPONENT TURN",
		yourTurn:"YOUR TURN",

		victory:"VICTORY",
		defeat:"DEFEAT",

		/* General */
		noHero:"No leader",
		freePlay:"Free play",
		backButton:"Back",
		editDeck:"Edit deck",
		
		/* Main menu */
		newGame:"New game",
		buildDeck:"Build decks",
		noLoad:"No saved game",

		/* Cover */
		startLoading:"Begin",
		loading:"Loading",

		/* Credits */
		creditsTitle:"Credits",
		creditsCodeBy:"Code",
		creditsArtBy:"Art",
		creditsArtSupportBy:"Art and creative support",
		creditsSoundsBy:"CC0 licensed sound effects",
		creditsMusicBy:"Music",

		/* Settings */
		settings:"Settings",
		settingsTitle:"Settings",
		settingEnabled:"Enabled",
		settingDisabled:"Disabled",
		settingShow:"Show",
		fastAnimationsLabel:"Fast animations",
		fullScreenLabel:"Full screen",
		table3dLabel:"3D Table",
		sfxLabel:"Sound effects",
		musicLabel:"Music",
		creditsLabel:"Credits",
		languageLabel:"Language",
		languageItalian:"Italian",
		languageEnglish:"English",

		/* Deck builder */
		deckBuilder:"Build your deck",

		/* Cards reader */
		cardReader:"Read cards",
		cardReaderTitle:"Read cards",
		cardReaderNoArticle:"Sorry, this card text is not ready yet. Come back soon!",
		cardReaderBy:"By",
		cardReaderInspiredBy:"Inspired by:",
		cardReaderNoCardTitle:"Card reader",
		cardReaderNoCardText:"This game is a blogging platform in disguise: some cards are hiding a little something to read about. You can read posts from your unlocked cards here. Select a card and start reading!",

		/* Setup */
		setupTitle:"Prepare for the battle",
		gameStart:"Game start",
		
		/* Game over */
		gameOver:"Game Over",

		/* Tournament */
		tournamentMode:"Tournament",
		tournamentModeDescription:"Choose a deck and beat 4 leaders in a row. You unlock a new card every match you win... and lose everything if you lose!",
		tournamentEasy:"Easy",
		tournamentEasyDescription:"The AI is relaxed so you can learn the basics of the game at your pace. Prize cards are picked randomly and just a random one of them will be added to your collection at the end of the tournament.",
		tournamentNormal:"Normal",
		tournamentNormalDescription:"The AI is a little more challenging. Prize cards are picked randomly and all of them will be added to your collection at the end of the tournament.",
		tournamentHard:"Hard",
		tournamentHardDescription:"The AI is quite aggressive. Prize cards that aren't in your collection are picked first and all of them will be added to your collection at the end of the tournament. You'll also earn a Leader card!",
		tournamentModeContinue:"Continue tournament",
		tournamentModeTitle:"Tournament mode",
		tournamentChoosePrize:"Choose your prize",
		tournamentClear:"Tournament cleared!",
		tournamentFight:"Fight!",
		tournamentAddToCollection:"Add to collection",
		tournamentClaimCard:"Get card",

		/* Chaos */
		chaosMode:"Chaos",
		chaosModeDescription:"Beat a random leader with a random deck... with a random leader and a random deck! This game is not saved.",
		chaosEasy:"Easy",
		chaosEasyDescription:"The AI is relaxed so you can learn the basics of the game at your pace. You will win a random card for your collection.",
		chaosNormal:"Normal",
		chaosNormalDescription:"The AI is a little more challenging. You will win one of two random cards for your collection.",
		chaosHard:"Hard",
		chaosHardDescription:"The AI is quite aggressive. You will win one of three random cards for your collection.",
		chaosChoosePrize:"Choose your prize",
		chaosClaimCard:"Get card"
	}
}
