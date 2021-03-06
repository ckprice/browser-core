/*
 * This module listens to the http traffic
 */

import utils from "core/utils";

var nsIAO = Components.interfaces.nsIHttpActivityObserver;
var nsIHttpChannel = Components.interfaces.nsIHttpChannel;

var CliqzRedirect = {
    activityDistributor: Components.classes["@mozilla.org/network/http-activity-distributor;1"]
        .getService(Components.interfaces.nsIHttpActivityDistributor),

    httpObserver: {
        // check the non 2xx page and report if this is one of the cliqz result
        observeActivity: function(aHttpChannel, aActivityType, aActivitySubtype, aTimestamp, aExtraSizeData, aExtraStringData) {
            if (nsIAO && aActivityType == nsIAO.ACTIVITY_TYPE_HTTP_TRANSACTION && aActivitySubtype == nsIAO.ACTIVITY_SUBTYPE_RESPONSE_HEADER) {
                var autocomplete = utils.autocomplete;
                var aChannel = aHttpChannel.QueryInterface(nsIHttpChannel);
                var res = {url: aChannel.URI.spec,
                           status: aExtraStringData.split(" ")[1]}
                if (Math.floor(res.status / 100) !=  2) {
                    // utils.log(JSON.stringify(res), "httpData")
                    // Now that we see a 404, let's compare to the cliqz results we provided
                    for (var i=0;
                        autocomplete.lastResult &&
                        i < autocomplete.lastResult._results.length;
                        i++) {
                        var r = autocomplete.lastResult._results[i];
                        if (res.url == r.val) {
                            var action = {
                                type: "performance",
                                action: "response",
                                response_code: res.status,
                                result_type: utils.encodeResultType(r.style || r.type),
                                v: 1
                            }
                            utils.telemetry(action);
                        }
                    }
                }
            }
        }
    },
    addHttpObserver: function() {
        CliqzRedirect.activityDistributor.addObserver(CliqzRedirect.httpObserver);
    },
    removeHttpObserver: function() {
        CliqzRedirect.activityDistributor.removeObserver(CliqzRedirect.httpObserver);
    },
    unload: function() {
        CliqzRedirect.removeHttpObserver();
    }
}

export default CliqzRedirect;
