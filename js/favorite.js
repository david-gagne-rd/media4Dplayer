function favoriteScreen() {
	var myFavoriteScreen = this;
	this.activeScreen = false;
	this.favoriteScreen = document.getElementById("favoriteScreen");
	this.userFavList = null;
	
	this.createFav = function() {
		var favoriteBackground = createDiv("favoriteBackground", this.favoriteScreen, null, "favoriteBackground");
		
		var favoriteBackgroundTitleZone = createDiv("favoriteBackgroundTitleZone", favoriteBackground);
		var favTitleIcone = createDiv("favoriteBackgroundTitleIcone", favoriteBackgroundTitleZone, null, null);
		favTitleIcone.innerHTML = '<svg version="1.1" id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'
								+'width="50px" height="43px" viewBox="0 0 50 43" style="enable-background:new 0 0 50 43;" xml:space="preserve">'
								+ '<g><polygon style="fill:#555555;stroke:#FFFFFF;stroke-width:0.25;stroke-miterlimit:10;" class="st0" points="25.3,0 32.3,14.1 47.9,16.4 36.6,27.4 39.3,43 25.3,35.6 11.4,43 14,27.4 2.8,16.4 18.4,14.1"/></g>'
								+ '</svg>';
		createDiv("favoriteBackgroundTitle", favoriteBackgroundTitleZone, language.fr.favTitle);
		
		var favoriteBackgroundContentZone = createDiv("favoriteBackgroundContentZone", favoriteBackground);
		
		favButton = function(index, parent, fav) {
			var favButton = createButton("fav_" + index, parent, "favoriteChoice", 0, index, "favButton");
			
			var favDelete = createButton("favDelete_" + index, favButton, "favoriteDelete", 0, 0, "favDelete");
			favDelete.setAttribute("tabindex", cpt + 2);
			var favDeleteIcone = createDiv("favoriteDeleteIcone", favDelete, null, null);
			favDeleteIcone.innerHTML = '<svg version="1.1" id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'
								+'width="50px" height="43px" viewBox="0 0 50 43" style="enable-background:new 0 0 50 43;" xml:space="preserve">'
								+ '<g><polygon class="st0" style="fill:#FFDE00;stroke:#FFFFFF;stroke-width:0.25;stroke-miterlimit:10;" points="25.3,0 32.3,14.1 47.9,16.4 36.6,27.4 39.3,43 25.3,35.6 11.4,43 14,27.4 2.8,16.4 18.4,14.1"/></g>'
								+ '</svg>';

			createImg(null, favButton, fav.picture, "favoriteImg");
			
			var favInfos = createDiv("favInfos", favButton, null, "favoriteInfos");
			createDiv("favInfosTitle", favInfos, fav.title);
			createDiv("favInfosSubitle", favInfos, fav.subtitle);
			createDiv("favInfosDetail", favInfos, fav.detail);
			
			var favPlay = createButton("favPlay_" + index, favButton, "favoritePlay", 0, 0, "favPlay");
			favPlay.setAttribute("tabindex", cpt + 3);
			createImg(null, favPlay, "media/fav_play_icone.png");	
			
			return favButton;
		};
		
		var cpt = 0;
		var btn = null;
		for(var i in myFavoriteScreen.userFavList.fav) {
			btn = favButton(cpt, favoriteBackgroundContentZone, myFavoriteScreen.userFavList.fav[i]);
			btn.setAttribute("tabindex", cpt + 1);
			cpt = cpt + 3;
		}
	};
	
	this.init = function() {
		myFavoriteScreen.cleanPage();
		myFavoriteScreen.userFavList = getFav();
		myFavoriteScreen.createFav();
		myFavoriteScreen.show();
	};
	
	this.show = function() {
		myFavoriteScreen.favoriteScreen.style.display = "block";
		this.activeScreen = true;
	};
	
	this.hide = function() {
		myFavoriteScreen.favoriteScreen.style.display = "none";
		this.activeScreen = false;
	};
	
	this.validFavorite = function() {
		myDash.init();
		this.hide();
	};
	
	this.cleanPage = function() {
		emptyElem(this.favoriteScreen);
	};
	
	return this;
};