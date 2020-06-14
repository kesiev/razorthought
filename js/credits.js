
function Credits() {
	var self=this;

	var backObject;	

	function initializeScreen() {
		var credits=$("div",{id:"credits",className:"subscreen"},$("#screen",{innerHTML:""}));
		var titleBox=$("div",{className:"credits"},credits);
		$("div",{className:"title",innerHTML:Tools.translate("creditsTitle")},credits);		
		var backButton=$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0]);
			}
		},credits);

		var win=$("div",{className:"window"},credits);
		var credits="<div class='l'>"+DICTIONARY._.gameTitle+"</div><div class='s'>"+Tools.translate("gameSubtitle")+"</div>";
		credits+="<div class='m'>"+Tools.translate("creditsCodeBy")+"</div><div class='p'>"+DICTIONARY._.codeBy.join("<br>")+"</div>";
		credits+="<div class='m'>"+Tools.translate("creditsArtBy")+"</div><div class='p'>"+DICTIONARY._.artBy.join("<br>")+"</div>";
		credits+="<div class='m'>"+Tools.translate("creditsArtSupportBy")+"</div><div class='p'>"+DICTIONARY._.artSupportBy.join("<br")+"</div>";
		credits+="<div class='m'>"+Tools.translate("creditsMusicBy")+"</div><div class='p'>"+DICTIONARY._.musicBy.join("<br>")+"</div>";
		credits+="<div class='m'>"+Tools.translate("creditsSoundsBy")+"</div><div class='p'>"+DICTIONARY._.soundsBy.join("<br>")+"</div>";

		var creditsPanel=$("div",{className:"creditsbox",innerHTML:credits},win);
		
		return win;
	}

	this.show=function(back,deck) {
		Audio.play("flick");
		Tools.restoreMenuMusic();

		if (back) backObject=back;
		var win=initializeScreen();
		Tools.windowShow(win);
	}
}