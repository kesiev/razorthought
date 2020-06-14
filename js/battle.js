
var Logic={

	// AI Tools
	sortByScore:function(set) {
		set.sort((a,b)=>{
			if (a.score>b.score) return -1; else
			if (a.score<b.score) return 1; else
			return 0;
		});
		return set;
	},

	// Handle value getters
	evaluateGetter:function(table,side,getter,subject,target) {
		var ret;
		var tableside=table.data[side];
		if (typeof getter == "object") {
			switch (getter.object) {
				case "target":{
					ret=target.data;
					break;
				}
				case "hero":{
					ret=tableside.hero[0].data;
					break;
				}
				case "side":{
					ret=tableside;
					break;
				}
				case "card":{
					ret=subject.card.data;
					break;
				}
			}			
			if (getter.attribute) ret=ret[getter.attribute];
			switch (getter.formula) {
				case "count":{
					ret=Tools.countCards(ret);
					break;
				}
			}
		} else ret=getter;
		return ret;
	},

	// Basic deck operations
	pickNewCard:function(table,side,containerid,uuid,carddata,set) {
		if (set instanceof Array)
			return Tools.randomElement(table,set);
		else if (set.fromCardsIndex) {
			var subindex=Storage.INDEX[set.fromCardsIndex];
			if (set.withCost) subindex=subindex.byCost[set.withCost];
			else subindex=subindex.all;
			return Tools.randomElement(table,subindex);
		} else if (set.targets) {
			var targets=this.getTargets(table,side,containerid,uuid,set.targets);
			if (targets.length)
				return targets[0].card.data._id;
			else
				return 0;
		} else if (set=="self")
			return carddata._id;
	},

	// Unit lifecycle
	heal:function(table,side,containerid,uuid,heal) {
		
		if (heal>0) {

			var tableside=table.data[side];
			var container=tableside[containerid];
			var card=Tools.getCard(container,uuid);
			var carddata=card.data;

			if (!carddata.flags.lose) {
				var oldValue=newValue=carddata.health;

				newValue+=heal;
				if (newValue>carddata.maxHealth) newValue=carddata.maxHealth;

				if (oldValue!=newValue) {
					carddata.health=newValue;
					table.addAnimation({action:"updateCardData",uuid:card.uuid,attribute:"health",from:oldValue,to:newValue,max:carddata.maxHealth});
				}	
			}

		}
	},

	dealDamage:function(table,fromside,fromcontainerid,fromuuid,side,containerid,uuid,damage) {

		if (damage>0) {

			var killed=false;
			var fromtableside=table.data[fromside];
			var fromcontainer=fromtableside[fromcontainerid];
			var fromcard=Tools.getCard(fromcontainer,fromuuid);
			var fromcarddata=fromcard.data;

			var tableside=table.data[side];
			var container=tableside[containerid];
			var card=Tools.getCard(container,uuid);
			var carddata=card.data;

			var allDamage=damage;

			this.triggerEvent(table,"onDamage",side,containerid,uuid,0,true);

			if (carddata.flags.shield) {
				var oldshield=carddata.flags.shield;
				carddata.flags.shield--;
				if (!carddata.flags.shield) delete carddata.flags.shield;
				table.addAnimation({action:"updateCardFlag",uuid:uuid,flag:"shield",from:oldshield,to:carddata.flags.shield});
			} else {

				if (carddata.armor>=damage) {
					var from=carddata.armor;
					carddata.armor-=damage;
					damage=0;
					table.addAnimation({action:"updateCardData",uuid:card.uuid,attribute:"armor",from:from,to:carddata.armor});
				} else {
					if (carddata.armor) {
						var from=carddata.armor;
						damage-=carddata.armor;
						carddata.armor=0;
						table.addAnimation({action:"updateCardData",uuid:card.uuid,attribute:"armor",from:from,to:carddata.armor});
					}
					if (damage&&carddata.health) {
						var from=carddata.health;
						if (carddata.health>damage) {
							carddata.health-=damage;
							damage=0;
						} else {
							damage-=carddata.health;
							carddata.health=0;
						}
						table.addAnimation({action:"updateCardData",uuid:card.uuid,attribute:"health",from:from,to:carddata.health,max:carddata.maxHealth});
						if (!carddata.health) {
							killed=true;
							this.triggerEvent(table,"onDead",side,containerid,uuid,0,true);
							this.triggerEvent(table,"onKill",fromside,fromcontainerid,fromuuid,0,true);
						}
					}
				}

				// lifeSteal
				var inflictedDamage=allDamage-damage;
				var heroCard=fromtableside.hero[0];
				if (!heroCard.data.flags.lose&&fromcarddata.flags.lifeSteal&&inflictedDamage)
					this.heal(table,fromside,"hero",heroCard.uuid,inflictedDamage);

				// Overkill
				if (killed&&damage)
					this.triggerEvent(table,"onOverkill",fromside,fromcontainerid,fromuuid,0,true);

			}

		}
	},

	// Card lifecycle
	deploy:function(table,side,containerid,uuid,card) {
		var tableside=table.data[side];

		if (containerid) {
			var container=tableside[containerid];
			card=Tools.getCard(container,uuid);

			Tools.removeCard(container,card.uuid);
			tableside.deployed.push(card);
		}

		this.triggerEvent(table,"onDeploy",side,"deployed",uuid,0,true);
		for (var k in card.data.flags)
			table.addAnimation({action:"updateCardFlag",uuid:uuid,flag:k,from:card.data.flags[k],to:card.data.flags[k]});	
		this.updateCardEffects(table,side,"deployed",uuid);
	},

	discard:function(table,side,containerid,uuid) {
		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);

		this.triggerEvent(table,"onDiscard",side,containerid,uuid,0,true);
		Tools.removeCard(container,card.uuid);
		tableside.discard.push(card);
		this.updateCardEffects(table,side,"discard",uuid);
	},

	equip:function(table,side,containerid,uuid) {
		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);

		this.triggerEvent(table,"onEquip",side,containerid,uuid,0,true);
		Tools.removeCard(container,uuid);
		tableside.equipment.push(card);
		this.updateCardEffects(table,side,"equipment",uuid);	
	},

	draw:function(table,side,card) {
		var tableside=table.data[side];
		tableside.hand.push(card);
		this.updateCardEffects(table,side,"hand",card.uuid);	
	},

	// Targeting
	getTargets:function(table,side,containerid,uuid,targets,destination) {
		var ret=[];
		var opponentside=Tools.getOtherSide(side);
		var tableside=table.data[side];
		var otherside=table.data[opponentside];
		var card=Tools.getCard(tableside[containerid],uuid);

		targets.forEach(line=>{

			// Line conditions
			var run;
			if (line.condition) run=this.evaluateCondition(table,side,containerid,uuid,line.condition);
			else run=true;

			if (run) {

				// Add cards to the set
				if (line.add) {
					var subtargets=[];
					line.add.forEach(addition=>{

						var currentside;

						if (addition.side=="opponent") {
							currentside=otherside;
							additionside=opponentside;
						} else {
							currentside=tableside;
							additionside=side;
						}

						switch (addition.container) {
							case "destination":{
								destination.forEach(target=>subtargets.push(target));
								break;
							}
							case "card":{
								subtargets.push({containerid:containerid,uuid:uuid,card:card,side:side});
								break;
							}
							default:{
								currentside[addition.container].forEach(card=>subtargets.push({containerid:addition.container,uuid:card.uuid,card:card,side:additionside}));
								break;
							}
						}

						/* Filters */
						// {any:1} - get all targets (implicit)

						if (addition.hasFlags) {
							var newsubtargets=[];
							subtargets.forEach(card=>{
								var condition=true;
								addition.hasFlags.forEach(flag=>{ condition=condition&&!!card.card.data.flags[flag]; });
								if (addition.not) condition=!condition;
								if (condition) newsubtargets.push(card);					
							});
							subtargets=newsubtargets;
						}

						if (addition.isType) {
							var newsubtargets=[];
							subtargets.forEach(card=>{
								if (card.card.data.type==addition.isType) newsubtargets.push(card);
							});
							subtargets=newsubtargets;	
						}

						if (addition.isId) {
							var newsubtargets=[];
							subtargets.forEach(card=>{
								if (card.card.data._id==addition.isId) newsubtargets.push(card);
							});
							subtargets=newsubtargets;	
						}

						if (addition.isNotMe) {
							var newsubtargets=[];
							subtargets.forEach(card=>{
								if (card.card.uuid!=uuid) newsubtargets.push(card);
							});
							subtargets=newsubtargets;		
						}

						if (addition.isDamaged) {
							var newsubtargets=[];
							subtargets.forEach(card=>{
								var damaged=card.card.data.health<card.card.data.maxHealth;
								if (
									(addition.isDamaged&&damaged)||
									(!addition.isDamaged&&!damaged)
								) newsubtargets.push(card);
							});
							subtargets=newsubtargets;		
						}
					});
					subtargets.forEach(sub=>ret.push(sub));
				}

				// Handle card exclusives (i.e. taunt cards)
				if (line.exclusiveFlags) {
					var exclusives=[];
					ret.forEach(card=>{
						var isExclusive=false;
						line.exclusiveFlags.forEach(k=>{
							if (card.card.data.flags[k]) {
								isExclusive=true;
							}
						});
						if (isExclusive) exclusives.push(card);
					});
					if (exclusives.length) ret=exclusives;
				}

				// Handle flags exclusion
				if (line.exclude) {
					var newret=[];					
					ret.forEach(card=>{
						var exclude=false;
						if (line.exclude.flags)
							line.exclude.flags.forEach(k=>{
								if (card.card.data.flags[k]) exclude=true;
							});
						if (!exclude) newret.push(card);
					});
					ret=newret;
				}

				// Randomly picks
				if (line.someRandomly)
					ret=Tools.randomElements(table,ret,line.someRandomly);

			}
				
		});

		ret=Tools.getUniqueCards(ret);

		return ret;
	},

	canTriggerEvent:function(table,event,side,containerid,uuid,target) {
		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);
		var carddata=card.data;

		var ret;
		if (carddata[event])
			ret=this.evaluateCondition(table,side,containerid,uuid,carddata[event].condition);
		else
			ret=true;
			
		return ret;
	},

	// Gameplay conditions
	canDeploy:function(table,side) {
		var tableside=table.data[side];
		var hero=tableside.hero[0];
		return this.evaluateCondition(table,side,"hero",hero.uuid,hero.data.rules.canDeploy);
	},

	canPick:function(table,side) {
		var tableside=table.data[side];
		var hero=tableside.hero[0];
		return this.evaluateCondition(table,side,"hero",hero.uuid,hero.data.rules.canPick);
	},

	// If-then
	evaluateCondition:function(table,side,containerid,uuid,condition) {

		var ret=true;
		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);

		if (card) 
			if (condition) { 

				var defaultSubjects=[{
					side:side,
					containerid:containerid,
					card:card
				}];

				condition.forEach(line=>{

					// Define condition subjects
					var subjects=defaultSubjects;
					if (line.into) {
						subjects=[];
						tableside[line.into].forEach(card=>{
							subjects.push({
								side:side,
								containerid:line.into,
								card:card
							});
						});
					}

					// Evaluate conditions
					var lineret=true;

					if (subjects.length)
						subjects.forEach(subject=>{

							var subjectret=true;

							if (line.canDeploy) subjectret=subjectret&&this.canDeploy(table,side);
							if (line.canPick) subjectret=subjectret&&this.canPick(table,side);

							if (line.is) {
								var value1=this.evaluateGetter(table,side,line.value1,subject);
								var value2=this.evaluateGetter(table,side,line.value2,subject);
								switch (line.is) {
									case ">":{ subjectret=subjectret&&(value1>value2); break; }
									case "<":{ subjectret=subjectret&&(value1<value2); break; }
									case ">=":{ subjectret=subjectret&&(value1>=value2); break; }
									case "<=":{ subjectret=subjectret&&(value1<=value2); break; }
									case "==":{ subjectret=subjectret&&(value1==value2); break; }
									case "!=":{ subjectret=subjectret&&(value1!=value2); break; }
								}
							}
							if (line.isInto) subjectret=subjectret&&(subject.containerid==line.isInto);
							if (line.hasMana)
								subjectret=subjectret&&(table.data[subject.side].mana>=subject.card.data.cost);
							if (line.hasFlags) {
								var subret=false;
								line.hasFlags.forEach(flag=>{
									if (subject.card.data.flags[flag]) subret=true;
								});
								subjectret=subjectret&&subret;
							}
							if (line.has) {
								var subret=false;
								line.has.forEach(attribute=>{
									if (subject.card.data[attribute]) subret=true;
								});
								subjectret=subjectret&&subret;
							}	

							/* Closing */
							if (line.not) subjectret=!subjectret;
							lineret=lineret&&subjectret;

						});
					else
						lineret=false;

					ret=ret&&lineret;
				});
			} else ret=true; // If no condition, returns always true
		else ret=false; // If card doesn't exist, no condition applies

		return ret;
	},

	runCommands:function(table,side,containerid,uuid,commands,target) {
		
		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);
		var carddata=card.data;

		var otherside=Tools.getOtherSide(side);
		var othertableside=table.data[otherside];

		if (commands)
			commands.forEach(line=>{
				if (line._debugger) debugger;

				// Line conditions
				var run;
				if (line.condition) run=this.evaluateCondition(table,side,containerid,uuid,line.condition);
				else run=true;

				if (run) {

					// Get context
					var contexttableside=tableside;
					var contextside=side;
					if (line.to=="opponent") {
						contexttableside=othertableside;
						contextside=otherside;
					}

					// First mana counter updates
					if (line.gainMaxMana) {
						contexttableside.maxMana+=line.gainMaxMana;
						if (contexttableside.maxMana>contexttableside.hero[0].data.cost) contexttableside.maxMana=contexttableside.hero[0].data.cost;
						table.addAnimation({action:"updateMaxMana",isTop:contexttableside.isTop,mana:contexttableside.mana,maxMana:contexttableside.maxMana});
					}
					if (line.gainMana) {
						contexttableside.mana+=line.gainMana;
						table.addAnimation({action:"updateMana",isTop:contexttableside.isTop,mana:contexttableside.mana,maxMana:contexttableside.maxMana});
					}
					if (line.restoreMana) {
						contexttableside.mana=contexttableside.maxMana;
						table.addAnimation({action:"updateMana",isTop:contexttableside.isTop,mana:contexttableside.mana,maxMana:contexttableside.maxMana});
					}
					if (line.payMana) {
						contexttableside.mana-=carddata.cost;
						if (contexttableside.mana<0) contexttableside.mana=0;
						table.addAnimation({action:"updateMana",isTop:contexttableside.isTop,mana:contexttableside.mana,maxMana:contexttableside.maxMana});
					}
					if (line.consumePower) {
						var from=carddata.power;
						carddata.power-=line.consumePower;
						if (carddata.power<=0) {
							carddata.power=0;
							this.triggerEvent(table,"onNoPower",side,containerid,uuid,target,true);
						}
						table.addAnimation({action:"updateCardData",uuid:card.uuid,attribute:"power",from:from,to:carddata.power});
					}
					
					// Then others
					if (line.drawCards) {
						for (var i=0;i<line.drawCards;i++) {
							if (contexttableside.deck.length) {
								var pick=contexttableside.deck.splice(0,1)[0];
								table.addAnimation({action:"updateCardsLeft",isTop:contexttableside.isTop,cardsLeft:contexttableside.deck.length});
								if (this.canPick(table,contextside)) {
									table.addAnimation({action:"drawCard",isTop:contexttableside.isTop,hideCard:contexttableside.hideCards,card:pick});
									this.draw(table,contextside,pick);
								} else {
									table.addAnimation({action:"wasteCard",isTop:contexttableside.isTop,card:pick});
									contexttableside.wasted.push(pick);
								}
							}
						}
					}

					if (line.addCard) {
						for (var i=0;i<line.addCard;i++) {
							var pickid=this.pickNewCard(table,side,containerid,uuid,carddata,line.of);
							if (pickid) {
								var pick;
								switch (line.toContainer) {
									case "hand":{
										if (this.canPick(table,contextside)) {
											pick=Tools.createCard(table,pickid);
											table.addAnimation({action:"drawCard",isTop:contexttableside.isTop,hideCard:contexttableside.hideCards,card:pick});
											this.draw(table,contextside,pick);
										}
										break;
									}
									case "deployed":{
										if (this.canDeploy(table,contextside)) {
											pick=Tools.createCard(table,pickid);
											contexttableside.deployed.push(pick);
											table.addAnimation({action:"deployNew",isTop:contexttableside.isTop,newCard:pick});	
										}
										break;
									}
								}
								if (pick) {
									if (line.andExecute)
										this.runCommands(
											table,side,containerid,uuid,line.andExecute,
											{containerid:line.toContainer,uuid:pick.uuid,card:pick,side:contextside}
										);
									if (line.toContainer=="deployed")
										this.deploy(table,contextside,0,pick.uuid,pick); // No source container since card is generated
								}
							}
						}
					}

					if (line.targets) {
						var targets=this.getTargets(table,side,containerid,uuid,line.targets,[target]);
						line.do.forEach(doline=>{
							targets.forEach(subtarget=>{
								var value=doline.value?this.evaluateGetter(table,side,doline.value,{
									side:side,
									containerid:containerid,
									card:card
								},subtarget.card):1;
								var container,oldValue=0,newValue=0,abort=false;
								switch (doline.to) {
									case "flag":{
										if (subtarget.card) // Card may have disappeared a line before
											container=subtarget.card.data.flags;
										else
											abort=true;
										break;
									}
									case "card":{
										if (subtarget.card) // Card may have disappeared a line before
											container=subtarget.card.data;
										else
											abort=true;
										break;
									}
								}
								if (!abort) {
									if (doline.attribute) newValue=oldValue=container[doline.attribute]||0;
									switch (doline.action) {
										case "discard":{
											table.addAnimation({action:"discard",isTop:table.data[subtarget.side].isTop,uuid:subtarget.uuid});
											this.discard(table,subtarget.side,subtarget.containerid,subtarget.uuid);
											break;
										}
										case "heal":{
											this.heal(table,subtarget.side,subtarget.containerid,subtarget.uuid,value);
											break;
										}
										case "dealDamage":{
											this.dealDamage(table,
												side,containerid,uuid,
												subtarget.side,subtarget.containerid,subtarget.uuid,
												value
											);
											break;
										}
										case "+":{ newValue+=value; break; }
										case "-":{ newValue-=value; break; }
										case "set":{ newValue=value; break; }
										case "unset":{ newValue=undefined; break; }
									}
									if (newValue!=oldValue) {
										switch (doline.to) {
											case "flag":{
												if (newValue===undefined) delete container[doline.attribute];
												else container[doline.attribute]=newValue;
												table.addAnimation({action:"updateCardFlag",uuid:subtarget.uuid,flag:doline.attribute,from:oldValue,to:newValue});	
												break;
											}
											case "card":{
												if (newValue<0) newValue=0;
												if (newValue!=oldValue) {									
													container[doline.attribute]=newValue;
													table.addAnimation({action:"updateCardData",uuid:subtarget.uuid,attribute:doline.attribute,from:oldValue,to:newValue});
												}
											}
										}
									}
								}
							})
						})						
					}

					// Card effect enable/disable
					if (line.setEffect) this.setEffect(table,side,uuid,line.setEffect);
					if (line.unsetEffect) this.unsetEffect(table,side,uuid);

					// Card lifecycle closers
					if (line.deploy) {
						card._destination="deployed";
						table.addAnimation({action:"deployed",isTop:contexttableside.isTop,uuid:card.uuid});	
					}			
					if (line.discard) {
						table.addAnimation({action:"preDiscard",isTop:contexttableside.isTop,uuid:card.uuid});
						card._destination="discard";
					}
					if (line.equip) card._destination="equipment";
					
					// Match closers
					if (line.lose) contexttableside.hero[0].data.flags.lose=1;

					// Attack and attack back.
					if (line.attack) {
						this.dealDamage(table,side,containerid,uuid,target.side,target.containerid,target.uuid,carddata.attack);
						if (!target.attackingBack) {
							// Attack back, if is an attacking card
							if (target.card.data.onAttackBack && target.card.data.attackBack) {
								var subtargets=this.getTargets(
									table,otherside,target.containerid,target.uuid,target.card.data.onAttackBack.targets,[{
									containerid:containerid,
									uuid:card.uuid,
									card:card,
									side:side,
									attackingBack:true
								}]);
								if (subtargets.length)
									this.triggerEvent(table,"onAttackBack",target.side,target.containerid,target.uuid,subtargets[0],true);
							}
						}
					}

					// Sub-calls
					if (line.triggerEvent) this.triggerEvent(table,line.triggerEvent,side,containerid,uuid,target,true);
					if (line.broadcastEvent) this.broadcastEvent(table,line.broadcastEvent,side,true);
				}

			});			
	},

	// Permanent effects
	setEffect:function(table,side,uuid,code) {
		var tableside=table.data[side];
		this.unsetEffect(table,side,uuid);
		var effect={targeted:{},justOnce:code.justOnce,code:code};
		tableside.effects[uuid]=effect;
		var targets=this.getTargets(table,side,0,uuid,effect.code.targets);
		targets.forEach(target=>{
			if (target.uuid!=uuid) {
				effect.targeted[target.uuid]=1;
				this.runCommands(table,target.side,target.containerid,target.uuid,effect.code.on);
			}
		});
	},

	unsetEffect:function(table,side,uuid) {
		var tableside=table.data[side];
		var effect=tableside.effects[uuid];
		if (effect) {
			for (var targetuuid in effect.targeted) {
				["my","opponent"].forEach(side=>{
					["deployed","hand","equipment","hero","discard"].forEach(containerid=>{
						var container=table.data[side];
						var card=Tools.getCard(container[containerid],targetuuid);
						if (card)
							this.runCommands(table,side,containerid,targetuuid,effect.code.off);			
					})	
				})
			}
			delete tableside.effects[uuid];
		}
	},

	updateCardEffects:function(table,side,containerid,uuid) {
		["my","opponent"].forEach(side=>{
			var tableside=table.data[side];
			for (var k in tableside.effects)
				if (uuid!=k) {
					var effect=tableside.effects[k];
					if (!effect.justOnce) {
						var targets=this.getTargets(table,side,0,0,effect.code.targets);
						var found=false;
						targets.forEach(target=>{
							if (target.uuid==uuid) found=true;
						});
						if (found) {
							if (!effect.targeted[uuid]) {
								effect.targeted[uuid]=1;
								this.runCommands(table,side,containerid,uuid,effect.code.on);
							}
						} else {
							if (effect.targeted[uuid]) {
								delete effect.targeted[uuid];
								this.runCommands(table,side,containerid,uuid,effect.code.off);	
							}
						}
					}
				}
		});
	},

	// Event system
	triggerEvent:function(table,event,side,containerid,uuid,target,subcall) {

		var tableside=table.data[side];
		var container=tableside[containerid];
		var card=Tools.getCard(container,uuid);
		var carddata=card.data;
		
		if (this.canTriggerEvent(table,event,side,containerid,uuid,target)) {
			["execute","then"].forEach(commands=>{
				if (carddata[event])
					this.runCommands(table,side,containerid,uuid,carddata[event][commands],target);
			});
			if (!subcall) {
				// Move cards around the table
				var moveCards;
				do {
					moveCards=false;
					["my","opponent"].forEach(side=>{				
						var tableside=table.data[side];
						["hand","equipment","deployed"].forEach(containerid=>{							
							var container=tableside[containerid];
							tableside[containerid].forEach(card=>{
								var carddata=card.data;
								switch (card._destination) {
									case "equipment":{
										if (carddata.equipmentSlot)
											for (var i=0;i<tableside.equipment.length;i++) {
												var pick=tableside.equipment[i];
												if (pick.data.equipmentSlot==carddata.equipmentSlot) {
													this.triggerEvent(table,"onUnequip",side,"equipment",pick.uuid,0,true);
													if (tableside.equipment[i]!==pick) i--;
												}
											}
										table.addAnimation({action:"equip",isTop:tableside.isTop,uuid:card.uuid});
										this.equip(table,side,containerid,card.uuid);
										moveCards=true;
										break;					
									}
									case "deployed":{
										this.deploy(table,side,containerid,card.uuid);
										moveCards=true;
										break;					
									}
									case "discard":{
										table.addAnimation({action:"postDiscard",isTop:tableside.isTop,uuid:card.uuid});	
										this.discard(table,side,containerid,card.uuid);
										moveCards=true;
										break;
									}									
								}

								delete card._destination;

							});
						});
					});
				} while (moveCards);
			}			
		}
	},

	broadcastEvent:function(table,event,side,subcall) {
		var tableside=table.data[side];

		tableside.hero.forEach(card=>this.triggerEvent(table,event,side,"hero",card.uuid,0));
		tableside.deployed.forEach(card=>this.triggerEvent(table,event,side,"deployed",card.uuid,0));
		tableside.equipment.forEach(card=>this.triggerEvent(table,event,side,"equipment",card.uuid,0));
		tableside.discard.forEach(card=>this.triggerEvent(table,event,side,"discard",card.uuid,0));
		tableside.hand.forEach(card=>this.triggerEvent(table,event,side,"hand",card.uuid,0));
	},

	evaluateEvent:function(table,event,side,containerid,aiModel,prev,options) {

		var tableside=table.data[side];
		var newOptions=0;
		var winning=false;

		for (var pos=0;pos<tableside[containerid].length;pos++) {
			var card=tableside[containerid][pos];	
			if (card.data[event]) {
				var action=0,hypothesis=0;

				if (card.data[event].targets) {
					var targets=this.getTargets(table,side,containerid,card.uuid,card.data[event].targets);
					targets.forEach(target=>{
						if (this.canTriggerEvent(table,event,side,containerid,card.uuid,target)) {

							hypothesis=table.clone();
							// Remap card reference from original table to the hypothesis
							target.card=Tools.getCard(hypothesis.data[target.side][target.containerid],target.uuid);

							this.triggerEvent(hypothesis,event,side,containerid,card.uuid,target);

							action={
								event:event,
								side:side,
								containerid:containerid,
								uuid:card.uuid,
								card:card,
								target:target
							};
						}
					})	
				} else if (this.canTriggerEvent(table,event,side,containerid,card.uuid)) {
					hypothesis=table.clone();
					this.triggerEvent(hypothesis,event,side,containerid,card.uuid);
					action={
						event:event,
						side:side,
						containerid:containerid,
						uuid:card.uuid,
						card:card
					};
				}
				if (action) { 
					var stats=this.evaluateTableScore(table,hypothesis,side,aiModel);
					if (stats.score>=0) {
						if (DICTIONARY._.DEBUGMODE) action.stats=stats;
						var sequence=Tools.clone(prev.sequence);
						sequence.push(action);
						newOptions++;
						var option={
							sequence:sequence,
							table:hypothesis,
							score:prev.score+stats.score
						};
						options.push(option);
						if (!winning&&stats.winning) winning=option;
					}
				}
			}
		}
		return winning;
	},

	evaluateFlags:function(stats,collection,set) {
		var ret=0;
		collection.forEach(card=>{
			for (var k in card.data.flags) {
				if (set.indexOf(k)!==-1) ret+=card.data.flags[k];
			}
		});
		return ret;
	},

	// AI Table evaluator
	evaluateTableScore:function(oldtable,newtable,side,aiModel) {
		var otherside=Tools.getOtherSide(side);
		
		var stats={};
		[
			["my",side,otherside],
			["opponent",otherside,side]
		].forEach(table=>{
			var t=stats[table[0]]={delta:{},absdelta:{}};
			var handIndex={};
			[
				["old",oldtable],
				["new",newtable]
			].forEach(time=>{
				var s=t[time[0]]={};
				var container=time[1].data[table[1]];
				// Plain stats
				s.health=container.hero[0].data.health;
				s.attack=container.hero[0].data.attack;
				s.armor=container.hero[0].data.armor;
				s.armorHealth=s.armor+s.health;
				s.deployedCount=container.deployed.length;
				s.handCount=container.hand.length;
				s.lose=container.hero[0].data.flags.lose?1:0;
				// Buffs/debuffs
				s.buffs=
					this.evaluateFlags(s,container.hero,FLAGS.buffs)+
					this.evaluateFlags(s,container.deployed,FLAGS.buffs);
				s.debuffs=
					this.evaluateFlags(s,container.hero,FLAGS.debuffs)+
					this.evaluateFlags(s,container.deployed,FLAGS.debuffs)+
					(
						table[0]=="my"?
						this.evaluateFlags(s,container.hero,FLAGS.temporaryDebuffs)+
						this.evaluateFlags(s,container.deployed,FLAGS.temporaryDebuffs)
						:0
					);
				// Deployed units + hero stats
				s.deployedHealth=0;
				s.deployedActive=0;
				s.deployedAttack=0;
				container.deployed.forEach(card=>{
					if (Logic.canTriggerEvent(time[1],"onPlay",table[1],"deployed",card.uuid))
						s.deployedActive++;
					s.deployedHealth+=card.data.health;
					s.deployedAttack+=card.data.attack;
				})
				// Equipment
				s.equipment={};
				container.equipment.forEach(card=>{
					if (card.data.equipmentSlot) s.equipment[card.data.equipmentSlot]=card.uuid;
				});
				// Prepare cost of remaining cards in hand
				s._handCardsIndex={};
				s.handCardsCost=0;
				s.handCardChanges=0;
				s.playableCards=0;
				container.hand.forEach(card=>{
					if (card.data.cost<container.mana) s.playableCards++;
					s._handCardsIndex[card.uuid]={cost:card.data.cost||0};
					handIndex[card.uuid]=1;
				});
				// Calculate table effects count
				s.effectsCount=0;
				for (var k in container.effects) s.effectsCount++;
				// Menace level stats
				var attackableUnits={};
				var othercontainer=time[1].data[table[2]];
				s.menacedHero=0;
				s.menacedUnits=0;
				s.menaceLevelHero=0;
				s.menaceLevelUnits=0;
				s.menaceLevel=0;
				["hero","deployed"].forEach(set=>{
					othercontainer[set].forEach(card=>{
						if (card.data.onAction&&card.data.onAction.targets) {
								var targets=this.getTargets(time[1],table[2],set,card.uuid,card.data.onAction.targets);
								targets.forEach(target=>{
									if (target.containerid=="hero") s.menaceLevelHero+=1+card.data.attack;								
									else s.menaceLevelUnits+=1+card.data.attack;
									if (attackableUnits[target.uuid]) attackableUnits[target.uuid]++;
									else {
										attackableUnits[target.uuid]=1;
										if (target.containerid=="hero") s.menacedHero=1;
										else s.menacedUnits++;
									}
								})
							}
					})
				});
				s.menaceLevel=s.menaceLevelUnits+s.menaceLevelHero;
			});
			var done={};
			var handCost=0;
			for (var k in handIndex) {
				if (
					stats[table[0]].old._handCardsIndex[k]&&
					stats[table[0]].new._handCardsIndex[k]
				) {
					stats[table[0]].old.handCardsCost+=stats[table[0]].old._handCardsIndex[k].cost;
					stats[table[0]].new.handCardsCost+=stats[table[0]].new._handCardsIndex[k].cost;
				} else stats[table[0]].new.handCardChanges++;
			}
			delete stats[table[0]].old._handCardsIndex;
			delete stats[table[0]].new._handCardsIndex;
		});

		for (var s in stats)
			for (var k in stats.my.old)
				if (!isNaN(stats.my.old[k])) {
					stats[s].delta[k]=stats[s].new[k]-stats[s].old[k];
					stats[s].absdelta[k]=Math.abs(stats[s].delta[k]);
				}

		var priorityScore=100;
		var finalScore=0;
		var priorityHits=[];
		var hasRelevant=false;
		var winning=false;
		var losing=false;

		aiModel.priorities.forEach(priority=>{
			var met=0,subrank=0,relevant=true;
			switch (priority.type) {
				// Basic needs
				case "killOpponent":{
					if (
						stats.opponent.new.lose
					) {
						winning=true;
						met=1;
					}
					break;
				}
				case "dontLose":{
					if (
						stats.my.new.lose
					) {
						losing=true;
					}
					break;
				}				

				// Menace levels
				case "increaseOpponentMenaceLevelHero":{
					if (
						(stats.opponent.delta.menaceLevelHero>0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.menaceLevelHero;
					}
					break;
				}
				case "increaseOpponentMenacedHero":{
					if (
						(stats.opponent.delta.menacedHero>0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.menacedHero;
					}
					break;
				}
				case "increaseOpponentMenaceLevelUnits":{
					if (
						(stats.opponent.delta.menaceLevelUnits>0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.menaceLevelUnits;
					}
					break;
				}
				case "increaseOpponentMenacedUnits":{
					if (
						(stats.opponent.delta.menacedUnits>0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.menacedUnits;
					}
					break;
				}
				case "decreaseMenaceLevelHero":{
					if (
						(stats.my.delta.menaceLevelHero<0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.my.absdelta.menaceLevelHero;
					}
					break;
				}
				case "decreaseMenacedHero":{
					if (
						(stats.my.delta.menacedHero<0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.my.absdelta.menacedHero;
					}
					break;
				}
				case "decreaseMenaceLevelUnits":{
					if (
						(stats.my.delta.menaceLevelUnits<0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.my.absdelta.menaceLevelUnits;
					}
					break;
				}
				case "decreaseMenacedUnits":{
					if (
						(stats.my.delta.menacedUnit<0)&&
						(stats.my.delta.menaceLevel<=0)&&(stats.opponent.delta.menaceLevel>=0)
					) {
						met=1;
						subrank=stats.my.absdelta.menacedUnits;
					}
					break;
				}

				// Effects management
				case "increaseEffects":{
					if (
						stats.my.delta.effectsCount>0
					) {
						met=1;
						subrank=stats.my.absdelta.effectsCount;
					}
					break;
				}
				case "decreaseOpponentEffects":{
					if (
						stats.opponent.delta.effectsCount<0
					) {
						met=1;
						subrank=stats.opponent.absdelta.effectsCount;
					}
					break;
				}

				// Hand cost management
				case "increaseOpponentHandCardsCost":{
					if (
						stats.opponent.delta.handCardsCost>0
					) {
						met=1;
						subrank=stats.opponent.absdelta.handCardsCost;
					}
					break;
				}
				case "decreaseHandCardsCost":{
					if (
						stats.my.delta.handCardsCost<0
					) {
						met=1;
						subrank=stats.my.absdelta.handCardsCost;
					}
					break;
				}

				// Hand Management
				case "changeCardVariety":{
					if (
						(stats.my.delta.handCardChanges>0)&&
						(stats.my.delta.handCount==0)
					) {
						met=1;
						subrank=stats.my.absdelta.handCardChanges;
					}
					break;
				}
				case "fillHand":{
					if (
						(stats.my.old.handCount<priority.target)&&
						(stats.my.delta.handCount>0)
					) {
						met=1;
						subrank=stats.my.absdelta.handCount;
					}
					break;
				}

				// General (Hero)
				case "increasePlayableCards":{
					if (
						stats.my.delta.playableCards>0
					) {
						met=1;
						subrank=stats.my.absdelta.playableCards;
					}
					break;
				}
				case "gainHealth":{
					if (
						stats.my.delta.health>0
					) {
						met=1;
						subrank=stats.my.absdelta.health;
					}
					break;
				}
				case "increaseAttack":{
					if (
						stats.my.delta.attack>0
					) {
						met=1;
						subrank=stats.my.absdelta.attack;
					}
					break;
				}
				case "increaseArmor":{
					if (
						stats.my.delta.armor>0
					) {
						met=1;
						subrank=stats.my.absdelta.armor;
					}
					break;
				}

				// General (units)				
				case "increaseActiveUnits":{
					if (
						stats.my.delta.deployedActive>0
					) {
						met=1;
						subrank=stats.my.absdelta.deployedActive;
					}
					break;
				}
				case "deployUnits":{
					if (
						(stats.my.old.deployedCount<priority.target)&&
						(stats.my.delta.deployedCount>0)
					) {
						met=1;
						subrank=stats.my.absdelta.deployedCount;
					}
					break;
				}

				// Debuff/Direct attack cards (change health, attack, buffs, debuffs without adding units)
				case "increaseOpponentDebuffs":{
					if (
						(stats.opponent.delta.debuffs>0)&&
						(stats.opponent.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.debuffs;
					}
					break;
				}
				case "decreaseDebuffs":{
					if (
						(stats.my.delta.debuffs<0)&&
						(stats.my.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.my.absdelta.debuffs;
					}
					break;
				}
				case "increaseBuffs":{
					if (
						(stats.my.delta.buffs>0)&&
						(stats.my.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.my.absdelta.buffs;
					}
					break;
				}
				case "decreaseOpponentBuffs":{
					if (
						(stats.opponent.delta.buffs<0)&&
						(stats.opponent.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.buffs;
					}
					break;
				}
				case "increaseUnitsHealth":{
					if (
						(stats.my.delta.deployedHealth>0)&&
						(stats.my.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.my.absdelta.deployedHealth;
					}
					break;
				}
				case "decreaseOpponentUnitsHealth":{
					if (
						(stats.opponent.delta.deployedHealth<0)&&
						(stats.opponent.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.deployedHealth;
					}
					break;
				}
				case "increaseUnitsAttack":{
					if (
						(stats.my.delta.deployedAttack>0)&&
						(stats.my.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.my.absdelta.deployedAttack;
					}
					break;
				}
				case "decreaseOpponentUnitsAttack":{
					if (
						(stats.opponent.delta.deployedAttack<0)&&
						(stats.opponent.delta.deployedCount==0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.deployedAttack;
					}
					break;
				}

				// General (aggressivity)
				case "damageOpponent":{
					if (
						stats.opponent.delta.armorHealth<0
					) {
						met=1;
						subrank=stats.opponent.absdelta.armorHealth;
					}
					break;
				}
				case "reduceOpponentUnits":{
					if (
						(stats.opponent.old.deployedCount>priority.target)&&
						(stats.opponent.delta.deployedCount<0)
					) {
						met=1;
						subrank=stats.opponent.absdelta.deployedAttack||stats.opponent.absdelta.deployedCount;
					}
					break;
				}
				case "damageOpponentUnits":{
					if (
						stats.opponent.delta.deployedHealth<0
					) {
						met=1;
						subrank=stats.opponent.absdelta.deployedHealth;
					}
					break;
				}

				// Not relevant actions - Are not enough to make a decision
				case "notIncreaseOpponentHand":{
					if (
						(stats.opponent.delta.handCount<=0)
					) {
						met=1;
						relevant=false;
						subrank=stats.opponent.absdelta.handCount;
					}
					break;
				}
				case "saveHealth":{
					if (
						stats.my.delta.health>=0
					) {
						met=1;
						relevant=false;
					}
					break;
				}
				case "saveUnits":{
					if (
						stats.my.delta.deployedCount>=0
					) {
						met=1;
						relevant=false;
					}
					break;
				}
				case "saveCards":{
					if (
						stats.my.delta.handCount>=0
					) {
						met=1;
						relevant=false;
					}
					break;
				}
				case "saveWeapons":{
					if (
						stats.my.old.equipment.weapon&&
						stats.my.new.equipment.weapon&&
						(stats.my.new.equipment.weapon!=stats.my.old.equipment.weapon)
					) {
						losing=true;
					}
					break;
				}
				case "keepHandCards":{
					if (
						stats.my.new.handCount>=priority.target
					) {
						met=1;
						relevant=false;
					}
					break;
				}
			}			
			if (met) {
				hasRelevant=hasRelevant||relevant;
				if (DICTIONARY._.DEBUGMODE&&relevant) priorityHits.push(priority.type);
			}
			finalScore+=(priorityScore*met)+(subrank?1-(1/subrank):0);
			priorityScore*=aiModel.priorityDecreaseRatio;
		});

		if (losing) winning=false;
		if (losing||!hasRelevant) finalScore=-10000;

		return {
			priorityHits:priorityHits,
			winning:winning,
			score:finalScore,
			stats:stats
		};
	}

}

function Table(data,player,opponent,playerFirst,aiModel1,aiModel2) {

	function newSide(table,aiModel,isTop,data) {
		var ret={
			isPlayer:aiModel?false:true,
			hideCards:aiModel?true:false,
			aiModel:aiModel,
			isTop:isTop,
			effects:{},
			hero:[
				Tools.createCard(table,data.decks[0].hero)
			],
			hand:[],
			equipment:[],
			deck:[],
			deployed:[],
			discard:[],
			wasted:[],
			maxMana:0,
			mana:0
		}
		for (var k in data.decks[0].cards)
			for (var i=0;i<data.decks[0].cards[k];i++)
				ret.deck.push(Tools.createCard(table,k));
		Tools.shuffle(Math,ret.deck);
		return ret;
	}

	var ret={
		generateUUID:function(){
			this.data.lastUUID++;
			return this.data.lastUUID;
		},
		random:function() {
			this.data.randomSeed = (this.data.randomSeed * 9301 + 49297) % 233280;
			return this.data.randomSeed / 233280;
		},
		clone:function() {
			return new Table(Tools.clone(this.data));
		},
		flushAnimations:function() {
			this.data.animations=[];
		},
		addAnimation:function(animation) {
			this.data.animations.push(Tools.clone(animation));
		},
		pass:function() {
			this.flushAnimations();
			this.data.turn++;
			this.data.my.wasted.forEach(card=>this.data.my.discard.push(card));
			this.data.my.wasted=[];			
			var swap=this.data.my;
			this.data.my=this.data.opponent;
			this.data.opponent=swap;
		}
	}

	if (data) ret.data=data;
	else {
		ret.data={
			randomSeed:Date.now(),
			lastUUID:0,			
			turn:0,
			animations:[],
		};
		var opponent=ret.data.top=newSide(ret,aiModel1||false,"top",opponent);
		var player=ret.data.bottom=newSide(ret,aiModel2||false,"bottom",player);
		if (playerFirst) {
			ret.data.my=player;
			ret.data.opponent=opponent;
		} else {
			ret.data.my=opponent;
			ret.data.opponent=player;
		}
	}

	return ret;
}

function Match() {
	var win,ret,backObject,AILabMode;
	var NEXT=-1;

	/* Chain manager */

	var CHAINTIMEOUT,CHAIN=[];
	var SPEED={
		slow:1000,
		fast:100
	};
	var IDS={
		top:{hero:"#tophero",hand:"#tophand",deployed:"#topdeployed",mana:"#topmana",equipment:"#topequipment",table:"#toptable",pass:"#toppass",cardsLeft:"#topcards"},
		bottom:{hero:"#bottomhero",hand:"#bottomhand",deployed:"#bottomdeployed",mana:"#bottommana",equipment:"#bottomequipment",table:"#bottomtable",pass:"#bottompass",cardsLeft:"#bottomcards"}
	};

	// Create table basic notes
	function initializeScreen(topHeroCard,bottomHeroCard) {
		var battle=$("div",{id:"battle"},$("#screen",{innerHTML:""}));

		// Thinking indicator
		$("div",{id:"thinking"},battle);

		// Full screen messages
		var fullscreenmessage=$("div",{className:"fullScreenMessage",id:"fullscreenmessage"},battle);
		$("div",{className:"image",id:"fullscreenmessageimage"},fullscreenmessage);

		// Fight presentation
		var presentleft=$("div",{className:"present left leave",id:"presentleft"},battle);
		$(Tools.renderCard(bottomHeroCard),0,presentleft);
		var presentRight=$("div",{className:"present right leave",id:"presentright"},battle);
		$(Tools.renderCard(topHeroCard),0,presentRight);
		$("div",{className:"versus leave",id:"versus"},battle);

		// Drag/drop arrow
		$("div",{className:"arrow",id:"arrow"},battle);

		// Hero card docks

		var hero=$("div",{className:"guis hero bottom interface leave"},battle);
		$("div",{className:"framecorner topleft"},hero);
		$("div",{className:"framecorner topright"},hero);
		$("div",{id:"bottomhero"},hero);

		var hero=$("div",{className:"guis hero top interface leave"},battle);
		$("div",{className:"framecorner bottomleft"},hero);
		$("div",{className:"framecorner bottomright"},hero);
		$("div",{id:"tophero"},hero);

		// Exit button
		$("div",{className:"buttons exit dock top right interface leave",id:"exit",innerHTML:Tools.translate("quitMatch")},battle);

		// Card docks

		var dock=$("div",{className:"guis dock bottom right interface leave"},battle);
		$("div",{className:"fan left",id:"bottomhand"},dock);

		var dock=$("div",{className:"guis dock top right interface leave"},battle);
		$("div",{className:"fan left",id:"tophand"},dock);

		var dock=$("div",{className:"guis dock bottom left interface leave"},battle);
		$("div",{className:"fan right",id:"bottomequipment"},dock);

		var dock=$("div",{className:"guis dock top left interface leave"},battle);
		$("div",{className:"fan right",id:"topequipment"},dock);

		// Table

		var tableperspective=$("div",{
			className:Storage.data.settings.table3d?"tableperspective":""
		},battle);
		var table=$("div",{className:"table interface leave"},tableperspective);

		var side=$("div",{className:"deployed top",id:"toptable"},table);
		$("div",{className:"row",id:"topdeployed"},side);
		
		var side=$("div",{className:"deployed bottom",id:"bottomtable"},table);
		$("div",{className:"row",id:"bottomdeployed"},side);

		// Arena background
		$("div",{className:"background1 leave",id:"background1"},table);
		$("div",{className:"background2 interface leave",id:"topside",css:{backgroundColor:topHeroCard.data.sideColor}},table);
		$("div",{className:"background2 interface leave",id:"bottomside",css:{backgroundColor:bottomHeroCard.data.sideColor}},table);

		// Mana counters & pass buttons
		
		$("div",{className:"buttons corner dock bottom left interface leave",id:"bottommana"},battle);
		$("div",{className:"buttons corner dock top left interface leave",id:"topmana"},battle);
		$("div",{className:"buttons cards dock bottom left interface leave",id:"bottomcards"},battle);
		$("div",{className:"buttons cards dock top left interface leave",id:"topcards"},battle);
		$("div",{className:"buttons pass dock bottom left interface leave",id:"bottompass",innerHTML:Tools.translate("passTurn")},battle);
		$("div",{className:"buttons pass dock top left interface leave",id:"toppass",innerHTML:Tools.translate("passTurn")},battle);


		return battle;
	}

	// Chain management

	var wait;

	function trimWait(time) {
		if (Storage.data.settings.fastAnimations)
			return Math.min(time,100);
		else
			return time;
	}

	function trimAudio(audio) {
		Audio.play(audio);
	}

	function setChainWait(time) {
		wait=time;
	}

	function stopChainTimer() {
		clearTimeout(CHAINTIMEOUT);
		CHAINTIMEOUT=0;
	}

	function abortChain() {
		CHAIN=[];
		stopChainTimer();
		return NEXT;
	}

	function addChain(after,fn,args,sentence,wait){

		var itm=[fn,args,sentence,wait];
		if (after==NEXT) {
			CHAIN.push(itm);
			after=CHAIN.length;
		} else {
			CHAIN.splice(after,0,itm);
			after++;
		}
		if (CHAIN.length==1) {
			stopChainTimer();
			CHAINTIMEOUT=setTimeout(flushChain,1);
		}
		return after;
	}

	function flushChain() {
		var doit=CHAIN[0];
		if (doit[2]) console.info(Tools.sentence(doit[2]));
		var args=[0];
		if (doit[1]) doit[1].forEach(item=>args.push(item));
		setChainWait(doit[3]||0);
		CHAIN.splice(0,1);
		doit[0].apply(ret,args);
		if (CHAIN.length)
			if (wait) {
				stopChainTimer();
				CHAINTIMEOUT=setTimeout(flushChain,wait);
			}
			else flushChain();
		else stopChainTimer();
	}

	ret={
		
		table:0,
		action:{},

		resetPlayable:function(nodes) {
			// Reset card selector
			this.action.resetNodes.forEach(node=>{
				Tools.setNodeFlag(node,"playable",false);
				delete node._playerSelect;
				node.onmousedown=0;
			})
			this.action.resetNodes=[];
		},

		show:function(back,player,opponent,playerFirst,aiModel) {
			Audio.stopMusic();
			var self=this;
			ShowCard.disable();
			backObject=back;
			this.table=new Table(0,player,opponent,playerFirst,aiModel);
			win=initializeScreen(this.table.data.top.hero[0],this.table.data.bottom.hero[0]);
			Tools.defer(function(){
				self.presentMatch(NEXT,player,opponent);
			});
		},

		/* AI Lab */
		aiLab:function(deck1,model1,deck2,model2) {
			AILabMode=true;
			var winStatus=0;
			this.table=new Table(0,deck1,deck2,true,model1,model2);
			// Game start
			Logic.broadcastEvent(this.table,"onGameStart","my");
			Logic.broadcastEvent(this.table,"onGameStart","opponent");
			this.table.flushAnimations();
			var ret={turn:0};
			while (!winStatus) {
				// Turn Start
				Logic.broadcastEvent(this.table,"onOpponentTurnStart","opponent");
				Logic.broadcastEvent(this.table,"onTurnStart","my");
				this.table.flushAnimations();
				console.log("["+this.table.data.top.deck.length+"] H:"+this.table.data.top.hand.length+" ("+this.table.data.top.hero[0].data.health+") D:"+this.table.data.top.deployed.length+" vs. "+this.table.data.bottom.deployed.length+":D ("+this.table.data.bottom.hero[0].data.health+") "+this.table.data.bottom.hand.length+":H ["+this.table.data.bottom.deck.length+"]");
				ret.turn++;
				// AI Decides...
				this.aiLabCache=[];
				this.ai(0);
				// AI Plays...
				this.aiLabCache.forEach(action=>{
					if (!winStatus) {
						if (action.target)
							action.target.card=Tools.getCard(this.table.data[action.target.side][action.target.containerid],action.target.uuid);
						this.table.flushAnimations();
						Logic.triggerEvent(this.table,action.event,"my",action.containerid,action.uuid,action.target);
						winStatus=this.checkEndGame(0,false);
					}
				});
				// Turn ends...
				if (!winStatus) {
					Logic.broadcastEvent(this.table,"onTurnEnd","my");
					Logic.broadcastEvent(this.table,"onOpponentTurnEnd","opponent");
					winStatus=this.checkEndGame(0,true);
					if (!winStatus) this.table.pass();
				}
			}
			if (this.table.data.my.isTop=="top") ret.winner=1;
			else ret.winner=2;
			return ret;
		},

		/* Chainables */

		noop:function(after) { return after; },

		presentMatch:function(after,player,opponent) {
			Audio.play("swing");
			Tools.setNodeFlag($("#background1"),"leave",false);
			after=addChain(after,this.presentMatch2,0,0,5000);
			return after;
		},

		presentMatch2:function(after,player,opponent) {
			Audio.play("hit");
			Tools.setNodeFlag($("#presentleft"),"leave",false);
			Tools.setNodeFlag($("#presentright"),"leave",false);
			Tools.setNodeFlag($("#versus"),"leave",false);
			after=addChain(after,this.postPresentMatch,0,0,1000);
			return after;
		},

		postPresentMatch:function(after,player,opponent) {
			Audio.playMusic("music-battle");
			Audio.play("swing");
			Tools.setNodeFlag($("#presentleft"),"leave",true);
			Tools.setNodeFlag($("#presentright"),"leave",true);
			Tools.setNodeFlag($("#versus"),"leave",true);
			var left=document.getElementsByClassName("interface");
			for (var i=0;i<left.length;i++)
				Tools.setNodeFlag(left[i],"leave",false);
			after=addChain(after,this.newGame,0,0,1100);
			return after;
		},

		newGame:function(after) {
			Tools.removeNode($("#presentleft"));
			Tools.removeNode($("#presentright"));
			Tools.removeNode($("#versus"));
			this.table.flushAnimations();
			["my","opponent"].forEach(side=>{
				var data=this.table.data[side];
				var cfg=IDS[data.isTop];
				$(cfg.mana,{innerHTML:data.mana+"/"+data.maxMana});
				$(cfg.cardsLeft,{innerHTML:data.deck.length});
				this.table.addAnimation({action:"enterHero",isTop:data.isTop,card:data.hero[0]});	
			});

			Logic.broadcastEvent(this.table,"onGameStart","my");
			Logic.broadcastEvent(this.table,"onGameStart","opponent");
			after=addChain(after,this.animateTable);
			after=addChain(after,this.turnStart,0,[[
				this.table.data.my.isPlayer?"player":"cpu",
				"gameStart"
			]]);
			return after;
		},

		fullScreenMessageClose:function(after) {
			Tools.setNodeFlag($("#fullscreenmessage"),"leave",true);
			return after;
		},

		fullScreenMessage:function(after,className,message,sound,keep) {

			trimAudio(sound);
			$("#fullscreenmessage",{className:"enable "+className});
			$("#fullscreenmessageimage",{innerHTML:Tools.translate(message)});
			Tools.defer(function(){
				Tools.setNodeFlag($("#fullscreenmessage"),"show",true);
			});
			after=addChain(after,this.noop,0,0,1000);

			// Full screen message leave animation
			if (!keep)
				after=addChain(after,this.fullScreenMessageClose,0,0,1000);

			return after;
		},

		performAction:function(after,action) {
			ShowCard.disable();
			if (action.target) {
				// Remap target to real table
				action.target.card=Tools.getCard(this.table.data[action.target.side][action.target.containerid],action.target.uuid);
			}
			this.table.flushAnimations();
			this.table.addAnimation({action:action.event,uuid:action.uuid,_action:action});
			Logic.triggerEvent(this.table,action.event,"my",action.containerid,action.uuid,action.target);
			this.table.addAnimation({action:"end"+action.event,uuid:action.uuid});
			after=addChain(after,this.animateTable);
			after=addChain(after,this.checkEndGame,[false]);
			return after;
		},

		disposeNode:function(after,node) {
			Tools.removeNode(node);
			return after;
		},
		hideNode:function(after,node) {
			node.style.display="none";
			return after;
		},
		wasteNode:function(after,node) {
			Tools.setNodeFlag(node,"wasted",true);
			after=addChain(after,this.noop,0,0,1000);
			after=addChain(after,this.disposeNode,[node]);
			return after;
		},
		setNodeClassName:function(after,node,className) {
			node.className=className;
			return after;
		},

		animateTable:function(after,action) {
			if (this.table.data.animations.length) {
				var anim=this.table.data.animations.splice(0,1)[0];
				var wait=trimWait(500);
				var cfg=IDS[anim.isTop];
				var card;
				if (anim.uuid) card=$("#"+anim.uuid);

				switch (anim.action) {
					/* New card animations */
					case "drawCard":{
						wait=trimWait(300);
						var node=Tools.renderCard(anim.card,{hide:anim.hideCard});
						Tools.setNodeFlag(node,"drawing",true);
						$(node,0,cfg.hand);
						Tools.defer(function(){
							trimAudio("flick");
							Tools.setNodeFlag(node,"drawing",false);
						});
						after=addChain(after,this.noop,0,0,wait);
						wait=0;					
						break;
					}
					case "enterHero":{
						wait=trimWait(1000);
						var node=Tools.renderCard(anim.card);
						Tools.setNodeFlag(node,"entering",true);
						$(node,0,cfg.hero);
						Tools.defer(function(){
							trimAudio("flick");
							Tools.setNodeFlag(node,"entering",false);
						});
						after=addChain(after,this.noop,0,0,wait);
						wait=0;
						break;
					}
					case "wasteCard":{
						trimAudio("flick");
						wait=trimWait(500);
						var node=Tools.renderCard(anim.card);
						$(node,0,cfg.hand);
						Tools.defer(function(){
							trimAudio("swing");
							Tools.setNodeFlag(node,"wasting",true);
						});
						after=addChain(after,this.wasteNode,[node],0,wait);
						break;
					}
					/* Move card animation */
					case "deployNew":{
						wait=trimWait(300);
						var node=Tools.renderCard(anim.newCard);
						$(node,0,cfg.deployed);
						Tools.defer(function(){
							trimAudio("swing");
							Tools.setNodeFlag(node,"deploying",false);
						});
						break;
					}
					case "deployed":{
						wait=trimWait(300);
						var node=Tools.renderCard(card._card);
						node.className=card.className;
						card.id+="-deploying";
						Tools.setNodeFlag(card,"deployed",true);
						Tools.setNodeFlag(node,"deploying",true);
						$(node,0,cfg.deployed);
						Tools.defer(function(){
							trimAudio("deploy");
							Tools.setNodeFlag(node,"deploying",false);
						});
						after=addChain(after,this.noop,0,0,wait);
						after=addChain(after,this.disposeNode,[card]);
						break;
					}
					case "equip":{
						trimAudio("swing");
						wait=trimWait(500);
						var node=Tools.renderCard(card._card);
						// Discard...
						card.id+="-leaving";
						Tools.setNodeFlag(card,"discard",true);
						after=addChain(after,this.noop,0,0,wait);
						after=addChain(after,this.disposeNode,[card]);
						// ...and recreate
						Tools.setNodeFlag(node,"drawing",true);
						$(node,0,cfg.equipment);
						Tools.defer(function(){
							trimAudio("equip");
							Tools.setNodeFlag(node,"drawing",false);
						});
						break;
					}
					/* Remove card animation */
					case "preDiscard":{
						trimAudio("swing");
						wait=trimWait(100);
						Tools.setNodeFlag(card,"discard",true);
						after=addChain(after,this.noop,0,0,wait);
						after=addChain(after,this.hideNode,[card]);
						wait=0;
						break;
					}
					case "postDiscard":{
						wait=0;
						after=addChain(after,this.disposeNode,[card]);
						break;
					}
					case "discard":{
						trimAudio("flick");
						wait=trimWait(100);
						Tools.setNodeFlag(card,"discard",true);
						after=addChain(after,this.noop,0,0,wait);
						after=addChain(after,this.disposeNode,[card]);
						wait=0;
						break;
					}
					/* Card update animations */
					case "onPlay":{
						trimAudio("swing");
						wait=trimWait(500);
						Tools.setNodeFlag(card,"back",false);
						Tools.setNodeFlag(card,"play",true);
						break;
					}
					case "onAction":{
						trimAudio("swing");
						wait=trimWait(500);
						Tools.setNodeFlag(card,"action",true);
						break;
					}
					case "updateMaxMana":
					case "updateMana":{
						if (anim.action=="updateMaxMana") trimAudio("updatemaxmana");
						else trimAudio("updatemana");
						$(cfg.mana,{innerHTML:anim.mana+"/"+anim.maxMana});
						break;
					}
					case "updateCardsLeft":{
						wait=0;
						$(cfg.cardsLeft,{innerHTML:anim.cardsLeft});
						break;
					}
					/* Card attributes changes. Card maybe out of game, so they check if card still is on screen */
					case "endonPlay":{
						if (card) Tools.setNodeFlag(card,"play",false);
						break;
					}
					case "endonAction":{
						if (card) Tools.setNodeFlag(card,"action",false);
						break;
					}
					case "updateCardData":{
						if (card) {
							var icon=card._nodes[anim.attribute];
							icon.innerHTML=anim.to;
							if (Tools.nodeIsBack(card)) wait=0;
							else {
								if (anim.to>anim.from) {
									switch (anim.attribute) {
										case "attack":{
											trimAudio("sword");
											break;
										}
										case "health":{
											trimAudio("bottle");
											break;
										}
										default:{
											trimAudio("metal");
											break;
										}
									}
								} else {
									switch (anim.attribute) {
										case "attack":{
											trimAudio("sworddown");
											break;
										}
										case "health":{
											trimAudio("hit");
											break;
										}
										default:{
											trimAudio("metal");
											break;
										}
									}
								}
								wait=trimWait(500);
								var className=card._nodes[anim.attribute]._className;
								if ((anim.max!==undefined)&&(anim.to>=anim.max)) className+=" max";
								icon.className=className+" changed";
								after=addChain(after,this.setNodeClassName,[icon,className]);
							}
						} else wait=0;
						break;
					}
					case "updateCardFlag":{
						if (card) {
							if (!anim.from!=!anim.to)
								if (anim.to)
									if (FLAGS.list[anim.flag]&&FLAGS.list[anim.flag].audioOn) 
										trimAudio(FLAGS.list[anim.flag].audioOn);
									else trimAudio("flagon");
								else
									if (FLAGS.list[anim.flag]&&FLAGS.list[anim.flag].audioOff)
										trimAudio(FLAGS.list[anim.flag].audioOff);
									else
										trimAudio("flagoff");
							Tools.setNodeFlag(card,anim.flag,anim.to);
							Tools.setNodeFlag(card,"NO"+anim.flag,!anim.to);							
							if (Tools.nodeIsBack(card)) wait=0;
							else wait=trimWait(50);
						} else wait=0;
						break;
					}
					default:{
						console.warn("unsupported action:",anim.action,anim);						
					}
				}
				setChainWait(wait);
				after=addChain(after,this.animateTable);
			} else this.table.flushAnimations();
			return after;
		},

		closeGame:function(after,victory) {
			if (victory) result=backObject.onWin;
			else result=backObject.onLose;
			Tools.windowChange(win,window[result.manager],[0,result]);
			return after;
		},

		abortGame:function(after,victory) {
			Tools.windowChange(win,mainMenu,[0]);
			return after;
		},

		endGame:function(after) {
			Audio.stopMusic();
			this.fullScreenMessageClose(0);
			var left=document.getElementsByClassName("interface");
			for (var i=0;i<left.length;i++)
				Tools.setNodeFlag(left[i],"leave",true);
			Tools.setNodeFlag($("#background1"),"leave",true);
			return after;
		},

		checkEndGame:function(after,turnend) {
			var end;
			var playerSide,opponentSide;
			if (this.table.data.my.isPlayer) {
				playerSide=this.table.data.my;
				opponentSide=this.table.data.opponent;
			} else {
				opponentSide=this.table.data.my;
				playerSide=this.table.data.opponent;
			}
			if (playerSide.hero[0].data.flags.lose) end="lose";
			else if (opponentSide.hero[0].data.flags.lose) end="win";
			else if (turnend&&(playerSide.deck.length==0)&&(opponentSide.deck.length==0)) {
				if (playerSide.hero[0].data.health>opponentSide.hero[0].data.health) end="win";
				else end="lose";
			}
			if (AILabMode) return end;
			else {
				switch (end) {
					case "win":{
						Audio.stopMusic();
						after=abortChain();
						after=addChain(after,this.fullScreenMessage,["victory","victory","victory",true],0,3000);
						after=addChain(after,this.endGame,0,0,1300);
						after=addChain(after,this.closeGame,[true]);
						break;
					}
					case "lose":{
						Audio.stopMusic();
						after=abortChain();
						after=addChain(after,this.fullScreenMessage,["defeat","defeat","defeat",true],0,3000);
						after=addChain(after,this.endGame,0,0,1300);
						after=addChain(after,this.closeGame,[false]);
						break;
					}
				}
				return after;	
			}
		},

		turnStart:function(after) {
			if (this.table.data.my.isPlayer)
				after=addChain(after,this.fullScreenMessage,["playerturn","yourTurn","playerturn"]);
			else
				after=addChain(after,this.fullScreenMessage,["cputurn","opponentTurn","opponentturn"]);
			after=addChain(after,after=>{
				$("#fullscreenmessage",{className:""});
				Logic.broadcastEvent(this.table,"onOpponentTurnStart","opponent");
				Logic.broadcastEvent(this.table,"onTurnStart","my");
				after=addChain(after,this.animateTable);
				if (this.table.data.my.isPlayer) after=addChain(after,this.player);
				else after=addChain(after,this.ai);
				return after;
			},0,0,1000);
			return after;
		},

		afterPass:function(after) {
			this.table.pass();
			after=addChain(after,this.turnStart,0,[[
				this.table.data.my.isPlayer?"player":"cpu",
				"turnStart"
			]]);
			return after;
		},

		pass:function(after) {
			ShowCard.disable();
			Logic.broadcastEvent(this.table,"onTurnEnd","my");
			Logic.broadcastEvent(this.table,"onOpponentTurnEnd","opponent");
			after=addChain(after,this.animateTable);		
			after=addChain(after,this.checkEndGame,[true]);
			after=addChain(after,this.afterPass);
			return after;
		},

		playerEndTarget:function(after) {

			Tools.setNodeFlag(this.action.arrowNode,"show",false);

			// Reset target selector events
			$("#battle",{
				onmousemove:0,
				onmouseup:0
			});

			// Reset card selector
			this.action.resetNodes.forEach(node=>{
				Tools.setNodeFlag(node,"targetable",false);
				Tools.setNodeFlag(node,"targeting",false);
				delete node._playerSelect;
				node.onmousemove=0;
			});

			// Perform action

			if (this.action.target) {
				var action={
					event:this.action.fromCard.event,
					side:"my",
					containerid:this.action.fromCard.containerid,
					uuid:this.action.fromCard.uuid,
					card:this.action.fromCard.card
				}
				if (!this.action.target.table)
					action.target=this.action.target.target;
				var sentence=[
					"player",
					action.event,
					Tools.getCardLabel(action.card.data,"name")
				];
				if (action.target) {
					sentence.push("targeting");
					sentence.push(Tools.getCardLabel(action.target.card.data,"name"));
				}
				after=addChain(after,this.performAction,[action],[sentence]);
			}
			after=addChain(after,this.player);

			return after;
		},

		playerTarget:function(after) {
			var self=this;

			function cancelSelection() {
				if (self.action.target) {
					Tools.setNodeFlag(self.action.target.node,"targeting",false);
					delete self.action.target;
				}
			}

			function updateArrow(e) {
				var dx = e.clientX - self.dragStart.centerX, dy = e.clientY - self.dragStart.centerY;
                var dist = Math.hypot(dx, dy);
                var ang = Math.atan(dy / dx);
                if (dx < 0) ang += Math.PI;
				$(self.action.arrowNode,{
					css:{
						transform:"rotate(" + ang + "rad)",
						width:dist+"px"
					}
				});
			}

			// Disable pass
			Tools.setNodeFlag(this.action.passNode,"show",false);
			$(this.action.passNode,{onclick:0});
			Tools.setNodeFlag(this.action.exitNode,"show",false);
			$(this.action.exitNode,{onclick:0});

			// Reset card selector
			this.resetPlayable();

			// Prepare target selector events
			$("#battle",{
				onmousemove:function(e) {
					updateArrow(e);
					cancelSelection();
				},
				onmouseup:function(e) {					
					self.playerEndTarget(after);
				}
			});

			// Setup card target selector
			var targetingRule=this.action.fromCard.card.data[this.action.fromCard.event].targets;
			if (targetingRule) {
				var targets=Logic.getTargets(this.table,"my",this.action.fromCard.containerid,this.action.fromCard.uuid,targetingRule);
				targets.forEach(target=>{									
					var node=$("#"+target.uuid);
					this.action.resetNodes.push(node);
					Tools.setNodeFlag(node,"targetable",true);
					node._playerSelect={target:target,node:node};
					node.onmousemove=function(e) {
						cancelSelection();
						updateArrow(e);										
						self.action.target=this._playerSelect;
						Tools.setNodeFlag(self.action.target.node,"targeting",true);
						e.stopPropagation();
						return false;
					}
				})
			
			} else {

				var node=$(IDS[this.table.data.my.isTop].table);
				this.action.resetNodes.push(node);
				Tools.setNodeFlag(node,"targetable",true);
				node._playerSelect={table:true,node:node};
				node.onmousemove=function(e) {
					cancelSelection();
					updateArrow(e);				
					self.action.target=this._playerSelect;
					Tools.setNodeFlag(self.action.target.node,"targeting",true);
					e.stopPropagation();
					return false;
				}
			}
			return after;
		},

		playerPass:function(after) {
			// Reset card selector
			this.resetPlayable();

			// Disable pass
			Tools.setNodeFlag(this.action.passNode,"show",false);
			$(this.action.passNode,{onclick:0});
			Tools.setNodeFlag(this.action.exitNode,"show",false);
			$(this.action.exitNode,{onclick:0});

			after=addChain(after,this.pass,0,[[ "player", "pass" ]])
			return after;
		},

		player:function(after) {

			function enableSet(containerids,action) {
				containerids.forEach(containerid=>{
					self.table.data.my[containerid].forEach(card=>{
						var cardnode=$("#"+card.uuid);			
						if (Logic.canTriggerEvent(self.table,action,"my",containerid,card.uuid)) {
							var hasTargets=true;
							if (card.data[action].targets) {
								var targets=Logic.getTargets(self.table,"my",containerid,card.uuid,card.data[action].targets);
								hasTargets=targets.length;
							}
							if (hasTargets) {
								self.action.resetNodes.push(cardnode);
								Tools.setNodeFlag(cardnode,"playable",true);
								cardnode._playerSelect={event:action,containerid:containerid,card:card,uuid:card.uuid};
								cardnode.onmousedown=function() {
									self.action.fromCard=this._playerSelect;
									Tools.setNodeFlag(self.action.arrowNode,"show",true);
									self.dragStart=Tools.getNodePosition(this,self.action.arrowNode.parentNode);
									$(self.action.arrowNode,{
										css:{
											left:self.dragStart.centerX+"px",
											top:self.dragStart.centerY+"px",
											width:0
										}
									});
									self.playerTarget(after);
								}
							}
						}
					})
				});
			}

			var self=this;
			this.action={
				arrowNode:$("#arrow"),
				passNode:$(IDS[this.table.data.my.isTop].pass),
				exitNode:$("#exit"),
				resetNodes:[]
			};
			Tools.setNodeFlag(this.action.passNode,"show",true);
			Tools.setNodeFlag(this.action.exitNode,"show",true);
			Tools.setNodeFlag(this.action.arrowNode,"show",false);
			$(this.action.passNode,{
				onclick:function() {
					self.playerPass(after);
				}
			});
			$(this.action.exitNode,{
				onclick:function() {
					Tools.setNodeFlag(self.action.passNode,"show",false);
					Tools.setNodeFlag(self.action.exitNode,"show",false);
					Tools.setNodeFlag(self.action.arrowNode,"show",false);
					if (DICTIONARY._.DEBUGMODE) {
						after=addChain(after,self.endGame,0,0,1300);
						after=addChain(after,self.closeGame,[true]);
					} else {
						Audio.play("flagoff");
						after=addChain(after,self.endGame,0,0,1300);
						after=addChain(after,self.abortGame,0);	
					}
				}
			});
			enableSet(["hand"],"onPlay");
			enableSet(["deployed","hero"],"onAction");

			ShowCard.enable();
			
			return after;
		},

		ai:function(after,progress) {

			if (!progress) {
				$("#thinking",{className:"think"});
				progress={
					aiModel:this.table.data.my.aiModel,
					winning:false,
					head:0,
					finals:[],
					options:[{score:0,table:this.table,sequence:[]}]
				}
			}

			if (progress.options.length>progress.aiModel.hypothesisDepth) {
				Logic.sortByScore(progress.options);
				progress.options=progress.options.splice(0,progress.options.length);
			}
			
			var curProgress=progress.options[0];
			var keepThinking=false;
			if (curProgress) {

				var options=[];
				progress.options.splice(progress.head,1);

				var winning=false;

				if (!winning) winning=Logic.evaluateEvent(curProgress.table,"onPlay","my","hand",progress.aiModel,curProgress,options);
				if (!winning) winning=Logic.evaluateEvent(curProgress.table,"onAction","my","hero",progress.aiModel,curProgress,options);
				if (!winning) winning=Logic.evaluateEvent(curProgress.table,"onAction","my","deployed",progress.aiModel,curProgress,options);

				if (winning) {
					debugger;
					keepThinking=false;
					progress.finals=[winning];
				} else {
					keepThinking=true;
					if (options.length>progress.aiModel.subHypothesisDepth) {
						Logic.sortByScore(options);
						options=options.splice(0,progress.aiModel.subHypothesisDepth);
					}

					if (options.length) progress.options=progress.options.concat(options);
					else {
						progress.finals.push(curProgress);
						Logic.sortByScore(progress.finals);
						if (progress.finals.length>progress.aiModel.finalDecisionPool)
							progress.finals=progress.finals.splice(0,progress.aiModel.finalDecisionPool);
					}
				}
			}

			if (keepThinking) {

				if (AILabMode) this.ai(after,progress);
				else Tools.defer(function(){ret.ai(after,progress);},1);

			} else {

				$("#thinking",{className:""});
				
				if (progress.finals.length&&progress.finals[0].score>0) {

					var final=Tools.randomElement(Math,progress.finals);

					final.sequence.forEach(
						action=>{
							if (!AILabMode&&DICTIONARY._.DEBUGMODE) {
								console.log("-",action.stats.priorityHits);
								console.log("-",action.stats);
								console.log("!",action);
							}
							var sentence=[
								"cpu",
								action.event,
								Tools.getCardLabel(action.card.data,"name")
							];
							if (action.target) {
								sentence.push("targeting");
								sentence.push(Tools.getCardLabel(action.target.card.data,"name"));
							}
							if (AILabMode) this.aiLabCache.push(action);
							else after=addChain(after,ret.performAction,[action],[sentence]);
						}
					);

				}

				if (!AILabMode)  after=addChain(after,ret.pass,0,[[ "cpu", "pass" ]])

			}

		}
	}
	

	return ret;
}
