var Storage={
	DECKLIMITS:[10,20],
	DECKSCOUNT:3,
	MAXOWNCARDS:3,
	GAMEMODES:[
		{id:"chaosMode",freePlay:true,defaultDifficulty:1,manager:"chaos",difficulties:["chaosEasy","chaosNormal","chaosHard"]},
		{id:"tournamentMode",defaultDifficulty:1,manager:"tournament",difficulties:["tournamentEasy","tournamentNormal","tournamentHard"]}
	],
	STATS:{
		version:0,
		allCardsCount:0,
		collectableCardsCount:0,
		textCount:0
	},
	INDEX:{
	},
	data:{
	},
	addToIndex:function(section,card){
		var cost=CARDS[card].cost;
		if (!this.INDEX[section]) this.INDEX[section]={all:[],byCost:{}};
		this.INDEX[section].all.push(card);
		if (!this.INDEX[section].byCost[cost]) this.INDEX[section].byCost[cost]=[];
		this.INDEX[section].byCost[cost].push(card)
	},
	initialize:function() {

		// Index cards
		for (var card in CARDS) {
			this.STATS.allCardsCount++;
			CARDS[card]._id=card;
			if (!CARDS[card].notCollectable) {
				this.STATS.collectableCardsCount++;
				if (TEXTS[card]) {
					this.STATS.textCount++;
					CARDS[card]._hasText=true;
				}
				this.addToIndex("all",card);
				if (Tools.cardTypeIs(card,"hero")) this.addToIndex("heroes",card); else {
					this.addToIndex("allExceptHeroes",card);
					if (Tools.cardTypeIs(card,"unit")) this.addToIndex("units",card); else
					if (Tools.cardTypeIs(card,"action")) this.addToIndex("actions",card); else
					if (Tools.cardTypeIs(card,"equipment")) this.addToIndex("equipments",card); else
					console.warn("Unknown card type",card);
				}
			}
		}

		// Initialize AI Models
		for (var id in AIMODELS) {
			var model=AIMODELS[id];
			if (!model.priorities) model.priorities=[];
			if (model.rootModel) {
				var rootModel=AIMODELS[model.rootModel];
				for (var k in rootModel)
					if ((k!="priorities")&&(model[k]===undefined)) model[k]=rootModel[k];
				if (rootModel.priorities)
					rootModel.priorities.forEach(priority=>{
						if (!priority.levels||(priority.levels.indexOf(model.rootModelLevel)!=-1))
							model.priorities.push(priority);
					});
			}
		}

		// Load data
		if (window.localStorage["_h_deckdata"])
			this.data=JSON.parse(window.localStorage["_h_deckdata"]);
		else
			this.data={};

		// Settings sanity check
		if (!this.data.settings) this.data.settings={};
		if (this.data.settings.table3d===undefined) this.data.settings.table3d=0;
		if (this.data.settings.fastAnimations===undefined) this.data.settings.fastAnimations=0;
		if (this.data.settings.music===undefined) this.data.settings.music=1;
		if (this.data.settings.sfx===undefined) this.data.settings.sfx=1;
		if (this.data.settings.language===undefined) {
			var language="EN";
			var userLang = navigator.language || navigator.userLanguage;
			if (userLang) {
				userLang=userLang.split("-")[0].toUpperCase();
				if (DICTIONARY[userLang]) language=userLang;
			}
			this.data.settings.language=language;
		}
		Audio.setMusic(this.data.settings.music);
		Audio.setEffects(this.data.settings.sfx);

		// Read cards sanity check
		if (!this.data.cardsRead) this.data.cardsRead={};

		// Cards sanity check
		if (!this.data.cards) this.data.cards={};
		if (!this.data.cards.availableCards) this.data.cards.availableCards={};
		
		// On debug mode gain all cards. Please don't use that for cheating :)
		for (var card in CARDS) {
			if (DICTIONARY._.DEBUGMODE||CARDS[card].baseCard)
				if (!this.data.cards.availableCards[card]||(this.data.cards.availableCards[card]<this.MAXOWNCARDS))
					this.data.cards.availableCards[card]=this.MAXOWNCARDS;
		}

		for (var k in this.data.cards.availableCards)
			if (this.data.cards.availableCards[k]>this.MAXOWNCARDS) this.data.cards.availableCards[k]=this.MAXOWNCARDS;

		// Basic deck
		if (!this.data.cards.decks) this.data.cards.decks=[];
		for (var i=0;i<this.DECKSCOUNT;i++)
			if (!this.data.cards.decks[i]) this.data.cards.decks[i]={hero:0,cards:{}};

		// Calculate version
		this.STATS.fullVersion="V"+Storage.STATS.version+"."+Storage.STATS.allCardsCount+"."+Storage.STATS.collectableCardsCount+"."+Storage.STATS.textCount;
	},
	saveData:function() {
		window.localStorage["_h_deckdata"]=JSON.stringify(this.data);
	},
	/* Read cards */
	cardIsReaded:function(id) {
		return !!this.data.cardsRead[id];
	},
	readCard:function(id) {
		if (!this.data.cardsRead[id]&&this.data.cards.availableCards[id]) {
			delete this.unreadCountUpdated;
			this.data.cardsRead[id]=1;
			this.saveData();
		}
	},
	getUnreadCardsCount:function() {
		if (!this.unreadCountUpdated) {
			this.unreadCountUpdated=true;
			this.unreadCount=0;
			for (var a in this.data.cards.availableCards)
				if (CARDS[a]._hasText&&!this.data.cardsRead[a]) this.unreadCount++;
		}
		return this.unreadCount;
	},
	/* Earn card */
	earnCard:function(id) {
		if (CARDS[id]) {
			delete this.unreadCountUpdated;
			if (!this.data.cards.availableCards[id]) this.data.cards.availableCards[id]=1;
			else this.data.cards.availableCards[id]++;
			if (this.data.cards.availableCards[id]>this.MAXOWNCARDS)
				this.data.cards.availableCards[id]=this.MAXOWNCARDS;
			this.saveData();
		}
	},
	/* Deck manipulation */
	getDeckIndex:function(deck) {
		return Object.keys(deck);
	},
	setDeckHero:function(builderData,deckid,card) {
		var done=false;
		var deck=builderData.decks[deckid];
		if (deck) {
			if (card) {
				if (!Tools.cardTypeIs(card,"hero")) done=false;
				else if (builderData.availableCards[card]) {
					deck.hero=card;
					done=true;
				}
			} else {
				deck.hero=0;
				done=true;
			}
		}
		if (done) this.saveData();
		return done;
	},
	setDeckCardQuantity:function(builderData,deckid,card,quantity) {
		if (Tools.cardTypeIs(card,"hero")) quantity=0;
		else {
			var deck=builderData.decks[deckid];
			if (deck) {
				if (builderData.availableCards[card]) {
					var stats=this.getDeckStats(builderData,builderData.currentDeck);
					if (quantity<0) quantity=0;				
					if (quantity>builderData.availableCards[card]) quantity=builderData.availableCards[card];
					if (quantity==0) delete deck.cards[card];
					else deck.cards[card]=quantity;
					this.saveData();
				}
			}
		}
		return quantity;
	},
	getDeckStats:function(builderData,deckid) {
		var stats={count:0,cost:0,isValid:false};
		var deck=builderData.decks[deckid];
		if (deck) {
			for (var k in deck.cards) {
				stats.count+=deck.cards[k];
				stats.cost+=CARDS[k].cost*deck.cards[k];
			}
			stats.isValid=
				deck.hero&&
				stats.count>=this.DECKLIMITS[0]&&
				stats.count<=this.DECKLIMITS[1];
		}
		return stats;
	},
	/* Game state */
	clearGame:function() {
		delete this.data.game;
		this.saveData();
	},
	saveGame:function(data) {
		this.data.game=data;
		this.saveData();
	},
	loadGame:function(data) {
		return this.data.game;
	}
};