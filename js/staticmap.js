define([
        "dojo/_base/declare",
        "esri/config",
        "esri/geometry/webMercatorUtils"
    ],
    function(declare, esriConfig, webMercatorUtils) {
        return declare(null, {

            constructor: function(options){
                // specify class defaults
                options = options || {};

                this.printService = options.printService || "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"; // default seat geek range is 30mi

                that = this;
            },

            getImage: function(options) {
                var extentValue, xy, z, extents, webmap, format, layoutTemplate, f, params, p1, request;
                    options = options || {};

                esriConfig.defaults.io.corsEnabledServers.push("sampleserver6.arcgisonline.com");

                xy = webMercatorUtils.lngLatToXY(options.longitude, options.latitude);

                extents = [100, 200, 300, 400, 500, 1000,10000,24000,100000,250000,500000,750000,1000000,3000000,10000000];
                extentValue = extents[2];
                z = options.zoom || 5;
                if(typeof(z)==="number" && (z>0 && z < extents.length)){
                    extentValue = extents[z-1];
                }

                webmap = options.webmap || {
                    "mapOptions": {
                        "showAttribution": false,
                        "extent": {
                            "xmin": xy[0] - extentValue,
                            "ymin": xy[1] - extentValue,
                            "xmax": xy[0] + extentValue,
                            "ymax": xy[1] + extentValue,
                            "spatialReference": {
                                "wkid": 102100,
                                "latestWkid": 3857
                            }
                        },
                        "spatialReference": {
                            "wkid": 102100,
                            "latestWkid": 3857
                        }
                    },
                    "operationalLayers": [
                        {
                            "id": "Ocean",
                            "title": "Ocean",
                            "opacity": 1,
                            "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
                        }
                    ],
                    "exportOptions": {
                        "outputSize": [
                            300,
                            300
                        ],
                        "dpi": 96
                    }
                };

                if(options.size){
                    webmap.exportOptions.outputSize = options.size;
                }

                switch(options.basemap){
                    case 'satellite':
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
                        break;
                    case 'topo':
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
                        break;
                    case 'light-gray':
                        webmap.operationalLayers[0].url="http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer";
                        break;
                    case 'dark-gray':
                        webmap.operationalLayers[0].url="http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer";
                        break;
                    case 'streets':
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
                        break;
                    case 'hybrid':
                        webmap.operationalLayers[0].url="http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";
                        break;
                    case 'oceans':
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer";
                        break;
                    case 'national-geographic':
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer";
                        break;
                    case 'osm':
                        webmap.operationalLayers[0].url="http://a.tile.openstreetmap.org/";
                        break;
                    default:
                        webmap.operationalLayers[0].url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
                }

                format = options.format || "PNG32";

                layoutTemplate = options.layoutTemplate || "MAP_ONLY";
                f = options.f || "json";

                params = {
                    f: f,
                    format: format,
                    Layout_Template: layoutTemplate,
                    Web_Map_as_JSON: JSON.stringify(webmap)
                };

                if(that.msieversion()){
                    return {
                        then: function(callback){
                            // IE USING setTimeout
                            request = new XMLHttpRequest();
                            that.obj = null;
                            request.onreadystatechange = function()
                            {
                                if (request.readyState == 4 && request.status == 200)
                                {
                                    that.obj = JSON.parse(request.responseText);
                                }
                            };
                            request.open("POST", that.printService+'/execute', true);
                            request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                            request.send(that.parseParams(params));
                            that.returnIEImage(callback);
                        }
                    };
                }else{
                    // Chrome, Firefox, Safari, etc using promise
                    p1 = new Promise(function(resolve, reject){
                    request = new XMLHttpRequest();
                    request.onreadystatechange = function()
                    {
                        if (request.readyState == 4 && request.status == 200)
                        {
                            obj = JSON.parse(request.responseText);
                            resolve(obj.results[0].value.url);
                        }
                    };
                    request.open("POST", that.printService+'/execute', true);
                    request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                    request.send(that.parseParams(params));
                    });
                    return p1;
                }
            },

            returnIEImage: function(callback){
                if(that.obj!==null){
                    callback(that.obj.results[0].value.url);
                }else{
                    setTimeout(function(){
                        that.returnIEImage(callback);
                    },500);
                }
            },

            parseParams: function(obj){
                var pairs = [];

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        var k = encodeURIComponent(prop),
                            v = encodeURIComponent(obj[prop]);
                        pairs.push( k + "=" + v);
                    }
                }
                return pairs.join("&");
            },

            msieversion: function() {

                var ua = window.navigator.userAgent;
                var msie = ua.indexOf("MSIE ");

                if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
                    return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
                else                 // If another browser, return 0
                    return 0;
            }
        });
    }
);