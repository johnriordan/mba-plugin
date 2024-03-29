//
// MBA Plugin
// © 2015 Coteries SA
// Manuel Spuhler

/*global document, jQuery, window */

var WIDGET = {
    url: function (q) {
        "use strict";
        return [
            "https://extapi.local.ch/en/v3/entries/",
            "?lang=en",
            "&user=bea25809bdf6ad3d1a3db21a22a5ffd5ca7788cf",
            "&v=1.0",
            "&key=C6B416E282534FB69A125FD7FFCFA6E7",
            "&platform=unknown",
            "&limit=10",
            "&facets=category%2Ccity%3A20",
            "&q=" + q
        ].join("");
    },
    callbackUrl: "https://extapi.local.ch/en/0/tel/analytics",
    db: {
        views: [],
        offers: []
    },
    wording: {
        like: "<span style='color: red'>&#9829;</span> me on local.ch",
        it: {
            title: "Offerte speciali e novit&agrave;.",
            like: "Per le mie offerte",
            validity: "Valido fino a ",
            views: " visite"
        },
        de: {
            title: "Sonderangebote und Neuigkeiten.",
            like: "F&#252r meine Angebote",
            validity: "G&#252;ltig bis ",
            views: " Aufrufe"
        },
        fr: {
            title: "Offres sp&eacute;ciales et nouveaut&eacute;s.",
            like: "Pour mes offres",
            validity: "Valable jusqu'au ",
            views: " vues"
        }
    }
};

WIDGET.init = function (params) {
    "use strict";

    var elementId = params.elementId || "mba-widget",
        entryId = params.entryId,
        lang = params.lang || "de",
        font = params.font || null,
        backgroundColor = params.background || null,
        hasJumbotron = params.hasJumbotron || false,
        hasTitle = (params.hasTitle === false) ? false : true;

    if (!lang) {
        lang = window.navigator.userLanguage || window.navigator.language;
        lang = (lang === "de" || lang === "fr" || lang === "it") ? lang : "de";
    }

    WIDGET.controller.appendStyleWithFont(elementId, font, backgroundColor);
    WIDGET.controller.appendLib(function () {
        WIDGET.controller.process(elementId, WIDGET.url(entryId), hasJumbotron, entryId, lang, hasTitle);
    });
};

WIDGET.controller = {

    process: function (elementId, url, hasJumbotron, entryId, lang, hasTitle) {
        "use strict";

        function fixedEncodeURIComponent (str) {
          return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return "%" + c.charCodeAt(0).toString(16);
          });
        }

        jQuery.getJSON(url, function (data) {
            var items = [];
              jQuery.each( data.results, function (index, result) {
                jQuery.each( result.content_ads.mba_offers, function (offerIndex, offerObj) {

                    if (offerObj === undefined) {
                        return;
                    }

                    var offerUrl = ["http://i.local.ch/#d/", entryId, "/offer/", offerObj.id].join(""),
                        offer = {
                            offerId: offerObj.id,
                            name: result.title,
                            title: offerObj.title,
                            url: offerUrl,
                            description: offerObj.description,
                            image: offerObj.photo,
                            date: new Date(offerObj.expiry_ts * 1000),
                            views: offerObj.views_no
                        },
                        theDate = offer.date,
                            formattedDate = [
                            "0" + theDate.getDate(),
                            "0" + (theDate.getMonth() + 1),
                            theDate.getFullYear()
                        ].map(function(v) {
                            return (typeof v === "string") ? v.substr(v.length - 2) : v;
                        }),
                        html = "";
                    WIDGET.db.offers.push(offer);

                    html += "  <div data-offer-id='" + offer.offerId + "' class='mba-offer' id='mba-offer-" + offerIndex + "'>";
                    html += "    <div class='crop'>";
                    html += "      <img src='" + offer.image + "' />";
                    html += "    </div>";
                    html += "    <h4>" + offer.title + "</h4>";
                    html += offer.description ? "<p>" + offer.description + "</p>" : "";
                    html += "    <p>" + WIDGET.wording[lang].validity + formattedDate.join(".") + ", " + offer.views + WIDGET.wording[lang].views +" </p>";
                    html += "    <ul class='mba-share' data-offer-index=" + offerIndex + ">";
                    html += "      <li class='link1' title='Mail - share'>";
                    html += "        <a class='mail-share' href='javascript: void(0);'></a>";
                    html += "      </li>";
                    html += "      <li class='link2' title='Twitter - share'>";
                    html += "        <a class='tw-share' href='javascript: void(0);'></a>";
                    html += "      </li>";
                    html += "      <li class='link3' title='Facebook - share'>";
                    html += "        <a class='fb-share' href='javascript: void(0);'></a>";
                    html += "      </li>";
                    html += "     </ul>";
                    html += "  </div>";

                    items.push(html);
                });
            });

            var root = hasTitle ? "<h3>" + WIDGET.wording[lang].title + "</h3>" : "";
            root += "<div class='mba-offer-wrapper'>";
            root += items.join("");
            root += "</div>";

            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)) {
                var link = "https://i.local.ch/#d/" + entryId + "/follow",
                    header = WIDGET.wording.like,
                    text = WIDGET.wording[lang].like;
                // TODO brbr
                root += "<br /><br /><p class='favs'><strong><a href='" + link + "'>" + header + "<br />" + text + "</a></strong></p>";
            }

            var rootElement = jQuery("#" + elementId);
            rootElement.append(root);

            if (hasJumbotron) {
                var offerElement = jQuery("#" + elementId +" .mba-offer").first(),
                    offerId = offerElement.data("offer-id");
                offerElement.addClass("selected");
                WIDGET.controller.markOfferAsViewed(offerId);
            }

            jQuery(".mba-offer").on("click", function (event) {
                event.stopPropagation();
                var isSelected = jQuery(this).hasClass("selected");
                jQuery(".mba-offer").removeClass("selected");

                if (!(isSelected)) {
                    jQuery(this).addClass("selected");
                    var theofferId = jQuery(this).data("offer-id");
                    WIDGET.controller.markOfferAsViewed(theofferId);
                }
                event.stopImmediatePropagation();
            });

            function offerFromEvent (event) {
                var element = jQuery(event.target.parentElement.parentElement),
                    offerIndex = parseInt(element.data("offer-index"));
                return WIDGET.db.offers[offerIndex];
            }

            jQuery(".mba-share .tw-share").on("click", function (event) {
                event.stopPropagation();
                var offer = offerFromEvent(event),
                    body = fixedEncodeURIComponent(offer.name + ": " + offer.title + ",  " + offer.description),
                    twURL = "https://twitter.com/intent/tweet?url=" + fixedEncodeURIComponent(offer.url) + "&text=" + body;
                WIDGET.controller.openWindow(twURL);
            });

            jQuery(".mba-share .fb-share").on("click", function (event) {
                event.stopPropagation();
                var offer = offerFromEvent(event),
                    fbURL = "http://www.facebook.com/sharer.php?u=" + fixedEncodeURIComponent(offer.url);
                WIDGET.controller.openWindow(fbURL);
            });

            jQuery(".mba-share .mail-share").on("click", function (event) {
                event.stopPropagation();
                var offer = offerFromEvent(event),
                    subject = fixedEncodeURIComponent(offer.name + ": " + offer.title),
                    body = fixedEncodeURIComponent(offer.description + "\n" + (offer.url ? offer.url : "") ),
                    uri = "mailto:?subject=" + subject + "&body=" + body;
                window.location.href = uri;
            });

        });
    },

    markOfferAsViewed: function (offerId){
        "use strict";
        var data = {
                category: "MBA_OFFER",
                action: "view",
                ts: 1432714809,
                value: offerId
            },
            views = WIDGET.db.views;

        if (jQuery.inArray(offerId, views) === -1) {
            views.push(offerId);
            jQuery.post(WIDGET.callbackUrl, data);
        }
    },

    openWindow: function (url) {
        "use strict";
        var winHeight = 350,
            winWidth = 520,
            winTop = (window.screen.height / 2) - (winHeight / 2),
            winLeft = (window.screen.width / 2) - (winWidth / 2);
        window.open(url, "share", "top=" + winTop + ",left=" + winLeft + ",toolbar=0,status=0,width=" + winWidth + ",height=" + winHeight);
    },

    appendLib: function (callback) {
        // check for min version $.fn.jquery
        // change scope var $jq = jQuery.noConflict(true);
        // TODO check for a smaller lib?
        "use strict";
        if (typeof jQuery !== undefined) {
            var head = document.head || document.getElementsByTagName("head")[0],
                script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = callback;
            script.src = "//code.jquery.com/jquery-2.1.4.min.js";
            head.appendChild(script);
        }
    },

    appendStyleWithFont: function (element, fontFamily, backgroundColor) {
        "use strict";
        var head = document.head || document.getElementsByTagName("head")[0],
            link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        // link.setAttribute("href", "mba-style.css");
        link.setAttribute("href", "//www.coteries.com/local.ch/MBAPlugin/mba-style.css");
        head.appendChild(link);

        var elementId = "#" + element;
        var css = elementId + " {margin: 0 0 1em 0; padding: 0; margin-bottom: 1em}";
        css += fontFamily ? elementId + " {font-family: " + fontFamily + "}" : "";
        css += backgroundColor ? elementId + " .mba-offer {background-color: " + backgroundColor + "}" : "";

        var style = document.createElement("style");
        style.type = "text/css";
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);
    }
};
