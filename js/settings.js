
function Settings() {
	var self=this;
	var backObject,win,optionsPanel,backButton,titleBox;
	var enabled=false;

	var settings=[
		{id:"fastAnimations",values:[
			{id:0,label:"settingDisabled"},
			{id:1,label:"settingEnabled"},
		]},
		{id:"table3d",values:[
			{id:0,label:"settingDisabled"},
			{id:1,label:"settingEnabled"},
		]},
		{id:"fullScreen",internal:"fullScreen",dontSave:true,values:[
			{id:0,label:"settingDisabled"},
			{id:1,label:"settingEnabled"}
		]},
		{id:"music",internal:"music",values:[
			{id:0,label:"settingDisabled"},
			{id:1,label:"settingEnabled"}
		]},
		{id:"sfx",internal:"sfx",values:[
			{id:0,label:"settingDisabled"},
			{id:1,label:"settingEnabled"}
		]},
		{id:"language",values:[
			{id:"IT",label:"languageItalian"},
			{id:"EN",label:"languageEnglish"},
		]},
		{id:"credits",internal:"credits",dontSave:true,values:[
			{id:0,label:"settingShow"}
		]}
	];

	var internal;

	function getOptionValuePosition(settingpos) {
		var ret=0,optionValue;
		var setting=settings[settingpos];
		if (setting.dontSave) optionValue=internal[setting.id];
		else optionValue=Storage.data.settings[setting.id];
		settings[settingpos].values.forEach((value,pos)=>{
			if (value.id==optionValue) ret=pos;
		});
		return ret;
	}

	function changeOption(settingpos) {
		var setting=settings[settingpos];
		var pos=getOptionValuePosition(settingpos)+1;
		if (pos>=settings[settingpos].values.length) pos=0;
		switch (setting.internal) {
			case "credits":{
				Tools.windowChange(win,credits,[self]);
				enabled=false;
				break;
			}
			case "fullScreen":{
				if (pos==1) $.fullScreen.setFullScreen($("#screen"));
				else $.fullScreen.exitFullScreen();
				break;
			}
			case "music":{
				Audio.setMusic(pos);
				break;
			}
			case "sfx":{
				Audio.setEffects(pos);
				break;
			}
		}
		if (setting.dontSave) internal[settings[settingpos].id]=settings[settingpos].values[pos].id;
		else Storage.data.settings[settings[settingpos].id]=settings[settingpos].values[pos].id;
		updateOptionsPanel();
		Storage.saveData();
		Audio.play("flagon");
	}

	function updateOptionsPanel() {
		$(backButton,{innerHTML:Tools.translate("backButton")});
		$(titleBox,{innerHTML:Tools.translate("settingsTitle")});
		$(optionsPanel,{innerHTML:""});
		settings.forEach((setting,settingpos)=>{
			var option=$("div",{
				className:"option",
				_id:settingpos,
				onclick:function(){
					if (enabled) changeOption(this._id)
				}
			},optionsPanel);
			$("div",{
				className:"key",
				innerHTML:Tools.translate(settings[settingpos].id+"Label")
			},option);
			$("div",{
				className:"value",
				innerHTML:Tools.translate(settings[settingpos].values[getOptionValuePosition(settingpos)].label),
			},option)
		})
	}

	function initializeScreen() {
		var setup=$("div",{id:"settings",className:"subscreen"},$("#screen",{innerHTML:""}));
		titleBox=$("div",{className:"title"},setup);
		backButton=$("div",{
			id:"backbutton",
			innerHTML:Tools.translate("backButton"),
			onclick:function() {
				Audio.play("swing");
				Tools.windowChange(win,backObject,[0]);
			}
		},setup);

		win=$("div",{className:"window"},setup);
		optionsPanel=$("div",{className:"options"},win);
		
		updateOptionsPanel();

		return win;
	}

	this.show=function(back,deck) {
		Audio.play("flick");
		Tools.restoreMenuMusic();
		enabled=true;

		if (back) backObject=back;
		internal={
			fullScreen:$.fullScreen.isFullScreen()?1:0
		};
		initializeScreen();
		Tools.windowShow(win);
	}
}