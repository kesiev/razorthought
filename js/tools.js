function $(node,set,addTo) {
	if (typeof node == "string") 
		if (node.substr(0,1)=="#") node=document.getElementById(node.substr(1));
		else node=document.createElement(node);
	if (addTo && typeof addTo == "string") addTo=document.getElementById(addTo.substr(1));
	if (node) {
		if (set) {
			for (var a in set) {
				switch (a) {
					case "lazyObserve":{ break; } // Done at last
					case "css":{
						for (var k in set.css) node.style[k]=set.css[k];
						break;
					}
					default:{
						node[a]=set[a];
					}
				}
			}
			if (set.lazyObserve!==undefined)
				if (set.lazyObserve) $.lazy.observe(node);
				else $.lazy.solveObserve(node);
		}
		if (addTo) addTo.appendChild(node);
	}
	return node;
}
$.initialize=function() {
	$.lazy.initialize();
	$.fullScreen.initialize();
}
$.lazy={
	solveObserve:function(node) {
		node.style.backgroundImage = node._backgroundImage;
	},
	observe:function(node) {
		if (this._observer) this._observer.observe(node);
		else this.solveObserve(node);
	},
	reset:function() {
		if (this._observer) this._observer.disconnect();
	},
	initialize:function() {
		if ("IntersectionObserver" in window) {
			this._observer = new IntersectionObserver(function(entries, observer) {
				entries.forEach(function(entry) {
					if (entry.isIntersecting) {
						var node=entry.target;
						$.lazy.solveObserve(node);
						$.lazy._observer.unobserve(node);
					}
				});
			});
		};
	}
}
$.fullScreen={
	initialize:function(){
		var div=$("div");
		if (div.requestFullscreen) this.nativeFullscreen={request:"requestFullscreen",exit:"exitFullscreen",is:"fullscreen",on:"fullscreenchange",error:"fullscreenerror"};
		else if (div.webkitRequestFullscreen) this.nativeFullscreen={request:"webkitRequestFullScreen",exit:"webkitExitFullscreen",is:"webkitIsFullScreen",on:"webkitfullscreenchange",error:"webkitfullscreenerror"};
		else if (div.mozRequestFullScreen) this.nativeFullscreen={request:"mozRequestFullScreen",exit:"mozCancelFullScreen",is:"mozFullScreenElement",on:"mozfullscreenchange",error:"mozfullscreenerror"};
		else if (div.msRequestFullscreen) this.nativeFullscreen={request:"msRequestFullscreen",exit:"msExitFullscreen",is:"msFullscreenElement",on:"MSFullscreenChange",error:"msfullscreenerror"};
		else this.nativeFullscreen=false;
	},
	setFullScreen:function(node) {
		if (this.nativeFullscreen) node[this.nativeFullscreen.request]();
		else if (!this._fullscreen.node) {
			this._fullscreen.node=node;
			this._fullscreen.position=node.style.position;
			this._fullscreen.left=node.style.left;
			this._fullscreen.right=node.style.right;
			this._fullscreen.top=node.style.top;
			this._fullscreen.bottom=node.style.bottom;
			this._fullscreen.zIndex=node.style.zIndex;
			this._fullscreen.overflow=document.body.overflow;
			node.style.position="fixed";
			node.style.left=node.style.right=node.style.top=node.style.bottom="0px";
			node.style.zIndex=100000;
			document.body.overflow="hidden";
			if (this._fullscreen.onchange) this._fullscreen.onchange();
			if (this._fullscreen.onresize) this._fullscreen.onresize();
		}
	},
	exitFullScreen:function() {
		if (this.nativeFullscreen) {
			if (this.isFullScreen()) document[this.nativeFullscreen.exit]();
		} else if (this._fullscreen.node) {
			this._fullscreen.node.style.position=this._fullscreen.position;
			this._fullscreen.node.style.left=this._fullscreen.left;
			this._fullscreen.node.style.right=this._fullscreen.right;
			this._fullscreen.node.style.top=this._fullscreen.top;
			this._fullscreen.node.style.bottom=this._fullscreen.bottom;
			this._fullscreen.node.style.zIndex=this._fullscreen.zIndex;
			document.body.overflow=this._fullscreen.overflow;
			this._fullscreen.node=0;
			if (this._fullscreen.onchange) this._fullscreen.onchange();
			if (this._fullscreen.onresize) this._fullscreen.onresize();
		}
	},
	isFullScreen:function() {
		if (this.nativeFullscreen) return !!document[this.nativeFullscreen.is];
		else return !!this._fullscreen.node;
	},
	onFullScreenChange:function(fullScreenChange,fullScreenResize) {
		if (this.nativeFullscreen) {
			this.addEventListener(window,this.nativeFullscreen.on,fullScreenChange);
		} else {
			this._fullscreen.onchange=fullScreenChange;
			this._fullscreen.onresize=fullScreenResize;
		}
		this.addEventListener(window,"resize",fullScreenResize);
	},
	offFullScreenChange:function(fullScreenChange,fullScreenResize) {
		if (this.nativeFullscreen) {
			this.removeEventListener(window,this.nativeFullscreen.on,fullScreenChange);
		} else {
			this._fullscreen.onchange=0;
			this._fullscreen.onresize=0;
		}
		this.removeEventListener(window,"resize",fullScreenResize);
	},
	onFullScreenError:function(fullScreenError) {
		if (this.nativeFullscreen) this.addEventListener(window,this.nativeFullscreen.error,fullScreenError);
		else this._fullscreen.onerror=fullScreenError;
	},
	offFullScreenError:function(fullScreenError) {
		if (this.nativeFullscreen) this.removeEventListener(window,this.nativeFullscreen.error,fullScreenError);
		else this._fullscreen.onerror=0;
	}
}

var ShowCard={
	enabled:true,
	node:0,
	disable:function() {
		this.enabled=false;
		this.hide();
	},
	enable:function() {
		this.enabled=true;
	},
	hide:function() {
		if (this.node) {
			this.node.parentNode.removeChild(this.node);
			delete this.node;
		}
	},
	show:function(card) {
		if (this.enabled) {
			Audio.play("flagon");
			this.node=$("div",{
				className:"showcard",
				onmousedown:function(e) {
					ShowCard.hide();
					e.stopPropagation();
					return false;
				}
			},"#screen");
			$(Tools.renderCard(card,{noClick:true}),{id:"showcard"},this.node);
		}
	}
};

var NoUUID={ generateUUID:function() { return "none"; } }

var Tools={

	/* Timing tools */
	defer:function(fn,time) {
		if (!time) time=10;
		return setTimeout(fn,time)
	},

	/* Randomizers */
	shuffle:function(randomizer,a) {
	    for (let i = a.length - 1; i > 0; i--) {
	        const j = Math.floor(randomizer.random() * (i + 1));
	        [a[i], a[j]] = [a[j], a[i]];
	    }
	    return a;
	},
	randomNumber:function(randomizer,start,end) {
		return start+Math.floor(randomizer.random()*(end-start+1));
	},

	randomUnlock:function(randomizer,allset,excluded,runExcluded,unlockCount) {
		var ret=[],localExcluded=[],unlockableSet,set=this.clone(allset);
		// Get the valid unlockable items.
		excluded.forEach(exclude=>{
			if (exclude) Tools.exclude(set,exclude)
		});
		if (set.length==0) {
			set=Tools.clone(allset); // If there isn't anything more to unlock, just propose random things.
			unlockableSet=Tools.clone(allset);
		} else unlockableSet=Tools.clone(set); // ...else unlock what's left.
		// Exclude from the valid set the items unlocked for this run.
		Tools.exclude(set,runExcluded);
		// Extract items to unlock
		while (ret.length<unlockCount) {
			if (set.length==0) { // If unlocks are over we've probably excluded everything for this run...
				runExcluded.length=0; // ...reset excluded items in this run...
				set=this.clone(unlockableSet); // ...get all valid unlocks again...
				Tools.exclude(set,localExcluded); // ...and exclude just locally excluded items.
				if (set.length==0) { // If unlocks are still over, probably we're unlocking the last elements.
					localExcluded.length=0; // ...reset locally excluded items, so they may repeat...
					set=this.clone(unlockableSet); // ...get all valid unlocks again...
				}				
			}
			var pos=Math.floor(randomizer.random()*set.length);
			var picked=set[pos];
			set.splice(pos,1);
			ret.push(picked);
			runExcluded.push(picked);
			localExcluded.push(picked);
		}
		return ret;
	},

	randomElement:function(randomizer,list) {		
		return list[Math.floor(randomizer.random()*list.length)];
	},

	randomElements:function(randomizer,a,count) {
		var ret=[];
		if (count>=a.length) return a;
		else {
			var list=[];
			for (var i=0;i<a.length;i++) list.push(i);
			for (var i=0;i<count;i++) {
				var pos=list.splice(Math.floor(randomizer.random()*list.length),1)[0];
				ret.push(a[pos]);
			}
		}
		return ret;
	},

	/* Data manipulation */
	clone:function(data) { return JSON.parse(JSON.stringify(data)) },
	merge:function(from,to) {
		if (from instanceof Array)
			for (var i=from.length-1;i>=0;i--)
				to.unshift(this.clone(from[i]));
		else if (typeof from == "object") {
			for (var k in from) {
				if (to[k]===undefined)
					to[k]=this.clone(from[k]);
				else if (typeof from[k] == "object")
					this.merge(from[k],to[k]);
			}
		}
	},
	exclude:function(data,exclusion) {
		if (exclusion instanceof Array) {
			exclusion.forEach(exclude=>{
				var pos=data.indexOf(exclude);
				if (pos!=-1) data.splice(pos,1);
			});	
		} else {
			for (var exclude in exclusion) {
				var pos=data.indexOf(exclude);
				if (pos!=-1) data.splice(pos,1);
			}
		}
		return data;
	},

	/* Card tools */
	getOtherSide(side) { return side=="my"?"opponent":"my" },
	solveCard:function(card) {
		var done={};
		while (card.behavior.length) {
			var behaviorid=card.behavior.splice(0,1)[0];
			if (!done[behaviorid]) {
				done[behaviorid]=true;
				this.merge(BEHAVIORS[behaviorid],card);
			}
		}
		return card;
	},
	createCard:function(uuidgen,id) {
		var card=Tools.clone(CARDS[id]);
		card=this.solveCard(card);		
		if ((card.health!==undefined)&&(card.maxHealth===undefined)) card.maxHealth=card.health;
		return {
			uuid:"uuid-"+uuidgen.generateUUID(),
			data:card,
			vanilla:Tools.clone(card)
		}
	},
	nodeIsBack:function(node) { return node.className.match(/\bback\b/) },
	renderCard:function(card,mods) {
		if (!mods) mods={};
		var data=card.data;
		// Status icons
		var ret=$("div",{
			className:"card"+(mods.hide?" back":""),
			id:card.uuid,
			_card:card,
			_nodes:{},
			_markers:{}
		});
		// Card data
		if (data.cost!=undefined) ret._nodes.cost=$("div",{className:"cost icon",_className:"cost icon",innerHTML:data.cost},ret);
		if (data.attack!=undefined) ret._nodes.attack=$("div",{className:"attack icon",_className:"attack icon",innerHTML:data.attack},ret);
		if (data.health!=undefined) {
			var max="";
			if (data.health>=data.maxHealth) max=" max";
			ret._nodes.health=$("div",{className:"health icon"+max,_className:"health icon",innerHTML:data.health},ret);
		}
		if (data.power!=undefined) ret._nodes.power=$("div",{className:"power icon",_className:"power icon",innerHTML:data.power},ret);
		if (data.armor!==undefined) ret._nodes.armor=$("div",{className:"armor icon",_className:"armor icon",innerHTML:data.armor},ret);
		// Markersbox and sub-markers
		var markersbox=$("div",{className:"markersbox"},ret);
		for (var flag in FLAGS.list) {
			switch (FLAGS.list[flag].flagIcon) {
				case "small":{
					ret._markers[flag]=$("div",{className:"marker "+flag,_className:"marker "+flag},markersbox);
					break;
				}
				case "large":{
					ret._markers[flag]=$("div",{className:"marker "+flag,_className:"marker "+flag},ret);
					break;
				}
			}
		}
		// Card art
		var face=$("div",{
			className:"face",
			_cardnode:ret,
			onclick:mods.noClick?undefined:function() {
				if (!Tools.nodeIsBack(this._cardnode)) ShowCard.show(this._cardnode._card);
			}
		},ret);
		$("div",{className:"frame "+data.frame},face);
		var art=$("div",{className:"art "+data.frame},face);
		$("div",{
			className:"image",lazyObserve:!!mods.lazy,
			_backgroundImage:"url(css/"+data.image.url+".png), url(css/"+data.image.backgroundImage+".png)",
			css:{
				backgroundColor:data.image.backgroundColor,
				backgroundImage:"url(css/"+data.image.backgroundImage+".png)",
			}},art);
		$("div",{className:"label",innerHTML:Tools.getCardLabel(data,"name")},face);
		$("div",{className:"description",innerHTML:Tools.getCardLabel(data,"description")},face);		
		return ret;
	},
	getCard:function(container,uuid) {
		if (container)
			for (var i=0;i<container.length;i++) {
				if (container[i].uuid==uuid) return container[i];
			}
		return 0;
	},
	/* Count cards in a container. Cards that will be moved are not counted. */
	countCards:function(container) {
		var ret=0;
		container.forEach(card=>{ if (!card._destination) ret++; });
		return ret;
	},
	removeCard:function(container,uuid) {
		var found=-1;
		container.forEach((card,pos)=>{
			if (card.uuid==uuid) found=pos;
		});
		if (found!=-1) container.splice(found,1);
	},
	cardTypeIs:function(type,attr) {
		return CARDS[type].type==attr;
	},
	getUniqueCards:function(set) {
		var idx={};
		var ret=[];
		set.forEach(card=>{
			if (!idx[card.uuid]) {
				idx[card.uuid]=1;
				ret.push(card);
			}
		});
		return ret;
	},
	// Creates a deck of random cards
	createRandomDeck:function() {
		var deck={
			hero:this.randomElement(Math,Storage.INDEX.heroes.all),
			cards:{}
		};
		for (var i=0;i<Storage.DECKLIMITS[1];i++) {
			var card=this.randomElement(Math,Storage.INDEX.allExceptHeroes.all);
			if (deck.cards[card]) deck.cards[card]++;
			else deck.cards[card]=1;
		}
		return deck;
	},
	// Creates a random balanced deck
	createBalancedDeck:function(hero) {		
		// Prepare the deck layout
		var deck={
			hero:hero,
			cards:{}
		}
		var deckSetup={};
		var cardTypes=0;
		["units","actions","equipments"].forEach(k=>{
			deckSetup[k]=this.randomNumber(
				Math,
				Math.min(3,Storage.INDEX[k].all.length),
				Math.min(6,Storage.INDEX[k].all.length)
			);
			cardTypes+=deckSetup[k];
		});

		// Add cards types to the deck
		var cardsPerType=Math.ceil(Storage.DECKLIMITS[1]/cardTypes);
		for (var k in deckSetup) {
			var picks=this.randomElements(Math,Storage.INDEX[k].all,deckSetup[k]);
			picks.forEach(card=>{
				deck.cards[card]=cardsPerType;
			});
		}

		return deck;

	},

	/* Translation tools */
	sentence:function(sentences) {
		var ret="";
		sentences.forEach(sentence=>{
			sentence.forEach(symbol=>ret+=this.translate(symbol)+" ");
			ret=ret.substr(0,ret.length-1)+". ";
		});
		return ret.substr(0,ret.length-1);
	},
	translate:function(symbol) {
		return DICTIONARY[Storage.data.settings.language][symbol]||
			DICTIONARY.EN[symbol]||
			symbol;
	},
	getCardLabel:function(card,id) {
		return (card.labels[Storage.data.settings.language]?card.labels[Storage.data.settings.language][id]:0)||
			card.labels.EN[id]||
			"";
	},

	/* DOM tools */
	setNodeFlag:function(node,flag,value) {
		if (node) {
			node.className=node.className.replace(new RegExp("\\b"+flag+"\\b"),"").trim().replace(/\s{2,}/g," ");
			if (value) node.className+=" "+flag;
			if (node._markers&&node._markers[flag]) {
				node._markers[flag].className=node._markers[flag]._className;
				if (value) node._markers[flag].className+=" on";
			}
		}
	},
	removeNode:function(node) {
		node.parentNode.removeChild(node);
	},
	getNodePosition:function(node,containernode) {
		var top = 0, left = 0, element=node;
	    do {
	        top += element.offsetTop  || 0;
	        left += element.offsetLeft || 0;
	        element = element.offsetParent;
	    } while(element&&(element!==containernode));

	    return {
	        top: top,
	        left:left,
	        centerX:left+(node.offsetWidth/2),
	        centerY:top+(node.offsetHeight/2)
	    }
	},

	/* UI tools */
	restoreMenuMusic:function() {
		Audio.playMusic("music-menu");
	},
	windowShow:function(win) {
		this.defer(function(){
			Tools.setNodeFlag(win,"show",true);
		})
	},
	windowChange:function(win,destination,args) {
		ShowCard.disable();
		$.lazy.reset();
		$("#backbutton",{onclick:0,className:"disabled"});
		if (win) Tools.setNodeFlag(win,"leave",true);
		this.defer(function(){
			ShowCard.enable();
			destination.show.apply(destination,args);
		},win?1100:1);
	}
}