var checkPositionVideo;

var Media = {
	audiosList:[],
	subtitlesList:[],
	audioDescriptions:[],
	ls:[],
	url:null,
	
	audioEnabled:true,
	subtitleEnabled:true,
	audioDescriptionEnabled:true,
	LSFEnabled:true,
	
	currentLSFIndex:0,
	currentAudioIndex:0,
	currentSubtitleIndex:0,
	currentAudioDescriptionIndex:0
};

var Player = {
	alreadyInit:false,
	onClose:null,
	waaAlreadyInit:false,// Ne doit être fait qu'une fois par session
	videoMain: document.getElementById('videoPlayerMain'),
	videoPip: document.getElementById('videoPlayerPip'),
    videoAudio: document.getElementById('videoPlayerAudio'),
	audioFiveDotOne:document.getElementById('playerAudioFiveDotOne'),
	audioFiveDotOne2:document.getElementById('playerAudioFiveDotOne-2'),
	ttmlDiv: document.getElementById('video-caption'),
	
	playerManager:{
    	playerMain: null,
    	playerPip: null,
    	playerAudio: null,
		playerAudioFiveDotOne:null,
		playerAudioFiveDotOne2:null,		
    	controller: null,
    	audioContext: null,
    	optionSigne: true,
    	optionDescription: true,
    	optionSub: true
    },
	
	isPlaying:false,
	currentPipMode:null,
	pipControlTimeout:null,
	checkPositionVideo:null,
	
	mode:"5.1",
	spatializationMode:"binaural",
	spatializationModes:["binaural","transaural"],
	commentsAzim:0,
	commentsElevationLevel:0,
	commentsDistance:1,
	dialoguesAzim:0,
	dialoguesElevationLevel:0,
	dialoguesDistance:1,
	azimRadius:180,
	distanceRange:[0.5, 10],
	elevationRange:[-40, 90],
	binauralEQ:false,
	catalogue:[],
	selectedProfil:null,
	config:null,
	attackTime:10,
	releaseTime:150,
	gainOffset:2
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.load = function(videoData, callback, onClose){
	
	this.onClose = onClose;
	
	this.spatializationMode = getHtmlStorage("spatializationMode") || this.spatializationMode;
	this.commentsElevationLevel = getHtmlStorage("commentsElevationLevel") || this.commentsElevationLevel;
	this.dialoguesElevationLevel = getHtmlStorage("dialoguesElevationLevel") || this.dialoguesElevationLevel;
	this.commentsDistance = getHtmlStorage("commentsDistance") || this.commentsDistance;
	this.dialoguesDistance = getHtmlStorage("dialoguesDistance") || this.dialoguesDistance;
	this.commentsAzim = getHtmlStorage("commentsAzim") || this.commentsAzim;
	this.dialoguesAzim = getHtmlStorage("dialoguesAzim") || this.dialoguesAzim;

	if(!this.alreadyInit || (videoData.links.dataMain.url !== Media.links.dataMain.url)){

		Media = videoData;
		
		if(isEmpty(Media.links.dataMain) || isEmpty(Media.links.dataEA) || isEmpty(Media.links.dataAD) || isEmpty(Media.links.dataDI)){
			log("Lecture annulée car il n'y a pas tout flux audio (isEmpty(Media.links.dataMain)="+isEmpty(Media.links.dataMain)+"; isEmpty(Media.links.dataEA)="+isEmpty(Media.links.dataEA)+";isEmpty(Media.links.dataAD)="+isEmpty(Media.links.dataAD)+";)");
			return;
		}

		Media.LSFEnabled = !getHtmlStorage("LSFDisabled") && Media.links.dataLS && Media.links.dataLS.url ? true : false;
		Media.audioEnabled = !getHtmlStorage("audioDisabled") && Media.links.dataMain && Media.links.dataMain.url ? true : false;
		Media.subtitleEnabled = !getHtmlStorage("subtitlesDisabled") && typeOf(Media.subtitlesList) === "array" && Media.subtitlesList.length ? true : false;
		Media.audioDescriptionEnabled = !getHtmlStorage("audioDescriptionDisabled") && Media.links.dataAD && Media.links.dataAD.url ? true : false;
		
		this.mode = Media.audiosList[1] ? "5.1" : "stereo";
		Media.currentAudioIndex = this.mode === "5.1" && Media.audiosList[1] ? 1 : 0;
		Media.currentAudioDescriptionIndex = 0;
		Media.currentLSFIndex = 0;
		Media.currentSubtitleIndex = 0;

		//LANCEMENT DU PLAYER ATTENTION CODE TOUCHY
		this.launch();
		
		InfoBanner.load();
	}

	var urlMain 			= Media.links.dataMain.url;
	var urlPip 				= Media.links.dataLS.url;
	var urlAudioDescription	= Media.links.dataAD.url;
	var urlAudioFiveDotOne 	= Media.links.dataEA.url;
	var urlAudioFiveDotOne2	= Media.links.dataDI.url;
		
	this.playerManager.playerMain.attachView(this.videoMain);
	this.playerManager.playerMain.attachSource(urlMain);	
	if(Media.LSFEnabled){
		this.playerManager.playerPip.attachView(this.videoPip);
		this.playerManager.playerPip.attachSource(urlPip);
	}	
	this.playerManager.playerAudioFiveDotOne.attachView(this.audioFiveDotOne);
	this.playerManager.playerAudioFiveDotOne.attachSource(urlAudioFiveDotOne);
	this.playerManager.playerAudioFiveDotOne2.attachView(this.audioFiveDotOne2);	
	this.playerManager.playerAudioFiveDotOne2.attachSource(urlAudioFiveDotOne2);
	this.playerManager.playerAudio.attachView(this.videoAudio);	
	this.playerManager.playerAudio.attachSource(urlAudioDescription);

	// Add HTML-rendered TTML subtitles
	this.playerManager.playerMain.attachTTMLRenderingDiv(this.ttmlDiv);
	
	this.playerManager.playerMain.play();	
	if(Media.LSFEnabled){
		this.playerManager.playerPip.play();
	}
	this.playerManager.playerAudioFiveDotOne.play();
	this.playerManager.playerAudioFiveDotOne2.play();
	this.playerManager.playerAudio.play();
	
	this.updateActiveStreams();
	
	this.playerManager.controller.play();
	
	//Gestion du PIP
	this.setPIP();

	this.initSubtitlesParams();
	
	this.onChangeEqualization();
	this.onChangeAzim("commentary");
	this.onChangeAzim("dialogues");
	this.onChangeElevation("commentary");
	this.onChangeElevation("dialogues");
	this.onChangeDistance("commentary");
	this.onChangeDistance("dialogues");
	
	// update the WAA connections
	this.updateWAAConnections();
	
	// prepare the sofa catalog of HRTF
	this.prepareSofaCatalog();
	
	this.onChangeSpatilisationMode();

	InfoBanner.show();

	if(typeOf(callback) === "function"){
		callback();
	}
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.launch = function(){
	var context = new Dash.di.DashContext();	

	//==============================================================================
	this.playerManager.playerMain = new MediaPlayer(context);
	this.playerManager.playerMain.startup();
	this.playerManager.playerMain.setAutoPlay(false);

	this.playerManager.playerPip = new MediaPlayer(context);
	this.playerManager.playerPip.startup();
	this.playerManager.playerPip.setAutoPlay(false);

	this.playerManager.playerAudioFiveDotOne = new MediaPlayer(context);	
	this.playerManager.playerAudioFiveDotOne.startup();
	this.playerManager.playerAudioFiveDotOne.setAutoPlay(false);

	this.playerManager.playerAudioFiveDotOne2 = new MediaPlayer(context);	
	this.playerManager.playerAudioFiveDotOne2.startup();
	this.playerManager.playerAudioFiveDotOne2.setAutoPlay(false);

	this.playerManager.playerAudio = new MediaPlayer(context);	
	this.playerManager.playerAudio.startup();
	this.playerManager.playerAudio.setAutoPlay(false);

	// remove Dash.js logs
	this.playerManager.playerMain.getDebug().setLogToBrowserConsole(false);
	this.playerManager.playerPip.getDebug().setLogToBrowserConsole(false);
	this.playerManager.playerAudioFiveDotOne.getDebug().setLogToBrowserConsole(false);
	this.playerManager.playerAudioFiveDotOne2.getDebug().setLogToBrowserConsole(false);
	this.playerManager.playerAudio.getDebug().setLogToBrowserConsole(false);

	this.playerManager.controller = new MediaController();

	//log("controller = " + this.playerManager.controller);
	
	this.videoMain.controller			= this.playerManager.controller;
	this.audioFiveDotOne.controller		= this.playerManager.controller;
	this.audioFiveDotOne2.controller	= this.playerManager.controller;
	this.videoAudio.controller			= this.playerManager.controller;
	if(Media.LSFEnabled){
		this.videoPip.controller		= this.playerManager.controller;			
	}

	if(!this.waaAlreadyInit){

		this.playerManager.audioContext = new(window.AudioContext || window.webkitAudioContext)();
		//log("######### audioContext: " + this.playerManager.audioContext);

		//==============================================================================
		var audioSourceMain 	 	= this.playerManager.audioContext.createMediaElementSource( this.videoMain );
		var audioSourceFiveDotOne  	= this.playerManager.audioContext.createMediaElementSource( this.audioFiveDotOne );
		var audioSourceFiveDotOne2 	= this.playerManager.audioContext.createMediaElementSource( this.audioFiveDotOne2 );
		var audioSourceDescription	= this.playerManager.audioContext.createMediaElementSource(this.videoAudio);

		/// create a 10-channel stream containing all audio materials
		var channelMerger = this.playerManager.audioContext.createChannelMerger(10);

		var channelSplitterMain 		= this.playerManager.audioContext.createChannelSplitter( 2 );
		var channelSplitterFiveDotOne	= this.playerManager.audioContext.createChannelSplitter( 6 );
		var channelSplitterFiveDotOne2	= this.playerManager.audioContext.createChannelSplitter( 1 );
		var channelSplitterDescription 	= this.playerManager.audioContext.createChannelSplitter( 1 );

		audioSourceMain.connect( channelSplitterMain );
		audioSourceFiveDotOne.connect( channelSplitterFiveDotOne );
		audioSourceFiveDotOne2.connect( channelSplitterFiveDotOne2 );
		audioSourceDescription.connect( channelSplitterDescription );

		channelSplitterMain.connect( channelMerger, 0, 0 );
		channelSplitterMain.connect( channelMerger, 1, 1 );

		channelSplitterFiveDotOne.connect( channelMerger, 0, 2 );
		channelSplitterFiveDotOne.connect( channelMerger, 1, 3 );
		channelSplitterFiveDotOne.connect( channelMerger, 2, 4 );
		channelSplitterFiveDotOne.connect( channelMerger, 3, 5 );
		channelSplitterFiveDotOne.connect( channelMerger, 4, 6 );
		channelSplitterFiveDotOne.connect( channelMerger, 5, 7 );
		
		channelSplitterDescription.connect( channelMerger, 0, 8 );
		
		channelSplitterFiveDotOne2.connect( channelMerger, 0, 9 );
	
		//==============================================================================
		var mainData = Media.links.dataMain;
		var eaData = Media.links.dataEA;
		var adData = Media.links.dataAD;
		var diData = Media.links.dataDI;
		
		// Son principal
		mainAudioASD = new M4DPAudioModules.AudioStreamDescription(
				mainData.type,
				this.mode === "stereo" && Media.audioEnabled,
				parseInt(mainData.loudness,10),
				parseInt(mainData.maxTruePeak,10),
				mainData.dialog === "true",
				mainData.ambiance === "true",
				mainData.commentary === "true");
		
		// Ambiance (pour le 5.1)
		extendedAmbienceASD = new M4DPAudioModules.AudioStreamDescription(
				eaData.type,
				this.mode === "5.1" && Media.audioEnabled,
				parseInt(eaData.loudness,10),
				parseInt(eaData.maxTruePeak,10),
				eaData.dialog === "true",
				eaData.ambiance === "true",
				eaData.commentary === "true");
		
		// Audio description
		extendedCommentsASD = new M4DPAudioModules.AudioStreamDescription(
				adData.type,
				Media.audioDescriptionEnabled,
				parseInt(adData.loudness,10),
				parseInt(adData.maxTruePeak,10),
				adData.dialog === "true",
				adData.ambiance === "true",
				adData.commentary === "true");
		
		// Dialogue (pour le 5.1)
		extendedDialogsASD = new M4DPAudioModules.AudioStreamDescription(
				diData.type,
				this.mode === "5.1" && Media.audioEnabled,
				parseInt(diData.loudness,10),
				parseInt(diData.maxTruePeak,10),
				diData.dialog === "true",
				diData.ambiance === "true",
				diData.commentary === "true");

		var asdc = new M4DPAudioModules.AudioStreamDescriptionCollection(
				[mainAudioASD, extendedAmbienceASD, extendedCommentsASD, extendedDialogsASD]
		);
	
		//==============================================================================
		// M4DPAudioModules

		/// connect either the multichannel spatializer or the object spatializer
		ModulesConfiguration = {
			kMultichannelSpatialiser : 0,
			kObjectSpatialiserAndMixer : 1
		};

		this.config = ModulesConfiguration.kObjectSpatialiserAndMixer;

		streamSelector = new M4DPAudioModules.StreamSelector( this.playerManager.audioContext, asdc );
		smartFader = new M4DPAudioModules.SmartFader( this.playerManager.audioContext, asdc );
		dialogEnhancement = new M4DPAudioModules.DialogEnhancement( this.playerManager.audioContext, asdc );
		receiverMix = new M4DPAudioModules.ReceiverMix( this.playerManager.audioContext, asdc );
		//var noiseAdaptation = new M4DPAudioModules.NoiseAdaptation(this.playerManager.audioContext);
		multichannelSpatialiser = new M4DPAudioModules.MultichannelSpatialiser( this.playerManager.audioContext, asdc, this.spatializationMode );
		objectSpatialiserAndMixer = new M4DPAudioModules.ObjectSpatialiserAndMixer( this.playerManager.audioContext, asdc, this.spatializationMode );

		{
			///@bug : the channelSplitterMain MUST be connected to the AudioContext,
			/// otherwise the video wont read.
			/// so as a workaround, we just add a dummuy node, with 0 gain,
			/// to connect the channelSplitterMain
			var uselessGain = this.playerManager.audioContext.createGain();
			channelSplitterMain.connect( uselessGain, 0, 0 );
			uselessGain.gain.value = 0;
			
			uselessGain.connect( this.playerManager.audioContext.destination, 0, 0 );
		}

		/// WAA connections
		{
			/// receives 4 ADSC with 10 channels in total
			channelMerger.connect( streamSelector._input );

			/// mute or unmute the inactive streams
			/// (process 10 channels in total)
			streamSelector.connect( smartFader._input );
		}
		
		smartFader.setAttackTimeFromGui( {value:this.attackTime, min:0,max:100} );
		smartFader.setReleaseTimeFromGui( {value:this.releaseTime, min:0,max:100} );
		multichannelSpatialiser.offsetGain = this.gainOffset;
		objectSpatialiserAndMixer.offsetGain = this.gainOffset;
		this.waaAlreadyInit = true;
	}
	
	this.playerManager.controller.addEventListener('playing', function() {
		Player.onPlay();
	});
	
	this.playerManager.controller.addEventListener('pause', function() {
		Player.onPause();
	});
	
	this.playerManager.controller.addEventListener('ended', function() {
		Player.alreadyInit = false;
		Player.validClose();
	});

	var textTrackEvent = function(){
		if(getHtmlStorage("subtitlesDisabled")){
			Player.playerManager.playerMain.setTextTrack(-1);					
		}else{
			Player.playerManager.playerMain.setTextTrack(Media.currentSubtitleIndex);
		}

		//log("MediaPlayer.events.TEXT_TRACKS_ADDED");

		var yPos = getHtmlStorage("subtitlePositionY");
		if(yPos !== "undefined"){
			var top = Math.round(yPos);
			if(top <= 0){
				top = 0;
			}else if(top>= 65){
				top = 65 / 2;
			}else{
				top = top / 2;
			}
			$(Player.ttmlDiv).css({top:top + "%"});
		}
	};
	
	this.playerManager.playerMain.addEventListener(MediaPlayer.events.TEXT_TRACKS_ADDED, textTrackEvent);

	this.alreadyInit = true;
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.setVolume = function(volume){
	
	var minFader = 0;
	var maxFader = 100;

	//const [minValue, maxValue] = M4DPAudioModules.SmartFader.dBRange();
	var minValue = -60;
	var maxValue = 8;

	/// scale from GUI to DSP
	var value = M4DPAudioModules.utilities.scale( volume, minFader, maxFader, minValue, maxValue );

	log('Smart Fader = ' + Math.round(value).toString() + ' dB');

	/// sets the smart fader dB gain
	smartFader.dB = value;
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.setMute = function(){
	this.setVolume(0);
	setHtmlStorage("volumeValue", 0);
	setHtmlStorage("muteEnabled", 1);
	$('.volume').css('background-position', '0 0');
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.onPause = function() {
	this.isPlaying = false;
	InfoBanner.hidePauseBtn();
	this.stopCheckVideoPosition();
};	

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.onPlay = function() {
	this.isPlaying = true;
	this.launchCheckPositionVideo();
	InfoBanner.showPauseBtn();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.validClose = function() {
	this.resetPlayers();
	
	InfoBanner.progressBar.reset();

	if(typeOf(this.onClose) === "function"){
		this.onClose();
	}

	Navigation.goBack();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Generates the parental rating rubric of the settings section
 * @param {String} name The user's name
 * @param {Object} userDetails The user's data
 * @param {Array} thresholds Thresholds list
 * @param {Object} callbackList Contains a success and error callback
 */

Player.resetPlayers = function(){
	this.playerManager.playerMain.reset();
	this.playerManager.playerPip.reset();
	this.playerManager.playerAudio.reset();	
	this.playerManager.playerAudioFiveDotOne.reset();	
	this.playerManager.playerAudioFiveDotOne2.reset();
};

Player.setPIP = function(){
	var $ctn = $(document.getElementById("pipContainer"));
	var $pipVideo = $(document.getElementById("pipVideo")).css("left", (getHtmlStorage("LSFPip_position_x") || Settings.defaultLSPIPCoordonates.x) + "%" )
		.css("top", (getHtmlStorage("LSFPip_position_y") || Settings.defaultLSPIPCoordonates.y) + "%" )
		.css("width", (getHtmlStorage("LSFPip_size_width") || Settings.defaultLSPIPCoordonates.w) + "%" )
		.css("height", (getHtmlStorage("LSFPip_size_height") || Settings.defaultLSPIPCoordonates.h) + "%" )
		.draggable({
			containment: $ctn.parent(),
			scroll:false,
			handle:".ui-icon-gripsmall-center",
			stop: function() {
				appearPipControls();
				Settings.saveLSPIPPosition($( this ).draggable( "option", "containment" ), $(this));
			},
			start: function() {
				clearInterval(Player.pipControlTimeout);
				$ctn.css("border-style","solid");
				$(this).css("border-style","solid");
			}
		}).resizable({
			containment: "parent",
			handles: 'all',
			minWidth: 100,
			aspectRatio: true,
			stop: function() {
				var $containment = $( this ).draggable( "option", "containment" );
				Settings.saveLSPIPSize($containment, $(this));
				Settings.saveLSPIPPosition($containment, $(this));
			}			
		}).click( function() {
			if(InfoBanner.isDisplayed()){
				InfoBanner.hide();
			}else if(Media.LSFEnabled){
				appearPipControls();
			}
		});
		
	var appearPipControls = function(){
		if(Player.pipControlTimeout){
			clearInterval(Player.pipControlTimeout);
		}
		Player.pipControlTimeout = setTimeout(function(){

			$ctn.css("border-style","hidden");
			$pipVideo.css("border-style","hidden");
			$pipVideo.children(".ui-icon").hide();

		}, Config.timeoutHidePIP *1000);

		$ctn.css("border-style","solid");
		$pipVideo.css("border-style","solid").children(".ui-icon").show();		
	};

	$('.ui-resizable-nw').addClass('ui-icon ui-icon-gripsmall-diagonal-nw');
	$('.ui-resizable-ne').addClass('ui-icon ui-icon-gripsmall-diagonal-ne');
	$('.ui-resizable-sw').addClass('ui-icon ui-icon-gripsmall-diagonal-sw');
	$('.ui-resizable-se').addClass('ui-icon ui-icon-gripsmall-diagonal-se');
	$pipVideo.children(".ui-icon").hide();
};

Player.initSubtitlesParams = function(){

	// subtitles
	var $container = $(this.ttmlDiv).removeClass("Arial OpenDyslexic Andika Helvetica Verdana");
	var selectedFont = getHtmlStorage("subtitleFont") || Settings.defaultFont;
	if(selectedFont){
		$container.addClass(selectedFont);
	}

	// color
	$container.removeClass("transparentColor whiteColor yellowColor blueColor");
	var selectedFontColor = getHtmlStorage("subtitleFontColor") || Settings.defaultSubtitlesColor;
	if(selectedFontColor){
		$container.addClass(selectedFontColor+"Color");
	}	

	// background color
	$container.removeClass("blackBGColor whiteBGColor");
	var selectedFontBGColor = getHtmlStorage("subtitleBGColor") || Settings.defaultSubtitlesBGColor;
	if(selectedFontBGColor){
		$container.addClass(selectedFontBGColor+"BGColor");
	}

	// Opacité du background
	$container.removeClass("opacity_0 opacity_025 opacity_05 opacity_075 opacity_1");
	var selectedFontBGColor = getHtmlStorage("subtitleBackgroundOpacity") || Settings.minOpacity;
	if(selectedFontBGColor){
		$container.addClass("opacity_"+selectedFontBGColor.replace(".",""));
	}

	// font-size
	$container.css("font-size", "inherit");
	var selectedFontSize = getHtmlStorage("subtitleFontSize") || Settings.minSubtitlesSize;
	if(selectedFontSize){
		$container.css("font-size", selectedFontSize+"px");
	}

	var yPos = getHtmlStorage("subtitlePositionY") || Settings.subtitlesDefaultPosition;
	if(yPos !== "undefined"){
		var top = Math.round(yPos);
		if(top <= 0){
			top = 0;
		}else if(top>= 65){
			top = 65 / 2;
		}else{
			top = top / 2;
		}
		$container.css("top", top + "%")
			.css("width", "100%");
	}
};

Player.updateWAAConnections = function(){
    
    smartFader.disconnect();
	dialogEnhancement.disconnect();
	receiverMix.disconnect();
    multichannelSpatialiser.disconnect();
    objectSpatialiserAndMixer.disconnect();

    var processor;

    if( this.config === ModulesConfiguration.kMultichannelSpatialiser ){
        processor = multichannelSpatialiser;  
		
    }else if( this.config === ModulesConfiguration.kObjectSpatialiserAndMixer ){
        processor = objectSpatialiserAndMixer;
		
    }else{
        throw new Error( "Invalid configuration" );
    }
    
    smartFader.connect( dialogEnhancement._input );

    dialogEnhancement.connect( receiverMix._input );
	
	receiverMix.connect( processor._input );

    /// apply the multichannel spatialiser
    processor.connect( this.playerManager.audioContext.destination );
	
	Player.onChangeProfil();
};

Player.prepareSofaCatalog = function(callback){
	
	if(this.catalogue.length){
		Player.onChangeProfil();
		
		if(typeOf(callback) === "object" && callback.onSuccess){
			callback.onSuccess();
		}
		return;
	}
	
	var _callback = function(url){
		Player.selectedProfil = url;
		Player.onChangeProfil(url);

		if(typeOf(callback) === "object" && callback.onSuccess){
			callback.onSuccess();
		}		
	};

    /// retrieves the catalog of URLs from the OpenDAP server
	var serverDataBase = new M4DPAudioModules.binaural.sofa.ServerDataBase();
	serverDataBase
         .loadCatalogue()
         .then( function(){
            var urls = serverDataBase.getUrls({
                convention: 'HRIR',
                equalisation: 'compensated',
                sampleRate: Player.playerManager.audioContext.sampleRate
            });
			
			Player.catalogue = urls;
            defaultUrl = urls.findIndex( function (url) {
                return url.match('1018');
            });
			
			_callback(urls[defaultUrl]);

            return urls;
        })
        .catch( function (){
			 
         	log('could not access bili2.ircam.fr...');

			var currentProcessor;
			if( this.config === ModulesConfiguration.kMultichannelSpatialiser ){
				currentProcessor = multichannelSpatialiser;

			}else{
				currentProcessor = objectSpatialiserAndMixer;
			}

			var sofaUrl = currentProcessor._virtualSpeakers.getFallbackUrl();
			
			_callback(sofaUrl);

         	return sofaUrl;
        });
};

Player.onChangeProfil = function(){
	
	var url = this.selectedProfil;
	if(url){

        var currentProcessor;
        if( this.config === ModulesConfiguration.kMultichannelSpatialiser ){
            currentProcessor = multichannelSpatialiser;
        }
        else{
            currentProcessor = objectSpatialiserAndMixer;
        }

        /// load the URL in the spatialiser
        currentProcessor.loadHrtfSet( url )
        .then( function(){
            objectSpatialiserAndMixer._updateCommentaryPosition();
        });
	}else{
		log("Il n'y pas d'url de profil");
	}
};

Player.onChangeEqualization = function(){
	multichannelSpatialiser.eqPreset = "eq1";
	objectSpatialiserAndMixer.eqPreset = "eq1";

	if (this.binauralEQ) {
		multichannelSpatialiser.bypassHeadphoneEqualization( false );
        objectSpatialiserAndMixer.bypassHeadphoneEqualization( false );
	} else {
		multichannelSpatialiser.bypassHeadphoneEqualization( true );
		objectSpatialiserAndMixer.bypassHeadphoneEqualization( true );
	}	
};

Player.onChangeAzim = function(type){
	if(type === "commentary"){
		objectSpatialiserAndMixer.setCommentaryAzimuth( parseFloat( this.commentsAzim ) );
		
	}else if(type === "dialogues"){
		objectSpatialiserAndMixer.setDialogAzimuth( this.dialoguesAzim );
	}
};

Player.onChangeElevation = function(type){
	if(type === "commentary"){
		objectSpatialiserAndMixer.setCommentaryElevation( parseFloat( this.commentsElevationLevel ) );
		
	}else if(type === "dialogues"){
		objectSpatialiserAndMixer.setDialogElevation( this.dialoguesElevationLevel );
	}
};

Player.onChangeDistance = function(type){
	if(type === "commentary"){
		objectSpatialiserAndMixer.setCommentaryDistance( parseFloat( this.commentsDistance ) );
		
	}else if(type === "dialogues"){
		objectSpatialiserAndMixer.setDialogDistance( this.dialoguesDistance );
	}
};

Player.onChangeSpatilisationMode = function(){
	multichannelSpatialiser.outputType = this.spatializationMode;
	objectSpatialiserAndMixer.outputType = this.spatializationMode;
};

Player.onChangeADVolume = function(value){
	
	// Si je veux augmenter l'AD je dois baisser les autres et laisser l'AD à 0
	if(value > 0){
		var range = Settings.adGainRange;
		var rangePositive = [0, range[1]];
		var rangeNegative = [0, range[0]];
		var nValue = ((value - rangePositive[0]) * (rangeNegative[1] - rangeNegative[0]) / (rangePositive[1] - rangePositive[0])) + rangeNegative[0];
		
		mainAudioASD._trim = nValue;
		extendedAmbienceASD._trim = nValue;
		extendedDialogsASD._trim = nValue;
		
		extendedCommentsASD._trim = 0;
		log("Valeur d'entrée : "+value+"; Je passe l'AD à 0 et les autres à "+nValue);
	
	// Sinon je dois baisser l'AD et laisser les autres à 0
	}else{
		mainAudioASD._trim = 0;
		extendedAmbienceASD._trim = 0;
		extendedDialogsASD._trim = 0;
		
		extendedCommentsASD._trim = value;	
		log("Je passe l'AD à "+value+" et les autres à 0");	
	}	
	
	streamSelector.streamsTrimChanged();	
	
	setHtmlStorage("ADvolumeValue", value);
};

																								/********************************
																								*	GESTION DE LA PROGRESSBAR	*
																								********************************/

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Launches the progress bar updating
 */

Player.launchCheckPositionVideo = function(){
	//log("launchCheckPositionVideo() : start; je vais lancer le stop");
	this.stopCheckVideoPosition();
	this.checkPositionVideo = setInterval(function(){
		InfoBanner.progressBar.update(Player.playerManager.controller.currentTime, Player.playerManager.controller.duration);
		
		var upVol = document.getElementById('up-volume');
		var isCompressed = smartFader.dynamicCompressionState;
		if( isCompressed === true){
			console.error("compressed at "+ Player.playerManager.controller.currentTime);
			upVol.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
		}
		else{
			upVol.style.backgroundColor = "rgba(0, 0, 0, 0)";
		}		
	}, 500);
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Stop the progress bar updating
 */

Player.stopCheckVideoPosition = function(){
	//log("stopCheckVideoPosition() : start;");
	clearInterval(this.checkPositionVideo);
};

																								/****************************
																								*	GESTION DU TRICK MODE	*
																								****************************/

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.rw = function(){
		
	var totalTimeSecond =  this.playerManager.controller.duration;	
	var saut = Math.round(totalTimeSecond*(5/100));
	var currentPosition = this.playerManager.controller.currentTime;
	var newCurrentPosition = currentPosition - saut;
	if (newCurrentPosition < 0) {
		newCurrentPosition = 0;
	}

	// check if the new position is seekable
	this.doSeek(newCurrentPosition);
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.ff = function(){
		
	var totalTimeSecond =  this.playerManager.controller.duration;	
	var saut = Math.round(totalTimeSecond*(5/100));
	var currentPosition = this.playerManager.controller.currentTime;
	var newCurrentPosition = currentPosition + saut;
	/*if (newCurrentPosition > totalTimeSecond) {
		newCurrentPosition = totalTimeSecond;
	}*/

	// check if the new position is seekable
	this.doSeek(newCurrentPosition);
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.doSeek = function(position){
	log("doSeek() : position to seek  = "+position);
	
	var i, l = this.playerManager.controller.seekable.length;
	for (i=0; i<l; i++) {
		
		//log("check range seekable #" + i + " -> "+this.playerManager.controller.seekable.start(i)+", "+this.playerManager.controller.seekable.end(i));
		//log("check range buffered #" + i + " -> "+this.playerManager.controller.buffered.start(i)+", "+this.playerManager.controller.buffered.end(i));
		
		if (this.playerManager.controller.seekable.start(i) <= position && position <= this.playerManager.controller.seekable.end(i)) {
			this.playerManager.controller.currentTime = position;
			InfoBanner.launchMaskingAfterDelay();
			break;
		}
	}	
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.playPause = function() {
	//log("playPause : ", this.isPlaying);

	if(this.isPlaying) {
		this.pause();
		
	}else{
		this.play();	
	}

	InfoBanner.launchMaskingAfterDelay();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.play = function() {
	this.playerManager.controller.play();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.pause = function() {
	this.playerManager.controller.pause();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.activeOptionSigne = function(index) {
	var $textContent = $(document.getElementById("playerOptionSigneCurrentValue"));

	var playerPIP, playerMain;
	playerPIP = this.playerManager.playerPip;
	playerMain = this.playerManager.playerMain;

	if(index !== Media.ls.length){

		this.playerManager.controller.currentTime = this.videoMain.currentTime;
		this.videoPip.controller = this.playerManager.controller;	
		
		playerPIP.startup();
		playerPIP.setAutoPlay(false);
		playerPIP.attachView(this.videoPip);
		playerPIP.attachSource(Media.ls[Media.currentLSFIndex].url);

		Media.currentLSFIndex = index;
		Media.LSFEnabled = true;
		removeHtmlStorage("LSFDisabled");
		$textContent.html(Media.ls[index].lang);

	}else{
		this.videoPip.controller = null;
		playerPIP.reset();

		Media.LSFEnabled = false;
		setHtmlStorage("LSFDisabled", 1);
		$textContent.html("Aucun");
	}
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.activeOptionSub = function(index) {
	var $textContent = $(document.getElementById("playerOptionSubCurrentValue"));
	if(index !== Media.subtitlesList.length){
		this.playerManager.playerMain.setTextTrack(index);

		Media.currentSubtitleIndex = index;
		Media.subtitleEnabled = true;
		removeHtmlStorage("subtitlesDisabled");
		$textContent.html(Media.subtitlesList[index] + '<img src="ressources/img/sourd.png" height="100%" style="vertical-align:top;margin-left:10px;"/>');

	}else{
		this.playerManager.playerMain.setTextTrack(-1);
		
		Media.subtitleEnabled = false;
		Media.currentSubtitleIndex = 0;
		setHtmlStorage("subtitlesDisabled", 1);
		$textContent.html("Aucun");
	}
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.activeOptionDescription = function(index) {
	var $sliderADVol = $(document.getElementById("playerControlADVolume"));
	var $textContent = $(document.getElementById("playerOptionDescriptionCurrentValue"));
	if(index !== Media.audioDescriptions.length){
		extendedCommentsASD.active = true;

		Media.currentAudioDescriptionIndex = index;
		Media.audioDescriptionEnabled = true;
		removeHtmlStorage("audioDescriptionDisabled");
		$textContent.html(Media.audioDescriptions[index].lang);
		
		$sliderADVol.show();
		
		var value = parseFloat(getHtmlStorage("ADvolumeValue")) || Settings.defaultADVolumeValue;
		this.onChangeADVolume(value);
		$( document.getElementById("ad-volume-slider") ).slider("value", value);

	}else{

		/*this.videoAudio.controller = null;
		this.playerManager.playerAudio.reset();*/
		extendedCommentsASD.active = false;

		Media.audioDescriptionEnabled = false;
		setHtmlStorage("audioDescriptionDisabled", 1);
		$textContent.html("Aucun");
		
		this.onChangeADVolume(0);
		$sliderADVol.hide();
	}
	
	this.updateActiveStreams();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Updates the progress bar
 * @param {Integer} time The current position inside the video (in milliseconds)
 * @param {Integer} tT Total time of the video (in milliseconds)
 */

Player.activeOptionAudio = function(index) {
	
	var $textContent = $(document.getElementById("playerOptionAudioCurrentValue"));
	
	Media.currentAudioIndex = index;
	if(index !== Media.audiosList.length){
		Media.audioEnabled = true;
		removeHtmlStorage("audioDisabled");
		
		if(Media.audiosList[index].search("5.1") !== -1){
			Player.mode = "5.1";
			mainAudioASD.active = false;
		}else{
			Player.mode = "stereo";
			extendedAmbienceASD.active = false;
			extendedDialogsASD.active = false;
		}
		
		if(Player.mode === "5.1"){
			extendedAmbienceASD.active = true;
			extendedDialogsASD.active = true;
		}else{
			mainAudioASD.active = true;
		}

		$textContent.html(Media.audiosList[index]);

	}else{
		Media.audioEnabled = false;
		setHtmlStorage("audioDisabled", 1);
		$(document.getElementById("playerOptionAudioCurrentValue")).html("Aucun");
		if(Player.mode === "5.1"){
			extendedAmbienceASD.active = false;
			extendedDialogsASD.active = false;
		}else{
			mainAudioASD.active = false;
		}
	}
	this.updateActiveStreams();
};

Player.updateActiveStreams = function(){
	
	/// notify the modification of active streams
	streamSelector.activeStreamsChanged();
	smartFader.activeStreamsChanged();
    dialogEnhancement.activeStreamsChanged();
	receiverMix.activeStreamsChanged();
	multichannelSpatialiser.activeStreamsChanged();
	objectSpatialiserAndMixer.activeStreamsChanged();	
};