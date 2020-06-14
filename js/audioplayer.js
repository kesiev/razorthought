function AudioPlayer(cfg) {
	if (!cfg) cfg={};

	var ready=false,audioContext=audioOut=0;
	if (cfg.volume==undefined) cfg.volume=1;
	if (cfg.musicVolume==undefined) cfg.musicVolume=0.3;
	var lastId=0,audioPlaying={},musicPlaying=0,buffers={};

	this.enabled=true;
	this.musicEnabled=true;
	this.effectsEnabled=true;

	this.setMusic=function(enabled) {
		this.musicEnabled=enabled;
		if (ready)
			if (enabled) this.playMusic(musicPlaying,true);
			else this.stopMusic(true);
	}

	this.setEffects=function(enabled) {
		this.effectsEnabled=enabled;
	}

	this.play=function(sampleid,loop,volume,force) {
		var buffer=getBuffer(sampleid);
		if (this.initialize()&&buffer&&this.enabled&&(this.effectsEnabled||force)&&audioContext) {
			loop=!!loop;
			this.stop(sampleid);
			var gain=audioContext.createGain();					
			gain.connect(audioOut);
			gain.gain.value=volume||cfg.volume;
			var source = audioContext.createBufferSource();
			source.buffer = buffer.buffer;
		  	source.loop=loop;
		  	if (loop&&(buffer.sample.loopStart!=undefined)) {
		  		source.loopStart=buffer.sample.loopStart;
				source.loopEnd=buffer.sample.loopEnd;
		  	}
			source.connect(gain);
			source.start(0);
			audioPlaying[sampleid]={gain:gain,source:source};
		}
	}

	this.playMusic=function(sampleid,force) {
		if (force||(sampleid!=musicPlaying)) {
			if (this.initialize()) {
				this.stopMusic();
				if (this.musicEnabled) this.play(sampleid,true,cfg.musicVolume,true);
				musicPlaying=sampleid;
			}
		}
	}

	this.stopMusic=function(dontforget) {
		if (this.initialize()) {
			this.stop(musicPlaying)
			if (!dontforget) musicPlaying=0;
		}
	}

	this.stopAll=function() {
		if (this.initialize()) {
			for (var a in audioPlaying)
				this.stop(a);
		}
	}

	this.stop=function(sampleid) {
		if (this.initialize()) {
			if (audioPlaying[sampleid]) {
				audioPlaying[sampleid].source.stop(0);
				audioPlaying[sampleid].gain.disconnect();
				audioPlaying[sampleid].source.disconnect();
				audioPlaying[sampleid]=0;
			}
		}
	}

	this.setEnabled=function(state) {
		this.enabled=state;
		this.stopAll();
	}

	this.initialize=function(cb) {
		if (!this.enabled||ready) return true;
		else {
			if (window.AudioContext)
				audioContext=new window.AudioContext();
			else if (window.webkitAudioContext)
				audioContext=new window.webkitAudioContext();
			if (audioContext) {
				ready=true;
				audioOut=audioContext.createGain();
				audioOut.connect(audioContext.destination);
				audioOut.gain.value=0.9;
				loadResources(cfg.resources,cb);
			}
			return false;
		}
	}

	// --- LOADER

	function getBuffer(id) {
		return buffers[id]||false;
	}

	function loadResources(samples,ondone) {
		var self=this;
		if (!samples.length) {
			if (ondone) ondone(true);
		} else {
			var sample=samples.pop();		
			var request = new XMLHttpRequest();
			request.open('GET', sample.file, true);
			request.responseType = 'arraybuffer';
			request.onload = function() {					
				audioContext.decodeAudioData(request.response, function(buffer) {
					buffers[sample.id]={
						buffer:buffer,
						sample:sample
					};
					loadResources(samples,ondone);
				}, function(e){
					console.log("Error loading resource",sample);
					if (ondone) ondone(false);
				});
			}	
			request.send();
		}
	}

}