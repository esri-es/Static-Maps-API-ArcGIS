# Static Maps API - ArcGIS

This class allow you to add static images using a print service. By default ArcGIS Online service is used but you can also add an ArcGIS Server service.

```javascript
require([
    "esriES/staticmap",
    "dojo/domReady!"
], function(StaticMap) {
    staticMap = new StaticMap();

    var options={
        basemap: "streets",
        zoom: 5,
        latitude: 40.432781,
        longitude: -3.626666,
        size: [400, 300]
    };

    staticMap.getImage(options).then(function(imageURL){
        // Print the image
    });

});
```

Parameters:

Param| Type | Default value | Summary
--- | --- | --- | ---
basemap|string|topo|Allowed: satellite, topo, light-gray, dark-gray, streets, hybrid, oceans, national-geographic, osm
zoom|int|5|Allowed: from 1 to 15
latitude|double|40.432781|Allowed: -90 <= x >= 90
longitude|double|-3.626666|Allowed: 180 <r= x >= 180
size|array of int|[300,300]|Any
