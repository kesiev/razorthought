
function Tournament() {
	var self=this;

	var gameStatus;
	var deckIsValid;
	var backObject;
	var aiModel;

	function initializeScreen() {
		var tournament=$("div",{id:"tournament",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{
			className:"title",
			innerHTML:Tools.translate("tournamentModeTitle")+" - "+Tools.translate(gameStatus.settings.difficultyId)
		},tournament);
		$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0]);
			}
		},tournament);

		var win=$("div",{className:"window"},tournament);

		var roll=$("div",{className:"backdecoration panel roll",id:"roll"},win);
		$("div",{
			className:"command editdeck",
			innerHTML:Tools.translate("editDeck"),
			onclick:function(){
				Audio.play("swing");
				Tools.windowChange(win,deckBuilder,[self,false,gameStatus.player]);
			}
		},roll);
		$("div",{className:"versus"},roll);
		$("div",{
			className:"command confirm"+(deckIsValid?"":" disabled"),
			innerHTML:Tools.translate("tournamentFight"),
			onclick:function(){
				if (deckIsValid) {
					var match=new Match();
					Audio.play("swing");
					Tools.windowChange(win,match,[
						{
							onWin:{
								manager:"tournamentWin",
								then:gameStatus.battlesToGo==0?"tournamentClear":"tournament"
							},
							onLose:{
								manager:"gameOver"
							}
						},
						gameStatus.player,
						gameStatus.opponent,
						Tools.randomNumber(Math,0,1)==1, // Random starting player
						aiModel
					]);
				}
			}
		},win);

		// Add hero
		var item=$("div",{className:"item main"},$("#roll"));
		var cardholder=$("div",{className:"cardholder"},item);
		if (gameStatus.player.decks[0].hero)
			$(Tools.renderCard(Tools.createCard(NoUUID,gameStatus.player.decks[0].hero)),0,cardholder);
		else
			$("div",{className:"fulltext",innerHTML:Tools.translate("noHero")},cardholder);
		var stats=Storage.getDeckStats(gameStatus.player,0);
		$("div",{className:"stats",innerHTML:"<div class='symbol'></div>"+stats.count+"/"+Storage.DECKLIMITS[1]},item);	

		// Add opponent
		var item=$("div",{className:"item main"},roll);
		var cardholder=$("div",{className:"cardholder"},item);
		$(Tools.renderCard(Tools.createCard(NoUUID,gameStatus.opponent.decks[0].hero)),0,cardholder);
		var stats=Storage.getDeckStats(gameStatus.opponent,0);
		$("div",{className:"stats",innerHTML:"<div class='symbol'></div>"+stats.count},item);

		// Add other enemies
		for (var i=0;i<gameStatus.battlesToGo;i++) $("div",{className:"item next"},roll);

		return win;
	}

	function getNextBattle(beaten) {

		var modeClear=false;

		if (beaten) {
			gameStatus.battlesCount++;
			gameStatus.battlesToGo--;
		}

		if (gameStatus.battlesToGo<=0) {
			modeClear=true;
		} else {

			// Get the next opponent
			gameStatus.opponent={
				decks:[
					Tools.createBalancedDeck(
						Tools.randomUnlock(
							Math,
							Storage.INDEX.heroes.all,
							[[gameStatus.player.decks[0].hero]],
							gameStatus.facedEnemies,
							1)[0]
					)
				]
			};
		}

		return modeClear;
	}

	function newGame(settings) {
		
		gameStatus={
			settings:settings,
			battlesCount:0,
			battlesToGo:3,
			player:0,
			opponent:0,
			facedEnemies:[],
			earnedCards:[],
			excludeFromPrize:[]
		};

		// Set player deck
		var deck=Storage.data.cards.decks[settings.deck];
		gameStatus.player={
			decks:[
				{
					hero:deck.hero,
					cards:{}
				}
			],
			availableCards:{},
			currentDeck:0
		}
		gameStatus.player.availableCards[deck.hero]=1;
		for (var k in deck.cards) {
			gameStatus.player.decks[0].cards[k]=deck.cards[k];
			gameStatus.player.availableCards[k]=deck.cards[k];
		}
		getNextBattle();
	}

	this.show=function(back,settings) {
		Audio.play("flick");
		Tools.restoreMenuMusic();

		if (back) backObject=back;
		if (settings) {
			if (settings.newGame) {
				newGame(settings);
				Storage.saveGame(gameStatus);
			} else if (settings.won) {
				getNextBattle(true);
				Storage.saveGame(gameStatus);
			} else console.warn("Unknown tournament state");
		}
		gameStatus=Storage.loadGame();
		switch (gameStatus.settings.difficulty) {
			case 0:{
				aiModel=AIMODELS.easy;
				break;
			}
			case 1:{
				aiModel=AIMODELS.normal;
				break;
			}
			case 2:{
				aiModel=AIMODELS.hard;
				break;
			}
		}
		var stats=Storage.getDeckStats(gameStatus.player,0);
		deckIsValid=stats.isValid;
		var win=initializeScreen();
		Tools.windowShow(win);
	}
}

function TournamentWin() {
	var self=this;

	var prizes,directions,gameData;

	function givePrize(id) {
		if (prizes) {
			if (!gameData.player.availableCards[id]) gameData.player.availableCards[id]=1;
			else gameData.player.availableCards[id]++;
			if (gameData.player.availableCards[id]>Storage.MAXOWNCARDS)
				gameData.player.availableCards[id]=Storage.MAXOWNCARDS;
			gameData.earnedCards.push(id);
			Storage.saveGame(gameData);
			prizes=0;
		}
	}

	function initializeScreen() {
		var tournamentWin=$("div",{id:"tournamentwin",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("tournamentChoosePrize")},tournamentwin);

		var win=$("div",{className:"window"},tournamentWin);

		for (var i=0;i<prizes.length;i++) {
			var card=prizes[i];
			var panel=$("div",{className:"panel panel-"+i},win);
			$("div",{
				className:"command confirm panel-"+i,
				innerHTML:Tools.translate("tournamentClaimCard"),
				_id:card,
				onclick:function(){
					givePrize(this._id);
					Audio.play("swing");
					Tools.windowChange(win,window[directions.then],[0,{won:true}]);
				}
			},win);
			$(Tools.renderCard(Tools.createCard(NoUUID,card)),0,panel);
			$("div",{className:"stats",innerHTML:"<div class='symbol'></div>"+(Storage.data.cards.availableCards[card]||0)+"/"+Storage.MAXOWNCARDS},panel);
		}

		return win;
	}

	this.show=function(_,result) {
		Audio.play("flick");
		Tools.restoreMenuMusic();

		gameData=Storage.loadGame();
		directions=result;

		// Prepare prize, excluding already won cards.
		prizes=Tools.randomUnlock(
			Math,
			Storage.INDEX.allExceptHeroes.all,
			[
				gameData.earnedCards,
				gameData.settings.difficulty>1?Storage.data.cards.availableCards:0
			],
			gameData.excludeFromPrize,3
		);

		var win=initializeScreen();
		Tools.windowShow(win);
	}
}

function TournamentClear() {
	var self=this;

	function initializeScreen() {
		var tournamentClear=$("div",{id:"tournamentclear",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("tournamentClear")},tournamentClear);

		var win=$("div",{className:"window"},tournamentClear);
		$("div",{
			className:"command confirm",
			innerHTML:Tools.translate("tournamentAddToCollection"),
			onclick:function(){
				if (gameData.earnedCards) {
					gameData.earnedCards.forEach(card=>{
						Storage.earnCard(card);
					});
					gameData.earnedCards=0;
					Storage.clearGame();
					Audio.play("swing");
					Tools.windowChange(win,mainMenu);
				}
			}
		},win);
		
		var roll=$("div",{className:"backdecoration panel roll"},win);

		for (var i=0;i<gameData.earnedCards.length;i++) {
			var card=gameData.earnedCards[i];
			var item=$("div",{className:"item"},roll);
			var cardholder=$("div",{className:"cardholder"},item);
			$(Tools.renderCard(Tools.createCard(NoUUID,card)),0,cardholder);
			$("div",{className:"stats",innerHTML:"<div class='symbol'></div>"+(Storage.data.cards.availableCards[card]||0)+"/"+Storage.MAXOWNCARDS},item);
		}

		return win;
	}

	this.show=function() {
		Audio.play("flick");
		Tools.restoreMenuMusic();
		
		gameData=Storage.loadGame();
		if (gameData.settings.difficulty==0)
			gameData.earnedCards=[Tools.randomElement(Math,gameData.earnedCards)];
		if (gameData.settings.difficulty==2) {
			var unlockedHero=Tools.randomUnlock(
				Math,
				Storage.INDEX.heroes.all,
				[
					gameData.earnedCards,
					gameData.settings.difficulty>1?Storage.data.cards.availableCards:0
				],
				gameData.excludeFromPrize,1
			);
			gameData.earnedCards.unshift(unlockedHero[0]);
		}
		var win=initializeScreen();
		Tools.windowShow(win);
	}
}