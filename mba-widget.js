//
// MBA Plugin
// © 2015 Coteries SA
// Manuel Spuhler

/*global console, document, $ */

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
            "https://extapi.local.ch/en/0/tel/analytics",
            "?lang=en",
            "&user=bea25809bdf6ad3d1a3db21a22a5ffd5ca7788cf",
            "&tid=v1_130811_1376258400000_bea25809bdf6ad3d1a3db21a22a5ffd5ca7788cf_a80a_928f",
            "&v=1.0",
            "&key=F1AD7B165AA149A2AE60374847902A12",
            "&platform=unknown"
        ].join("");
    }
};

WIDGET.init = function () {
    "use strict";
    console.log("init");

    var scriptPram = document.getElementById("mba-widget");
    var q = scriptPram.getAttribute("data-q");

    WIDGET.controller.appendStyle();
    WIDGET.controller.appendLib(function () {
        console.log("callback");
        WIDGET.controller.process(WIDGET.url(q));
    });
};

document.body.onload = WIDGET.init;

WIDGET.controller = {

    process: function (url) {
        "use strict";
        $("#mba-widget").before("<div id='mba-widget-id'></div>");
        $.getJSON(url, function (data) {
            var items = [];
          $.each( data.results, function (key, result) {
            $.each( result.content_ads.mba_offers, function (offerKey, offerObj) {
                if (offerObj === undefined) {
                    return;
                }

                var offer = {
                        name: result.title,
                        // website: result.
                        title: offerObj.title,
                        description: offerObj.description,
                        image: offerObj.photo,
                        date: new Date(offerObj.expiry_ts * 1000),
                        views: offerObj.views_no
                };

                var theDate = offer.date;
                var formattedDate = [
                    "0" + theDate.getDate(),
                    "0" + (theDate.getMonth() + 1),
                    theDate.getFullYear()
                ].map(function(v) {
                    return (typeof v === "string") ? v.substr(v.length - 2) : v;
                });

                var html = "";
                html += "<div class='mba-offer' id='" + offerKey + "'>";
                html += "  <img width='120px' src='" + offer.image + "' />";
                html += "  <p>" + offer.title + "</p>";
                html += offer.description ? "<p>" + offer.description + "</p>" : "";
                html += "  <p>Gültig bis: " + formattedDate.join(".");
                html += ", " + offer.views + " Aufrufe";
                html += "  </p>";

                var subject = offer.name + ": " + offer.title;

                html += "  <ul id='mba-share'>";
                html += "    <li class='link1'><a href='mailto:?subject=" + subject + "&body=" + offer.description + "'></a></li>";
                html += "    <li class='link2'><a href='#'></a></li>";
                html += "    <li class='link3' title='Facebook - share'><a href='http://www.facebook.com/sharer.php?u=http://www.casaferlin.ch' target='_blank'></a></li>";
                html += "  </ul>";

                html += "</div>";
                items.push(html);
            });
          });

          $("#mba-widget-id").append("<h3>Sonderangebote und Neuigkeiten</h3>");
          $("#mba-widget-id").append(items.join(""));

          // TODO add this to the loop
          // $(".mba-offer").click(function (e) {
          //   console.log("clicked");
          //   e.preventDefault();
          //   var imageHref = $(this).find("img").attr("src");


          //   if ($("#lightbox").length > 0) { // #lightbox exists
          //       $("#content").html("<img src='" + imageHref + "' />");
          //       $("#lightbox").show();
          //   } else { // create lightbox
          //       var lightbox =
          //           "<div id='lightbox'>" +
          //               "<p>Click to close</p>" +
          //               "<div id='content'>" +
          //                   "<h2>Title</h2>" + 
          //                   "<img src='" + imageHref + "' />" +
          //                   "<div style='margin-top: 25px'>" +
          //                   "<p>Lots of informations</p>" +
          //                   "<p>Lots of informations</p>" +
          //                   "<p>Lots of informations</p>" +
          //                   "<p>Lots of informations</p>" +
          //                   "</div>" +
          //               "</div>" +
          //           "</div>";

          //       $("body").append(lightbox);

          //       $("#lightbox").on("click", function() {
          //           $("#lightbox").hide();
          //       });
          //   }
          // });

        });

        // httpRequest = new XMLHttpRequest(); // TODO ie
        // httpRequest.open('GET', url);
        // httpRequest.onreadystatechange = function () {
        //  if (httpRequest.readyState === 4) {
     //             if (httpRequest.status === 200) {
     //             WIDGET.controller.parse(httpRequest.responseText);
     //             } else {
     //             // TODO
     //             }
     //     }
        // };
        // httpRequest.send();
    },

    // parse: function(responseText) {
    //  var obj = JSON.parse(responseText);  // TODO json2.js
    //  var results = obj['results'];
    //  var offers = [];

    //  var count = results.length;
    //  for (var i = 0; i < count; i++) {
    //      var result = results[i];
    //      var offer = {
    //          title: result['title'],
    //          imageURL: result['icons']['primary']
    //      };
    //      WIDGET.controller.createElement(offer);
    //  }
    // },

    // createElement: function(data) {
    //  var newElement = document.createElement('div');
    //  newElement.className = 'mba-offer';
    //  var title = document.createTextNode(data.title);
    //  var img = document.createElement('img');
    //  img.src = data.imageURL;
    //  var link = document.createElement('a');

    //  newElement.appendChild(img);
    //  newElement.appendChild(title);
    //  var element = document.getElementById('mba-widget');
    //  element.appendChild(newElement);
    // },

    popupElement: function () {
        "use strict";
    },

    appendLib: function (callback) {
        // TODO Check for jQuery before
        // TODO check for a smaller lib?
        "use strict";
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.onload = callback;
        script.src = "//code.jquery.com/jquery-2.1.4.min.js";
        head.appendChild(script);
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
