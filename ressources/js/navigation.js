var Navigation = {};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Reverts to the previous template
 * @param {Integer} time The playback current time
 */

Navigation.goBack = function(){
	this.goBack.resetData();
};

/**
 * @author Johny EUGENE (DOTSCREEN)
 * @description Resets the data of the previous template
 */

Navigation.goBack.resetData = function(){
	
	if(Settings.backToPlayerFromSettings && $("body").hasClass("sm settings")){
		Section.launchPlayerFromSettings();
		
	}else if(Section.oldClass.length){
		$("body").attr("class", Section.oldClass[Section.oldClass.length-1]);
		Section.oldClass.pop();
	}
	
	Navigation.setFocusToFirstItem();
};

Navigation.moveSelecteur = function(Obj){
	//log("moveSelecteur start; Obj = "+Obj.innerHTML);
	try {
		if (!$(Obj).length) {
			Obj = document.getElementById(Obj);
		}

		var Obj_ref = Obj;
		var absoluteLeft = 0;
		var absoluteTop = 0;
		while (Obj_ref && Obj_ref.tagName !== 'body') {
			absoluteLeft += Obj_ref.offsetLeft;
			absoluteTop += Obj_ref.offsetTop;
			Obj_ref = Obj_ref.offsetParent;
		}
		
		Obj.focus();
	} catch (err) {
		log("Une erreur est survenue...");
	}
};

Navigation.setFocusToFirstItem = function(){
	var $defaultFocus = $("body").find("h1:visible span.selectable-by-chromevox, .back-button:visible span.selectable-by-chromevox, #in-construction:visible .selectable-by-chromevox, #switch-to-simplified-mode-btn.selectable-by-chromevox:visible, .closeBtn:visible");
	if($defaultFocus.length){
		this.moveSelecteur($defaultFocus[0]);
	}
};