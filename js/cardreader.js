function CardReader() {

	var backObject,cardsIndex,text,background,selectedid=0;

	function selectCard(id,card,noaudio) {
		var html,image;
		if (selectedid)
			$("#deck-"+selectedid,{className:"item"});
		if (id==selectedid) {
			selectedid=0;
			image="";
			html="<div class='l'>"+Tools.translate("cardReaderNoCardTitle")+"</div>";
			html+="<div class='p'>"+Tools.translate("cardReaderNoCardText")+"</div>";
			if (!noaudio) Audio.play("deploy");
		} else {
			Storage.readCard(id);
			Audio.play("flagon");
			selectedid=id;
			$("#deck-"+selectedid,{className:"item selected"});
			image="url(css/"+card.data.image.url+".png)";
			html="<div class='l'>"+Tools.getCardLabel(card.data,"name")+"</div>";
			var cardTextContainer=TEXTS[id];
			var cardText=Tools.getCardLabel(cardTextContainer,"text");
			var cardAuthor=Tools.getCardLabel(cardTextContainer,"textAuthor");
			var cardInspiration=Tools.getCardLabel(cardTextContainer,"textInspiration");
			if (cardText) {
				html+="<div class='m'>"+Tools.translate("cardReaderBy")+" "+cardAuthor+(cardInspiration?" &dash; "+Tools.translate("cardReaderInspiredBy")+" "+cardInspiration:"")+"</div>";
				html+="<div class='p'>"+cardText+"</div>";
			} else
				html+="<div class='p message'>"+Tools.translate("cardReaderNoArticle")+"</div>";
		}
		$(text,{innerHTML:html});
		$(background,{css:{backgroundImage:image}})
	}
	
	function initializeScreen() {
		var cardreader=$("div",{id:"cardreader",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("cardReaderTitle")},cardreader);		
		$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0]);
			}
		},cardreader);
		var win=$("div",{className:"window"},cardreader);
		text=$("div",{className:"text"},win);
		background=$("div",{className:"background"},win);
		var deck=$("div",{className:"frame deck",id:"deck"},win);
		cardsIndex.forEach(card=>{
			if (CARDS[card.id]._hasText) {
				var newcard=Tools.createCard(NoUUID,card.id);
				var item=$("div",{
					className:"item"+(Storage.cardIsReaded(card.id)?"":" unread"),
					id:"deck-"+card.id
				},deck);
				$("div",{className:"bullet"},item);	
				$("div",{
					className:"image",
					className:"image",lazyObserve:true,
					_backgroundImage:"url(css/"+newcard.data.image.url+".png)"
				},item);			
				$("div",{
					className:"cardname",
					innerHTML:Tools.getCardLabel(newcard.data,"name"),
					_id:card.id,
					_card:newcard,
					onclick:function() {
						selectCard(this._id,this._card);
					}
				},item);
			}
		})
		return win;
	}

	function renderCardInDeck(cardid,deck) {
		var card=Tools.createCard(NoUUID,cardid);
		var item=$("div",{
			className:"item",
			id:"deck-"+cardid
		},deck);
		$("div",{
			className:"image",
			css:{
				backgroundImage:"url(css/"+card.data.image.url+".png)"
			}
		},item);
		$("div",{
			className:"cost",
			innerHTML:card.data.cost
		},item);
		$("div",{
			className:"cardname",
			innerHTML:Tools.getCardLabel(card.data,"name"),
			onclick:function() {
				ShowCard.show(card);
			}
		},item);
		addCardQuantity(cardid,item);
		return;
	}

	this.show=function(back,isSystemDeck,deckData){
		Audio.play("flick");
		Tools.restoreMenuMusic();
		backObject=back;
		var idIndex=Storage.getDeckIndex(Storage.data.cards.availableCards);
		cardsIndex=[];
		idIndex.forEach(id=>cardsIndex.push({
			id:id,
			name:Tools.getCardLabel(CARDS[id],"name")
		}));
		cardsIndex.sort((a,b)=>{
			if (a.name>b.name) return 1; else
			if (a.name<b.name) return -1; else
			return 0;
		});

		var win=initializeScreen();
		selectCard(selectedid,0,true);
		Tools.windowShow(win);
	}

	return this;
}