function Chaos() {
	var self=this;

	this.show=function(back,settings) {
		var aiModel,earnCards;

		switch (settings.difficulty) {
			case 0:{
				aiModel=AIMODELS.easy;
				earnCards=1;
				break;
			}
			case 1:{
				aiModel=AIMODELS.normal;
				earnCards=2;
				break;
			}
			case 2:{
				aiModel=AIMODELS.hard;
				earnCards=3;
				break;
			}
		}

		var match=new Match();
		Tools.windowChange(0,match,[
			{
				onWin:{
					manager:"chaosWin",
					earnCards:earnCards
				},
				onLose:{
					manager:"setup"
				}
			},
			{decks:[Tools.createRandomDeck()]},
			{decks:[Tools.createRandomDeck()]},
			Tools.randomNumber(Math,0,1)==1, // Random starting player
			aiModel
		]);
	}
}

function ChaosWin() {
	var prizes;

	function givePrize(id) {
		if (prizes) {
			Storage.earnCard(id);
			prizes=0;
		}
	}

	function initializeScreen() {
		var chaosWin=$("div",{id:"chaoswin",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("chaosChoosePrize")},chaoswin);

		var win=$("div",{className:"window"},chaosWin);

		for (var i=0;i<prizes.length;i++) {
			var card=prizes[i];
			var panel=$("div",{className:"panel panel-"+i},win);
			$("div",{
				className:"command confirm panel-"+i,
				innerHTML:Tools.translate("chaosClaimCard"),
				_id:card,
				onclick:function(){
					givePrize(this._id);
					Audio.play("swing");
					Tools.windowChange(win,setup);
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
		
		earned=false;

		// Prepare prize, excluding already won cards.
		prizes=Tools.randomUnlock(
			Math,
			Storage.INDEX.allExceptHeroes.all,
			[],
			[],result.earnCards
		);

		var win=initializeScreen();
		Tools.windowShow(win);
	}
}
