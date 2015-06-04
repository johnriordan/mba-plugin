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
            "&tid=v1_130811_1376258400000_bea25809bdf6ad3d1a3db21a22a5ffd5ca7788cf_a80a_95a1",
            "&v=1.0",
            "&key=F1AD7B165AA149A2AE60374847902A12",
            "&platform=unknown",
            "&limit=10",
            "&facets=category%2Ccity%3A20",
            "&q=" + q,
            "&rid=m0edm"
        ].join("");
    },
    callbackUrl: function () {
        "use strict";
        return [
            "https://extapi.local.ch/en/0/tel/analytics"
        ].join("");
    },
    db: {
        views: [],
        offers: []
    }
};

WIDGET.init = function () {
    "use strict";
    var scriptPram = document.getElementById("mba-widget");
    var q = scriptPram.getAttribute("data-q");
    var hasJumbotron = scriptPram.getAttribute("data-jumbotron") === "true" || false;

    WIDGET.controller.appendStyle();
    WIDGET.controller.appendLib(function () {
        WIDGET.controller.process(WIDGET.url(q), hasJumbotron);
    });
};

document.body.onload = WIDGET.init;

WIDGET.controller = {

    process: function (url, hasJumbotron) {
        "use strict";

        function fixedEncodeURIComponent (str) {
          return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return "%" + c.charCodeAt(0).toString(16);
          });
        }

        jQuery("#mba-widget").before("<div id='mba-widget-id'></div>");
        jQuery.getJSON(url, function (data) {
            var items = [];
              jQuery.each( data.results, function (index, result) {
                jQuery.each( result.content_ads.mba_offers, function (offerIndex, offerObj) {

                    if (offerObj === undefined) {
                        return;
                    }

                    var offerUrl = result.content_ads && result.content_ads.logo && result.content_ads.logo.url || null,
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
                    html += "      <img width='120px' src='" + offer.image + "' />";
                    html += "    </div>";
                    html += "    <h4>" + offer.title + "</h4>";
                    html += offer.description ? "<p>" + offer.description + "</p>" : "";
                    html += "    <p>G&#252;ltig bis: " + formattedDate.join(".") + ", " + offer.views + " Aufrufe</p>";
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

            var root = "<h3>Sonderangebote und Neuigkeiten</h3>";
            root += "<div id='mba-offer-wrapper'>";
            root += items.join("");
            root += "</div>";

            jQuery("#mba-widget-id").append(root);

            if (hasJumbotron) {
                var offerElement = jQuery(".mba-offer").first();
                offerElement.addClass("selected");
                var offerId = offerElement.data("offer-id");
                WIDGET.controller.markOfferAsViewed(offerId);
            }

            jQuery(".mba-offer").on("click", function () {
                var isSelected = jQuery(this).hasClass("selected");
                jQuery(".mba-offer").removeClass("selected");

                if (!(isSelected)) {
                    jQuery(this).addClass("selected");
                    var theofferId = jQuery(this).data("offer-id");
                    WIDGET.controller.markOfferAsViewed(theofferId);
                }
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
                    twURL = "https://twitter.com/intent/tweet?url=" + offer.url + "&text=" + body;
                WIDGET.controller.openWindow(twURL);
            });

            jQuery(".mba-share .fb-share").on("click", function (event) {
                event.stopPropagation();
                var offer = offerFromEvent(event);
                var fbURL = "http://www.facebook.com/sharer.php?u=" + offer.url;
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
        };
        var views = WIDGET.db.views;
        if (jQuery.inArray(offerId, views) === -1) {
            views.push(offerId);
            // jQuery.post(WIDGET.callbackUrl(), data);
        }
    },

    openWindow: function (url) {
        "use strict";
        var winHeight = 350, winWidth = 520;
        var winTop = (window.screen.height / 2) - (winHeight / 2);
        var winLeft = (window.screen.width / 2) - (winWidth / 2);
        window.open(url, "share", "top=" + winTop + ",left=" + winLeft + ",toolbar=0,status=0,width=" + winWidth + ",height=" + winHeight);
    },

    appendLib: function (callback) {
        // check for min version $.fn.jquery
        // change scope var $jq = jQuery.noConflict(true);
        // TODO check for a smaller lib?
        "use strict";
        if (typeof jQuery !== undefined) {
            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = callback;
            script.src = "//code.jquery.com/jquery-2.1.4.min.js";
            head.appendChild(script);
        }
    },

    appendStyle: function () {
        "use strict";
        var head = document.getElementsByTagName("head")[0];
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", "mba-style.css");
        head.appendChild(link);
    }
};
