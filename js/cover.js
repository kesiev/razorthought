
function Cover() {
	var self=this;

	var backObject;	

	var LoadingScreen={
		onLoad:function() {
			this.loaded=true;
		},
		show:function() {
			var coverloading=$("div",{id:"coverloading",className:"subscreen"},$("#screen",{innerHTML:""}));
			$("div",{className:"loading",innerHTML:Tools.translate("loading")},coverloading);			
			$("div",{className:"cardart"},coverloading);
			var interval=setInterval(function(){
				if (LoadingScreen.loaded) {
					clearInterval(interval);
					Audio.play("confirm");
					Tools.windowChange(coverloading,mainMenu,[self]);
				}
			},500);
		}
	}

	function initializeScreen() {
		document.title=DICTIONARY._.gameTitle;
		var cover=$("div",{id:"cover",className:"subscreen"},$("#screen",{innerHTML:""}));
		var credits="<p>"+Tools.translate("gameCover").join("</p><p>")+"</p>";
		credits=credits.replace(/%gameTitle%/g,DICTIONARY._.gameTitle);
		credits=credits.replace(/%gameLicense%/g,DICTIONARY._.gameLicense);
		credits=credits.replace(/%gameSources%/g,DICTIONARY._.gameSources);
		$("div",{className:"creditsbox",innerHTML:credits},cover);
		$("div",{className:"buttoncomment",innerHTML:Tools.translate("buttonComment")},cover);
		$("div",{className:"logo",innerHTML:DICTIONARY._.gameTitle},cover);
		$("div",{className:"sublogo",innerHTML:Tools.translate("gameSubtitle")},cover);
		$("div",{className:"cardart"},cover);
		$("div",{
			className:"command start",
			innerHTML:Tools.translate("startLoading"),
			onclick:function() {
				Audio.initialize(ok=>{
					LoadingScreen.onLoad(ok);
				})
				Tools.windowChange(cover,LoadingScreen,[self]);
			}
		},cover);
	}

	this.show=function(back,deck) {
		initializeScreen();
	}
}