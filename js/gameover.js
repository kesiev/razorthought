
function GameOver() {

	function initializeScreen(text,subtext) {
		var gameover=$("div",{ id:"gameover", className:"leave" },$("#screen",{innerHTML:""}));

		$("div",{ className:"gameovermessage", innerHTML:Tools.translate(text||"gameOver") },gameover);

		if (subtext)
			$("div",{ className:"gameovertext", innerHTML:Tools.translate(subtext) },gameover);

		return gameover;
	}

	this.show=function(route,data) {
		var win=initializeScreen(data.text,data.subtext);
		Storage.clearGame();
		Audio.play("defeat");
		Tools.defer(function(){
			Tools.setNodeFlag(win,"leave",false);
			Tools.defer(function(){
				Tools.windowChange(win,mainMenu);
			},4000)
		});
	}
	
}
