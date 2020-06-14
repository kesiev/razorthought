
function Setup() {
	var self=this;

	var settings={
		newGame:true,
		deck:0,
		mode:0,
		difficulty:Storage.GAMEMODES[0].defaultDifficulty
	};

	var backObject,validDecks=[];

	function gameCanStart() {
		var mode=Storage.GAMEMODES[settings.mode];
		if (mode.freePlay) return true;
		else return validDecks[settings.deck];
	}

	function updateStartButton() {
		$("#startbutton",{className:"command start "+(gameCanStart()?"":"disabled")});
	}

	function updateDifficultyRoll() {
		var roll=$("#difficultyroll",{innerHTML:""});
		for (var i=0;i<Storage.GAMEMODES[settings.mode].difficulties.length;i++) {
			var panel=$("div",{className:"item"},roll);
			$("div",{
				className:"panelheader",
				innerHTML:Tools.translate(Storage.GAMEMODES[settings.mode].difficulties[i])
			},panel);
			$("div",{
				className:"paneldescription",
				innerHTML:Tools.translate(Storage.GAMEMODES[settings.mode].difficulties[i]+"Description")
			},panel);
		}
	}

	function updateDecksRoll() {
		var mode=Storage.GAMEMODES[settings.mode];
		var roll=$("#deckroll",{innerHTML:""});
		if (mode.freePlay) {
			var item=$("div",{className:"item"},roll);
			$("div",{className:"fulltext",innerHTML:Tools.translate("freePlay")},item);
			$("#editdeck",{css:{display:"none"}});
			$("#nextdeck",{css:{display:"none"}});
			$("#prevdeck",{css:{display:"none"}});
		} else {
			Storage.data.cards.decks.forEach((deck,id)=>{
				var item=$("div",{className:"item"},roll);
				var cardholder=$("div",{className:"cardholder"},item);
				if (deck.hero)
					$(Tools.renderCard(Tools.createCard(NoUUID,deck.hero)),0,cardholder);
				else
					$("div",{className:"fulltext",innerHTML:Tools.translate("noHero")},item);
				var stats=Storage.getDeckStats(Storage.data.cards,id);
				validDecks[id]=stats.isValid;
				$("div",{className:"stats",innerHTML:"<div class='symbol'></div>"+stats.count+"/"+Storage.DECKLIMITS[1]},item);			
			});	
			$("#editdeck",{css:{display:"block"}});
			$("#nextdeck",{css:{display:"block"}});
			$("#prevdeck",{css:{display:"block"}});		
		}
	}

	function updatePanels() {
		var mode=Storage.GAMEMODES[settings.mode];
		if (mode.freePlay)
			$("#deckpanel",{className:"backdecoration left panel selected-0"});
		else
			$("#deckpanel",{className:"backdecoration left panel selected-"+settings.deck});
		$("#modepanel",{className:"backdecoration middle panel selected-"+settings.mode});
		$("#difficultypanel",{className:"backdecoration right panel selected-"+settings.difficulty});
		updateStartButton();
	}

	function initializeScreen() {
		var setup=$("div",{id:"setup",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("setupTitle")},setup);
		$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0]);
			}
		},setup);

		var win=$("div",{className:"window"},setup);
		$("div",{
			id:"startbutton",
			innerHTML:Tools.translate("gameStart"),
			onclick:function() {
				if (gameCanStart()) {
					settings.modeId=Storage.GAMEMODES[settings.mode].id;
					settings.difficultyId=Storage.GAMEMODES[settings.mode].difficulties[settings.difficulty];
					Audio.play("swing");
					Tools.windowChange(win,window[Storage.GAMEMODES[settings.mode].manager],[self,settings]);
				}
			}
		},win);

		var panel=$("div",{id:"deckpanel"},win);
		$("div",{
			className:"button left",
			id:"prevdeck",
			onclick:function(){
				if (settings.deck>0) {
					Audio.play("swing");
					settings.deck--;
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{
			className:"button right",
			id:"nextdeck",
			onclick:function(){
				if (settings.deck<Storage.data.cards.decks.length-1) {
					Audio.play("swing");
					settings.deck++;
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{
			className:"command editdeck",
			id:"editdeck",
			innerHTML:Tools.translate("editDeck"),
			onclick:function(){
				Audio.play("swing");
				Tools.windowChange(win,deckBuilder,[self,true,settings.deck]);
			}},panel);
		$("div",{className:"roll",id:"deckroll"},panel);

		var panel=$("div",{id:"modepanel"},win);
		$("div",{
			className:"button left",
			onclick:function(){
				if (settings.mode>0) {
					Audio.play("swing");
					settings.mode--;
					settings.difficulty=Storage.GAMEMODES[settings.mode].defaultDifficulty;
					updateDecksRoll();
					updateDifficultyRoll();
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{
			className:"button right",
			onclick:function(){
				if (settings.mode<Storage.GAMEMODES.length-1) {
					Audio.play("swing");
					settings.mode++;
					settings.difficulty=Storage.GAMEMODES[settings.mode].defaultDifficulty;
					updateDecksRoll();
					updateDifficultyRoll();
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{className:"roll",id:"moderoll"},panel);

		var panel=$("div",{id:"difficultypanel"},win);
		$("div",{
			className:"button left",
			onclick:function(){
				if (settings.difficulty>0) {
					Audio.play("swing");
					settings.difficulty--;
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{
			className:"button right",
			onclick:function(){
				if (settings.difficulty<Storage.GAMEMODES[settings.mode].difficulties.length-1) {
					Audio.play("swing");
					settings.difficulty++;
					updatePanels();
				} else Audio.play("flagon");
			}
		},panel);
		$("div",{className:"roll",id:"difficultyroll"},panel);

		for (var i=0;i<Storage.GAMEMODES.length;i++) {
			var panel=$("div",{className:"item"},$("#moderoll"));
			$("div",{
				className:"panelheader",
				innerHTML:Tools.translate(Storage.GAMEMODES[i].id)
			},panel);
			$("div",{
				className:"paneldescription",
				innerHTML:Tools.translate(Storage.GAMEMODES[i].id+"Description")
			},panel);
		}

		updateDecksRoll();
		updateDifficultyRoll();
		updatePanels();

		return win;
	}

	this.show=function(back,deck) {
		Audio.play("flick");
		Tools.restoreMenuMusic();
		
		backObject=back||mainMenu;
		if (deck!==undefined) settings.deck=deck;
		var win=initializeScreen();
		Tools.windowShow(win);
	}
}