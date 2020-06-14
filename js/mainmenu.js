
function MainMenu() {
	var self=this;
	var OPTIONS=[
		{id:"newGame"},
		{id:"buildDeck"},
		{id:"loadGame"},
		{id:"settings"},
		{id:"cardReader"}
	];

	var lock;

	function optionSelected() {
		if (!lock&&this._enabled) {
			lock=true;
			var option=this._option;
			Audio.play("confirm");
			switch (option.id) {
				case "newGame":{
					Tools.windowChange($("#mainmenu"),setup,[self]);
					break;
				}
				case "buildDeck":{
					Tools.windowChange($("#mainmenu"),deckBuilder,[self,true,0]);
					break;
				}
				case "settings":{
					Tools.windowChange($("#mainmenu"),settings,[self,true,0]);
					break;
				}
				case "loadGame":{
					var game=Storage.loadGame();
					Tools.windowChange($("#mainmenu"),window[Storage.GAMEMODES[game.settings.mode].manager],[self]);
					break;
				}
				case "cardReader":{
					Tools.windowChange($("#mainmenu"),cardReader,[self]);
					break;
				}
			}
		}
	}

	function enableOption(node) {
		Tools.setNodeFlag(node,"enabled",true);
		node._enabled=true;
	}

	function initializeScreen() {
		var mainMenu=$("div",{id:"mainmenu"},$("#screen",{innerHTML:""}));
		var node=$("div",{
			className:"version",
			innerHTML:Storage.STATS.fullVersion
		},mainMenu);

		$("div",{className:"logoart"},mainMenu);
		$("div",{className:"logo", innerHTML:DICTIONARY._.gameTitle},mainMenu);
		$("div",{className:"sublogo", innerHTML:Tools.translate("gameSubtitle")},mainMenu);

		OPTIONS.forEach((option,id)=>{
			var node=$("div",{
				className:"option option-"+id,
				_option:option,
				onclick:optionSelected
			},mainMenu);
			switch (option.id) {
				case "cardReader":{
					var unread=Storage.getUnreadCardsCount();
					enableOption(node);
					$("div",{className:"text",innerHTML:Tools.translate(option.id)+(unread?" ("+unread+")":"")},node);
					break;
				}
				case "settings":
				case "buildDeck":
				case "newGame":{
					enableOption(node);
					$("div",{className:"text",innerHTML:Tools.translate(option.id)},node);
					break;
				}
				case "loadGame":{
					var game=Storage.loadGame();
					if (game&&game.settings) {
						enableOption(node);
						var gamemode=Storage.GAMEMODES[game.settings.mode];
						$("div",{className:"text",innerHTML:Tools.translate(gamemode.id+"Continue")},node);
					} else {
						$("div",{className:"text",innerHTML:Tools.translate("noLoad")},node);
					}
					break;
				}
			}
		});
	}

	this.show=function() {
		Tools.restoreMenuMusic();
		lock=false;
		gameData=Storage.loadGame();
		initializeScreen();
	}

}
