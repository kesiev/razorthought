var AIMODELS={
	root:{
		priorityDecreaseRatio:0.5,
		finalDecisionPool:5,
		priorities:[
			
			// Basic rules
			/* BASIC          */ {levels:["easy","normal","hard"], type:"dontLose"},
			/* BASIC          */ {levels:["easy","normal","hard"], type:"killOpponent"},

			// Conservative strategy - Do not waste resources
			/* BASIC   - CONS */ {levels:[       "normal","hard"], type:"saveHealth"},
			/* BASIC   - CONS */ {levels:["easy","normal","hard"], type:"saveUnits"},
			/* BASIC   - CONS */ {levels:["easy","normal","hard"], type:"saveCards"},
			/* BASIC   - CONS */ {levels:[       "normal","hard"], type:"saveWeapons"},

			// --- HERO ADVANTAGES ---

			// Hero powering up
			/* BASIC   - POWE */ {levels:["easy","normal","hard"], type:"increaseArmor"},
			/* BASIC   - POWE */ {levels:["easy","normal","hard"], type:"increaseAttack"},
			/* BASIC   - POWE */ {levels:["easy","normal","hard"], type:"decreaseHandCardsCost"},
			/* BASIC   - POWE */ {levels:["easy","normal","hard"], type:"increasePlayableCards"},

			// --- SURE PREPARATION ADVANTAGES/DISADVANTAGES ---

			// Increase field effects
			/* BASIC   - POWE */ {levels:["easy","normal","hard"], type:"increaseEffects"},

			// BALANCED Units attack modifiers
			/* OFFENSE - BUFF */ {levels:["easy","normal","hard"], type:"increaseUnitsAttack"},
			/* DEFENSE - BUFF */ {levels:["easy","normal","hard"], type:"decreaseOpponentUnitsAttack"},

			// BALANCED Units health modifiers
			/* OFFENSE - BUFF */ {levels:["easy","normal","hard"], type:"decreaseOpponentUnitsHealth"},
			/* DEFENSE - BUFF */ {levels:["easy","normal","hard"], type:"increaseUnitsHealth"},

			// BALANCED Buffs
			/* OFFENSE - BUFF */ {levels:[       "normal","hard"], type:"decreaseOpponentBuffs"},
			/* DEFENSE - BUFF */ {levels:["easy","normal","hard"], type:"increaseBuffs"},

			// BALANCED Debuffs
			/* OFFENSE - DBUF */ {levels:["easy","normal","hard"], type:"increaseOpponentDebuffs"},
			/* DEFENSE - DBUF */ {levels:[       "normal","hard"], type:"decreaseDebuffs"},

			// --- SURE MAIN ADVANTAGES/DISADVANTAGES ---

			// BALANCED hero menace/defense
			/* OFFENSE - HERO */ {levels:[       "normal","hard"], type:"increaseOpponentMenacedHero"},
			/* DEFENSE - HERO */ {levels:[       "normal","hard"], type:"decreaseMenacedHero"},

			// BALANCED units menace/defense
			/* OFFENSE - UNIT */ {levels:[       "normal","hard"], type:"increaseOpponentMenacedUnits"},
			/* DEFENSE - UNIT */ {levels:[       "normal","hard"], type:"decreaseMenacedUnits"},

			// --- HARD DISADVANTAGES ---

			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"damageOpponent"},

			// --- SOFT DISADVANTAGES ---

			/* BASIC   - DEFE */ {levels:[       "normal","hard"], type:"notIncreaseOpponentHand"},
			/* BASIC   - LIMT */ {levels:[       "normal","hard"], type:"decreaseOpponentEffects"},
			/* BASIC   - LIMT */ {levels:[       "normal","hard"], type:"increaseOpponentHandCardsCost"},

			// --- [ BREAK POINT ] KEEP CARDS FOR FUTURE OPTIONS ---
			/* BASIC   - CARDS */ {levels:["easy","normal","hard"], type:"keepHandCards",target:2},

			// --- SOFT STRATEGY ---

			// Soft aggressive
			/* OFFENSE - HERO */ {levels:[       "normal","hard"], type:"increaseOpponentMenaceLevelHero"},
			/* OFFENSE - UNIT */ {levels:[       "normal","hard"], type:"increaseOpponentMenaceLevelUnits"},

			// Soft defensive
			/* DEFENSE - HERO */ {levels:[       "normal","hard"], type:"decreaseMenaceLevelHero"},
			/* DEFENSE - UNIT */ {levels:[       "normal","hard"], type:"decreaseMenaceLevelUnits"},

			// --- FALLBACKS ---

			/* Basic fallbacks */
			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"gainHealth"},
			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"increaseActiveUnits"},
			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"deployUnits",target:4},
			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"reduceOpponentUnits",target:1},
			/* BASIC   - ATTK */ {levels:["easy","normal","hard"], type:"damageOpponentUnits"},

			// --- INVESTMENTS FOR FUTURE TURNS/HANDS ---

			/* BASIC   - HAND */ {levels:["easy","normal","hard"], type:"changeCardVariety"},
			/* BASIC   - HAND */ {levels:["easy","normal","hard"], type:"fillHand",target:5}
		]
	},
	easy:{
		hypothesisDepth:1,
		subHypothesisDepth:1,
		rootModel:"root",
		rootModelLevel:"easy"
	},
	normal:{
		hypothesisDepth:2,
		subHypothesisDepth:2,
		rootModel:"root",
		rootModelLevel:"normal"
	},
	hard:{
		hypothesisDepth:5,
		subHypothesisDepth:5,
		rootModel:"root",
		rootModelLevel:"hard"
	}
}