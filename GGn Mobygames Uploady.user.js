// ==UserScript==
// @name         GGn Mobygames Uploady
// @namespace    https://orbitalzero.ovh/scripts
// @version      0.33.2
// @include      https://gazellegames.net/upload.php
// @include      https://gazellegames.net/torrents.php?action=editgroup*
// @include      https://www.mobygames.com/*
// @include      http://www.mobygames.com/*
// @description  Uploady for mobygames
// @author       NeutronNoir, ZeDoCaixao
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant		 GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript==

//code from https://greasyfork.org/scripts/23948-html2bbcode/code/HTML2BBCode.js
function html2bb(str) {
    if(typeof str === "undefined") return "";
    str = str.replace(/< *br *\/*>/g, "\n");
    str = str.replace(/< *u *>/g, "[u]");
    str = str.replace(/< *\/ *u *>/g, "[/u]");
    str = str.replace(/< *\/ *li *>/g, "");
    str = str.replace(/< *\/ *p *>/g, "\n\n");
    str = str.replace(/< * *p *>/g, "");
    str = str.replace(/< *\/ *em *>/g, "[/i]");
    str = str.replace(/< * *em *>/g, "[i]");
    str = str.replace(/< *li *>/g, "[*]");
    str = str.replace(/< *\/ *ul *>/g, "");
    str = str.replace(/< *ul *class=\\*\"bb_ul\\*\" *>/g, "");
    str = str.replace(/< *h2 *class=\"bb_tag\" *>/g, "[u]");
    str = str.replace(/< *\/ *h2 *>/g, "[/u]");
    str = str.replace(/< *strong *>/g, "[b]");
    str = str.replace(/< *\/ *strong *>/g, "[/b]");
    str = str.replace(/< *i *>/g, "[i]");
    str = str.replace(/< *\/ *i *>/g, "[/i]");
    str = str.replace(/\&quot;/g, "\"");
    str = str.replace(/< *img *src="([^"]*)" *>/g, "[img]$1[/img]");
    str = str.replace(/< *b *>/g, "[b]");
    str = str.replace(/< *\/ *b *>/g, "[/b]");
    str = str.replace(/< *a [^>]*>/g, "");
    str = str.replace(/< *\/ *a *>/g, "");
    str = str.replace(/< *cite *>/, "[i]")
    str = str.replace(/< *\/cite *>/, "[/i]")
    //Yeah, all these damn stars. Because people put spaces where they shouldn't.
    return str;
}

try {
    init();
} catch (err) {
    console.log(err);
}

function init() {
    var mobygames = JSON.parse(GM_getValue("mobygames") || "{}");
	GM_setValue("mobygames", JSON.stringify(mobygames));

	if (window.location.hostname == "gazellegames.net") {
        if (window.location.pathname == '/upload.php') {
			add_search_buttons();
		}
		else if (window.location.pathname == '/torrents.php' && /action=editgroup/.test(window.location.search)) {
			add_search_buttons_alt();
        }
	}
	else if (window.location.hostname == "www.mobygames.com") {
		add_validate_button();
	}

	GM_addStyle(button_css());
}

function add_search_buttons() {
	$("input[name='title']").after('<input id="moby_uploady_Search" type="button" value="Search MobyGames"/>');
    $("#moby_uploady_Search").click(function() {
		var title = encodeURIComponent($("#title").val());

        window.open("https://www.mobygames.com/search/quick?q=" + title, '_blank');	//For every platform

		var mobygames = {};

		GM_setValue("mobygames", JSON.stringify(mobygames));
    });

	//need to add a button to fill the inputs and stop gathering links
	$("#moby_uploady_Search").after('<input id="moby_uploady_Validate" type="button" value="Validate MobyGames"/>');
	$("#moby_uploady_Validate").click( function () {
		var mobygames = JSON.parse(GM_getValue("mobygames") || "{}");

        $("#aliases").val(mobygames.alternate_titles);
        $("#title").val(mobygames.title);
        $("#tags").val(mobygames.tags);
        $("#year").val(mobygames.year);
        $("#image").val(mobygames.cover);
        $("#album_desc").val(mobygames.description);

        var add_screen = $("a:contains('+')");
        mobygames.screenshots.forEach(function(screenshot, index) {
			if (index >= 16) return;															//The site doesn't accept more than 16 screenshots
			if (index >= 3) add_screen.click();												//There's 3 screenshot boxes by default. If we need to add more, we do as if the user clicked on the "[+]" (for reasons mentioned above)
            $("[name='screens[]']").eq(index).val(screenshot);											//Finally store the screenshot link in the right screen field.
		});

        $("#platform").val(mobygames.platform);

		GM_deleteValue("mobygames");
	});
}

function add_search_buttons_alt() {
	$("input[name='name']").after('<input id="moby_uploady_Search" type="button" value="Search MobyGames"/>');
    $("#moby_uploady_Search").click(function() {
		var title = encodeURIComponent($("[name='name']").val());

        window.open("https://www.mobygames.com/search/quick?q=" + title, '_blank');	//For every platform

		var mobygames = {};

		GM_setValue("mobygames", JSON.stringify(mobygames));
    });

	//need to add a button to fill the inputs and stop gathering links
	$("#moby_uploady_Search").after('<input id="moby_uploady_Validate" type="button" value="Validate MobyGames"/>');
	$("#moby_uploady_Validate").click( function () {
		var mobygames = JSON.parse(GM_getValue("mobygames") || "{}");

        $("input[name='image']").val(mobygames.cover);

        var add_screen = $("a:contains('+')");
        mobygames.screenshots.forEach(function(screenshot, index) {
			if (index >= 16) return;															//The site doesn't accept more than 16 screenshots
			if (index >= 3) add_screen.click();												//There's 3 screenshot boxes by default. If we need to add more, we do as if the user clicked on the "[+]" (for reasons mentioned above)
            $("[name='screens[]']").eq(index).val(screenshot);											//Finally store the screenshot link in the right screen field.
		});

		GM_deleteValue("mobygames");
	});
}

function get_covers(platformSlug){
    return new Promise( (resolve, reject) => {

        GM_xmlhttpRequest({
            method: "GET",
            url: document.URL+"/covers/" + platformSlug,
            onload: (data) => {

                let imageUrl = $(data.responseText).find("figcaption:contains('Front'):first").prev().attr("href")
                resolve(new Promise(
                                 (resolve, reject) => {
                                     GM_xmlhttpRequest({
                                         method: "GET",
                                         url: imageUrl,
                                         onload: (data) => {
                                             let image = $(data.responseText).find("figure img").attr("src");
                                             resolve(image)
                                         },
                                         onerror: (error) => {
                                             resolve(false)
                                         }
                                     })
                                 }
                             ))
            },
            onerror: (error) => {
               throw error;
            }
        })

    })
}

function get_cover() {
    return new Promise( function (resolve, reject) {
                       GM_xmlhttpRequest({
                           method: "GET",
                           url: $("#cover").attr("href"),
                           onload: function(data) {
                               let cover = "";
                               cover = $(data.responseText).find("img[src*='covers']").attr("src");
                               if (cover.indexOf("http") == -1) cover = "https://" + window.location.hostname + cover;
                               resolve(cover);
                           },
                           onerror: function(error) {
                               throw error;
                           }
                       });
    });
}

function get_screenshots(platformSlug) {
    
    return new Promise( function (resolve, reject) {
        GM_xmlhttpRequest({
            method: "GET",
            url: document.URL+"/screenshots/" + platformSlug,
            onload: function(data) {
                let nbr_screenshots = 0;
                resolve(Promise.all($(data.responseText).find("#main .img-holder a").map( function() {
                    let image_url = $(this).attr("href");

                    if (image_url.includes("screenshots") && nbr_screenshots < 16) {
                        nbr_screenshots++;
                        return new Promise (function (resolve, reject) {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: image_url,
                                onload: function(data) {
                                    console.log(image_url)
                                    var screen = $(data.responseText).find("figure img").attr("src");
                                    if (screen.indexOf("http") == -1) screen = "https://" + window.location.hostname + screen;
                                    resolve(screen);
                                },
                                onerror: function(error) {
                                    throw error;
                                }
                            });
                        }); 
                    }
                })));
            },
            onerror: function(error) {
                throw error;
            }
        });
    });
}

function validate(platformSlug){
		var mobygames = JSON.parse(GM_getValue("mobygames") || "{}");
        if (typeof mobygames == "string") mobygames = JSON.parse(mobygames);//Fix for a weird bug happening on http://www.arkane-studios.com/uk/arx.php, transforming the array of strings into a string

        get_covers(platformSlug).then((covers) => {
            if (!covers) {
                //alert("There's no covers for platform: " + platformSlug + ", using default cover.")
                //get_cover().then(function (cover) {
                //    mobygames.cover = cover;
                //}).catch(function (err) {
                //    throw err;
                //});
            }else{
                mobygames.cover = covers;
            }
        }).catch((err) => {
            throw err
        })


        get_screenshots(platformSlug).then(function(screenshots) {
            if (screenshots.length == 0){
                alert("There's no screenshots for platorm: "+ platformSlug)
            }
            mobygames.screenshots = screenshots;
        
            GM_setValue("mobygames", JSON.stringify(mobygames));
            
            
        }).catch(function (err) {
            throw err;
        });

        mobygames.description = "[align=center][b][u]About the game[/u][/b][/align]\n" + html2bb($("#description-text").html().replace(/[\n]*/g, "").replace(/.*<h2>Description<\/h2>/g, "").replace(/<div.*/g, "").replace(/< *br *>/g, "\n"));//YOU SHOULD NOT DO THIS AT HOME

        var alternate_titles = [];
        $(".text-sm.text-normal.text-muted:contains('aka')").find("span u").each( function() {
            alternate_titles.push($(this).text().replace(/[^"]*"([^"]*)".*/g, "$1"));
        });
        mobygames.alternate_titles = alternate_titles.join(", ");

        var date_array = $("dt:contains('Released')").next().text().trim().split("on")[0].trim().match(/[0-9]{4}/)
        mobygames.year = date_array

        var tags_array = []

        $("dt:contains('Genre')").next().find("a").each((o, obj) => {
            let arr = $(obj).text().split("/")

            arr.forEach(t => {
                tags_array.push(t)
            })

        })

        $("dt:contains('Setting')").next().find("a").each((o, obj) => {
            let arr = $(obj).text().split("/")

            arr.forEach(t => {
                tags_array.push(t)
            })

        })

        $("dt:contains('Gameplay')").next().find("a").each((o, obj) => {
             let arr = $(obj).text().split("/")

            arr.forEach(t => {
                tags_array.push(t)
            })

        })

        //$("#coreGameGenre div:contains('Genre')").next().text().split(/[\/,]/);
        //tags_array = tags_array.concat($("#coreGameGenre div:contains('Setting')").next().text().split(/[\/,]/));
        //tags_array = tags_array.concat($("#coreGameGenre div:contains('Gameplay')").next().text().split(/[\/,]/));

        var trimmed_tags_array = [];
        tags_array.forEach(function (tag) {
            if (tag.trim().toLowerCase().replace(" ", ".") !== "") {
                tag = tag.trim().toLowerCase().replace(/[  -]/g, ".").replace(/[\(\)]/g, '');
                if (tag == "role.playing.rpg") tag = "role.playing.game";
                if (tag == "sci.fi") tag = "science.fiction";
                trimmed_tags_array.push(tag);
            }
        });
        mobygames.tags = trimmed_tags_array.join(", ");

        mobygames.title = $("h1").text().trim();

        mobygames.platform = "";
        var platform = platformSlug
        switch (platform) {
            case "macintosh":
                mobygames.platform = "Mac";
                break;
            case "apple2":
                mobygames.platform = "Apple II"
                break
            case "iphone":
            case "ipad":
                mobygames.platform = "iOS";
                break;
            case "pippin":
                mobygames.platform = "Apple Bandai Pippin"
                break
            case "android":
                mobygames.platform = "Android";
                break;
            case "dos":
                mobygames.platform = "DOS";
                break;
            case "windows":
                mobygames.platform = "Windows";
                break;
            case "xbox":
                mobygames.platform = "Xbox";
                break;
            case "xbox360":
                mobygames.platform = "Xbox 360";
                break;
            case "gameboy":
                mobygames.platform = "Game Boy";
                break;
            case "gameboy-advance":
                mobygames.platform = "Game Boy Advance";
                break;
            case "gameboy-color":
                mobygames.platform = "Game Boy Color";
                break;
            case "nes":
                mobygames.platform = "NES";
                break;
            case "n64":
                mobygames.platform = "Nintendo 64";
                break;
            case "3ds":
                mobygames.platform = "Nintendo 3DS";
                break;
            case "new-nintendo-3ds":
                mobygames.platform = "New Nintendo 3DS"
                break
            case "nintendo-ds":
                mobygames.platform = "Nintendo DS";
                break;
            case "gamecube":
                mobygames.platform = "Nintendo GameCube";
                break;
            case "pokemon-mini":
                mobygames.platform = "Pokemon Mini"
                break
            case "snes":
                mobygames.platform = "SNES";
                break;
            case "switch":
                mobygames.platform = "Switch"
                break
            case "virtual-boy":
                mobygames.platform = "Virtual Boy"
                break
            case "wii":
                mobygames.platform = "Wii";
                break;
            case "wii-u":
                mobygames.platform = "Wii U";
                break;
            case "playstation":
                mobygames.platform = "PlayStation 1";
                break;
            case "ps2":
                mobygames.platform = "PlayStation 2";
                break;
            case "ps3":
                mobygames.platform = "PlayStation 3";
                break;
            case "playstation-4":
                mobygames.platform = "PlayStation 4";
                break
            case "psp":
                mobygames.platform = "PlayStation Portable";
                break;
            case "ps-vita":
                mobygames.platform = "PlayStation Vita";
                break;
            case "dreamcast":
                mobygames.platform = "Dreamcast";
                break;
            case "game-gear":
                mobygames.platform = "Game Gear";
                break;
            case "sega-master-system":
                mobygames.platform = "Master System";
                break;
            case "genesis":
                mobygames.platform = "Mega Drive";
                break;
            case "sega-pico":
                mobygames.platform = "Pico"
                break
            case "sg-1000":
                mobygames.platform = "SG-1000"
                break
            case "sega-saturn":
                mobygames.platform = "Saturn";
                break;
            case "atari-2600":
                mobygames.platform = "Atari 2600";
                break;
            case "atari-5200":
                mobygames.platform = "Atari 5200";
                break;
            case "atari-7800":
                mobygames.platform = "Atari 7800";
                break;
            case "jaguar":
                mobygames.platform = "Atari Jaguar";
                break;
            case "lynx":
                mobygames.platform = "Atari Lynx";
                break;
            case "atari-st":
                mobygames.platform = "Atari ST";
                break;
            case "cpc":
                mobygames.platform = "Amstrad CPC";
                break;
            case "zx-spectrum":
                mobygames.platform = "ZX Spectrum";
                break;
            case "msx":
                mobygames.platform = "MSX";
                break;
            case "3do":
                mobygames.platform = "3DO";
                break;
            case "wonderswan":
                mobygames.platform = "Bandai WonderSwan";
                break;
            case "wonderswan-color":
                mobygames.platform = "Bandai WonderSwan Color"
                break
            case "colecovision":
                mobygames.platform = "Colecovision";
                break;
            case "c64":
                mobygames.platform = "Commodore 64";
                break;
            case "c128":
                mobygames.platform = "Commodore 128"
                break
            case "amiga-cd32":
                mobygames.platform = "Amiga CD32"
                break
            case "amiga":
                mobygames.platform = "Commodore Amiga";
                break;
            case "commodore-16-plus4":
                mobygames.platform = "Commodore Plus-4";
                break;
            case "vic-20":
                mobygames.platform = "Commodore VIC-20"
                break
            case "pc98":
                mobygames.platform = "NEC PC-98"
                break
            case "supergrafx":
                mobygames.platform = "NEC SuperGrafx"
                break
            case "game-com":
                mobygames.platform = "Game.com"
                break
            case "gizmondo":
                mobygames.platform = "Gizmondo"
                break
            case "vsmile":
                mobygames.platform = "V.Smile"
                break
            case "creativision":
                mobygames.platform = "CreatiVision"
                break
            case "linux":
                mobygames.platform = "Linux";
                break;
            case "odyssey-2":
                mobygames.platform = "Magnavox-Phillips Odyssey";
                break;
            case "intellivision":
                mobygames.platform = "Mattel Intellivision";
                break;
            case "pc-fx":
                mobygames.platform = "NEC PC-FX";
                break;
            case "turbo-grafx":
                mobygames.platform = "NEC TurboGrafx-16";
                break;
            case "ngage":
                mobygames.platform = "Nokia N-Gage";
                break;
            case "ouya":
                mobygames.platform = "Ouya";
                break;
            case "sharp-x1":
                mobygames.platform = "Sharp X1";
                break;
            case "sharp-x68000":
                mobygames.platform = "Sharp X68000";
                break;
            case "neo-geo":
                mobygames.platform = "SNK Neo Geo";
                break;
            case "oric":
                mobygames.platform = "Tangerine Oric";
                break;
            case "thomson-mo":
                mobygames.platform = "Thomson MO5";
                break;
            case "supervision":
                mobygames.platform = "Watara Supervision";
                break;
            case "casio-loopy":
                mobygames.platform = "Casio Loopy"
                break
            case "casio-pv-1000":
                mobygames.platform = "Casio PV-1000"
                break
            case "arcadia-2001":
                mobygames.platform = "Emerson Arcadia 2001"
                break
            case "adventure-vision":
                mobygames.platform = "Entex Adventure Vision"
                break
            case "epoch-super-cassette-vision":
                mobygames.platform = "Epoch Super Casette Vision"
                break
            case "channel-f":
                mobygames.platform = "Fairchild Channel F"
                break
            case "super-acan":
                mobygames.platform = "Funtech Super Acan"
                break
            case "gp32":
                mobygames.platform = "GamePark GP32"
                break
            case "vectrex":
                mobygames.platform = "General Computer Vectrex"
                break
            case "dvd-player":
            case "hd-dvd-player":
                mobygames.platform = "Interactive DVD"
                break
            // Hartung Game Master not in mobygames
            case "odyssey":
                mobygames.platform = "Magnavox-Phillips Odyssey"
                break
            case "memotech-mtx":
                mobygames.platform = "Memotech MTX"
                break
            case "sam-coupe":
                mobygames.platform = "Miles Gordon Sam Coupe"
                break
            case "oculus-quest":
                mobygames.platform =  "Oculus Quest"
                break
            case "videopac-g7400":
                mobygames.platform = "Philips Videopac+"
                break
            case "cd-i":
                mobygames.platform = "Philips CD-i"
                break
            case "rca-studio-ii":
                mobygames.platform = "RCA Studio II"
                break
            case "sharp-x1":
                mobygames.platform = "Sharp X1"
                break
            case "sharp-x68000":
                mobygames.platform = "Sharp X68000"
                break
            case "neo-geo-pocket":
                mobygames.platform = "SNK Neo Geo Pocket"
                break
            case "oric":
                mobygames.platform = "Tangerine Oric"
                break
            case "thomson-mo":
                mobygames.platform = "Thomson MO5"
                break
            case "supervision":
                mobygames.platform = "Watara Supervision"
                break
            default:
                mobygames.platform = "Retro - Other";
                break;
        }

        alert("Uploady done !");
}

function add_validate_button() {
	if (typeof console != "undefined" && typeof console.log != "undefined") console.log("Adding button to window");
    // Get all platforms available
    let platforms = []
    $("dt:contains('Releases by Date')").next().find("ul li").each((i, platform) => {
        let platformAnchor = $(platform).find("span a")
        let platformUrl = $(platformAnchor).attr("href")
        let platformSlug = platformUrl.replace(/\/platform\/(.+)\//, "$1")

        let platformJson = {

            name: $(platformAnchor).text(),
            slug: platformSlug
        }

        platforms.push(
            platformJson
        )
    })

    // Add a button per platform to the page
    platforms.forEach((platform, i) => {
        console.log(platform, "|", i)
        $("body").prepend('<input type="button" style="top:' + i * 50 +'px" platform="' + platform.slug + '" class="platform" value="'+ platform.name + '"/>')
    })

    // If there's only one platform we add a default button
    if(platforms.length == 0){
        let platformAnchor = $("dt:contains('Released')").next().find("a:last")
        let platformUrl = $(platformAnchor).attr("href")
        let platformSlug = platformUrl.replace(/\/platform\/(.+)\//, "$1")

        $("body").prepend('<input type="button" style="top:' + 0 +'px" platform="' + platformSlug + '" class="platform" value="'+ platformSlug + '"/>')
    }

    // Adding click event to every button
	$(".platform").click( function() {
        validate($(this).attr("platform"))
    });
}

function button_css (index) {
	return "input.platform {\
                position: fixed;\
                left: 0;\
                z-index: 999999;\
                cursor: pointer;\
                height: auto;\
                width: auto;\
                padding: 10px;\
                background-color: lightblue;\
            }";
}
