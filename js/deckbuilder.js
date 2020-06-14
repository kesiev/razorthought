function Deckbuilder() {
	var FILTERS=[
		{id:"unit"},
		{id:"action"},
		{id:"equip"},
		{id:"hero"}
	];

	var cardsIndex;
	var currentDeck=0;
	var enabledFilters={}
	var builderData;
	var backObject;

	function initializeScreen() {
		var deckbuilder=$("div",{id:"deckbuilder",className:"subscreen"},$("#screen",{innerHTML:""}));
		$("div",{className:"title",innerHTML:Tools.translate("deckBuilder")},deckbuilder);
		$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0,currentDeck]);
			}
		},deckbuilder);

		var win=$("div",{className:"window"},deckbuilder);
		$("div",{className:"frame filters",id:"filters"},win);
		$("div",{className:"frame cardslist",id:"cardslist"},win);
		$("div",{className:"frame deckhero",id:"deckhero"},win);
		if (builderData.decks.length>1) {
			$("div",{className:"frame decks",id:"decks"},win);
			$("div",{className:"frame deck",id:"deck"},win);
		} else {
			$("div",{className:"frame deck large",id:"deck"},win);
		}
		$("div",{className:"counter",id:"deckcount"},$("div",{className:"frame deckcount"},win));		
		return win;
	}

	function updateQuantity(node) {
		var quantity;
		if (builderData.decks[currentDeck].hero==node._id) quantity=1;
		else quantity=builderData.decks[currentDeck].cards[node._id]||0;
		node._quantity.innerHTML=quantity+"/"+(builderData.availableCards[node._id]||0);
	}

	function updateAllQuantities() {
		var elms=document.getElementsByClassName("cardquantity");
		for (var i=0;i<elms.length;i++) updateQuantity(elms[i]);		
	}

	function updateDeckStats() {
		var stats=Storage.getDeckStats(builderData,currentDeck);
		$("#deckcount",{innerHTML:"<div class='symbol'></div>"+stats.count+"/"+Storage.DECKLIMITS[1]});
		$("#deck-"+currentDeck,{className:"item selected "+(stats.isValid?"":" invalid")});
	}

	function updateAllQuantitiesId(id) {
		var elms=document.getElementsByClassName("quantity-"+id);
		for (var i=0;i<elms.length;i++) updateQuantity(elms[i]);
	}

	function sumQuantity(cardid,amount) {
		if (Tools.cardTypeIs(cardid,"hero")) {
			var oldhero=builderData.decks[currentDeck].hero;
			var update=false;
			if (amount>0) {
				if (oldhero!=cardid) {
					Audio.play("equip");
					Storage.setDeckHero(builderData,currentDeck,cardid);
					update=true;
				}
			} else {
				if (oldhero) {
					Audio.play("deploy");
					Storage.setDeckHero(builderData,currentDeck,0);
					update=true;
				}
			}
			if (update) {
				updateDeckHero();
				updateAllQuantitiesId(oldhero);
				updateAllQuantitiesId(cardid);
			} else Audio.play("flagon");
		} else {
			var prevQuantity=builderData.decks[currentDeck].cards[cardid]||0;	
			var newQuantity=Storage.setDeckCardQuantity(builderData,currentDeck,cardid,prevQuantity+amount);
			if (prevQuantity!=newQuantity) {
				if (!prevQuantity&&newQuantity) {
					Audio.play("equip");
					addToDeck(cardid);
				} else if (prevQuantity&&!newQuantity) {
					Audio.play("deploy");
					removeFromDeck(cardid);				
				} else if (prevQuantity>newQuantity)
					Audio.play("swing");
				else Audio.play("flick");
				updateAllQuantitiesId(cardid);
			} else Audio.play("flagon");
		}
		updateDeckStats();
	}

	function addCardQuantity(cardid,to) {
		var qty=$("div",{className:"cardquantity quantity-"+cardid,_id:cardid},to);
		$("div",{
			className:"button minus",
			innerHTML:"-",
			onclick:function(){
				sumQuantity(cardid,-1);
			}},qty);
		qty._quantity=$("div",{className:"quantity"},qty);
		$("div",{
			className:"button plus",
			innerHTML:"+",
			onclick:function(){
				sumQuantity(cardid,1)
			}
		},qty);
		return qty;
	}

	function updateDeckHero() {
		var deckhero=$("#deckhero",{innerHTML:""});
		var card=builderData.decks[currentDeck].hero;
		if (card) renderCardInDeck(card,deckhero);
	}

	function updateFilters(skipupdate) {
		var filters={};
		FILTERS.forEach(filter=>{
			var selected=!!enabledFilters[filter.id];
			if (selected) {
				filters._any=true;
				filters[filter.id]=true;
			}
			Tools.setNodeFlag($("#filter-"+filter.id),"selected",selected)
		});
		var cardlist=$("#cardslist",{innerHTML:""});
		var cards=[];
		cardsIndex.forEach(id=>{
			var show=false;
			if (
				!filters._any||
				(filters.unit&&Tools.cardTypeIs(id,"unit"))||
				(filters.action&&Tools.cardTypeIs(id,"action"))||
				(filters.hero&&Tools.cardTypeIs(id,"hero"))||
				(filters.equip&&Tools.cardTypeIs(id,"equipment"))
			) {
				var created=Tools.createCard(NoUUID,id);
				cards.push({
					id:id,
					created:created,
					name:Tools.getCardLabel(created.data,"name"),
					cost:created.data.cost||0
				})
			}
		});

		cards.sort((a,b)=>{
			if (a.cost>b.cost) return 1; else
			if (a.cost<b.cost) return -1; else
			if (a.name>b.name) return 1; else
			if (a.name<b.name) return -1; else
			return 0;
		});
	
		cards.forEach(card=>{
			var item=$("div",{className:"item"},cardlist);
			var holder=$("div",{className:"cardholder"},item);
			$(Tools.renderCard(card.created,{lazy:true}),0,holder);
			addCardQuantity(card.id,item);				
		});
		if (!skipupdate) updateAllQuantities();
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

	function addToDeck(card) { renderCardInDeck(card,$("#deck")); }

	function removeFromDeck(card) {
		var node=$("#deck-"+card);
		Tools.removeNode(node);
	}

	function selectDeck(deckid) {
		Audio.play("flagon");
		currentDeck=deckid;
		var index=Storage.getDeckIndex(builderData.decks[currentDeck].cards);
		$("#deck",{innerHTML:""});
		index.forEach(card=>{addToDeck(card);});

		for (var i=0;i<builderData.decks.length;i++)
			Tools.setNodeFlag($("#deck-"+i),"selected",i==deckid);

		updateDeckHero();
		updateAllQuantities();
		updateDeckStats();
	}

	this.show=function(back,isSystemDeck,deckData){
		Audio.play("flick");
		Tools.restoreMenuMusic();
		
		backObject=back;

		if (isSystemDeck) {
			currentDeck=deckData;
			builderData={
				availableCards:Storage.data.cards.availableCards,
				decks:Storage.data.cards.decks
			}
		} else {
			currentDeck=0;
			builderData=deckData;
		}

		var win=initializeScreen();
		cardsIndex=Storage.getDeckIndex(builderData.availableCards);

		// Create deck selector
		if (builderData.decks.length>1) {
			var selector=$("#decks",{innerHTML:""});
			for (var i=0;i<builderData.decks.length;i++) {
				var stats=Storage.getDeckStats(builderData,i);
				var item=$("div",{
					className:"item"+(stats.isValid?"":" invalid"),
					id:"deck-"+i,
					_id:i,
					onclick:function(){
						selectDeck(this._id);
					}
				},selector);
				$("div",{className:"icon",innerHTML:i+1},item);
			}
		}

		// Create deck filters
		var filters=$("#filters",{innerHTML:""});
		FILTERS.forEach(filter=>{
			var item=$("div",{
				className:"item "+filter.id,
				id:"filter-"+filter.id,
				_id:filter.id,
				onclick:function(){
					enabledFilters[this._id]=!enabledFilters[this._id];
					updateFilters();
				}
			},filters);
			$("div",{className:"icon"},item);
		});

		// Update
		updateFilters(true);
		selectDeck(currentDeck);
		Tools.windowShow(win);
	}

	return this;
}