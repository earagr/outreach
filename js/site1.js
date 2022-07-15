'use strict';

/** global variables: **/

/* relative path to json file to load: */
var json_path = 'data/data_file_2.json';

/* map object will be stored here: */
var map = null;

/* data will be stored here: */
var data = {
  'lats': [],
  'lons': [],
  'pm25': []
};

/* define color map: */
var colormap = {
  'min': 0,
  'max': 50,
  'colors': [
    '#1400ff', '#0064ff', '#00dbff', '#00ffac', '#00ff36',
    '#46ff00', '#bdff00', '#ffca00', '#ff5300', '#ff0029'
  ]
};

/** -- **/

/* function to convert value to color: */
function value_to_color(value) {
  /* get the colors and bounds: */
  var data_min = colormap['min'];
  var data_max = colormap['max'];
  var data_colors = colormap['colors'];
  /* number of colors: */
  var color_count = data_colors.length;
  /* max index value: */
  var max_index = color_count - 1;
  /* work out increment for color values: */
  var color_inc = (data_max - data_min) / color_count;
  /* work out color index for value: */
  var color_index = Math.floor((value - data_min) / color_inc);
  if (color_index < 0) {
    color_index = 0;
  };
  if (color_index > max_index) {
    color_index = max_index;
  };
  /* return the color: */
  return data_colors[color_index];
};

/* function to draw color map: */
function draw_colormap() {
  /* get the colours and bounds: */
  var data_min = colormap['min'];
  var data_max = colormap['max'];
  var data_colors = colormap['colors'];
  /* number of colours: */
  var color_count = data_colors.length;
  /* work out increment for color values: */
  var color_inc = (data_max - data_min) / color_count;
  /* create html: */
  var colormap_html = '';
  for (var i = (color_count - 1); i > -1; i--) {
    var my_html = '<p>';
    my_html += '<span class="map_colormap_color" style="background: ' + data_colors[i] + ';"></span>';
    my_html += '<span class="map_colormap_value">' + (data_min + (i * color_inc)).toFixed(2) + ' to ';
    my_html += (data_min + ((i + 1) * color_inc)).toFixed(2) + '</span>';
    my_html += '</p>';
    colormap_html += my_html;
  };
  /* return the html: */
  return colormap_html;
};

/* function to load the map: */
function load_map() {
  /* get values from data: */
  var lats = data['lats'];
  var lons = data['lons'];
  var pm25 = data['pm25'];
  /* work out min and max lat and lon values in data: */
  var lat_min = Math.min.apply(Math, lats);
  var lat_max = Math.max.apply(Math, lats);
  var lon_min = Math.min.apply(Math, lons);
  var lon_max = Math.max.apply(Math, lons);
  /* work out bounds of map: */
  var map_bounds = [
    [lat_min - 0.0001, lon_min - 0.0001],
    [lat_max + 0.0001, lon_max + 0.0001]
  ];
  var map_max_bounds = [
    [lat_min - 0.01, lon_min - 0.01],
    [lat_max + 0.01, lon_max + 0.01]
  ];
  /* work out min and max pm25 values: */
  var pm25_min = Math.min.apply(Math, pm25);
  var pm25_max = Math.max.apply(Math, pm25);
  /* set color map min and max: */
  colormap['min'] = pm25_min;
  colormap['max'] = pm25_max;
  /* define openstreetmap map tiles: */
  var osm_layer = L.tileLayer(
    'https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      'attribution': '&copy; <a href="https://osm.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }
  );
  /* define map: */
  map = L.map('map', {
    'attributionControl': false
  });
  /* add openstreetmap layer to map: */
  map.addLayer(osm_layer);
  /* set map bounds to bounds of data: */
  map.setMaxBounds(map_max_bounds);
  map.fitBounds(map_bounds);
  /* set min zoom to current zoom level - 2: */
  map.setMinZoom(map.getZoom() - 2);
  /* loop through data values: */
  for (var i = 0; i < lats.length; i++) {
    /* get lat, lon and pm25 values for this point: */
    var my_lat = lats[i];
    var my_lon = lons[i];
    var my_pm25 = pm25[i];
    /* get the color for this point: */
    var my_color = value_to_color(my_pm25);
    /* draw a circle on the map for this point: */
    var my_circle = L.circle(
      [my_lat, my_lon], {
        'radius': 50,
        'color': my_color,
        'weight': 0,
        'fillOpacity': 0.8
      }
    );
    /* add tooltip to circle: */
    my_circle.bindTooltip(
      '<b>Lat:</b> ' + my_lat + '<br>' +
      '<b>Lon:</b> ' + my_lon + '<br>' +
      '<b>PM2.5:</b> ' + my_pm25.toFixed(2)
    );
    /* add the cirle to the map: */
    my_circle.addTo(map);
  };
  /* add color map: */ 
  var colormap_src = draw_colormap();
  var map_colormap = L.control({position: 'bottomright'});
  map_colormap.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'map_ctl map_colormap');
      this.update(colormap_src);
      return this._div;
  };
  map_colormap.update = function(colormap_html) {
    this._div.innerHTML = colormap_html;
  };
  map_colormap.addTo(map);
  /* add scale bar: */
  L.control.scale().addTo(map);

};

/* function to load the data: */
async function load_data() {
  /* get the json data using fetch: */
  let fetch_response = await fetch(json_path, {
    'cache': 'force-cache'
  });
  /* get the json data: */
  var json_data = await fetch_response.json();
  /* remove NaN values ... loop through data: */
  for (var i = 0; i < json_data['lats'].length; i++) {
    /* if pm25 value is not 'NaN': */
    if ((json_data['pm25'][i] != 'NaN') &&
         (json_data['lats'][i] != 'NaN') &&
         (json_data['lons'][i] != 'NaN')) {
      /* store the values: */
      data['lats'].push(json_data['lats'][i]);
      data['lons'].push(json_data['lons'][i]);
      data['pm25'].push(json_data['pm25'][i]);
    };
  };
  /* then load the map: */
  load_map();
};

/** -- **/

/* on page load: */
window.addEventListener('load', function() {
  /* load the data ... : */
  load_data();
});

