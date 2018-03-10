var map;
var panorama;
var sv;
var initBounds;
var bounds;
var default_icon;
const fs_client_id = 'T20SKUKOMVZAPRO0UZ1ARLXY2QDSJXJSDDZXHRJFI0ZMGSFP';
const fs_client_secret = 'Z3IVG53TX5TNZSX1HF0EFQDNV0UPQCFKUUS1LNNGLXA4DKMP';

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: zoom,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    fullscreenControl: false,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    }
  });

  sv = new google.maps.StreetViewService();
  bounds = new google.maps.LatLngBounds(null);
  initBounds = new google.maps.LatLngBounds(null);

  default_icon = {
    url: "img/blue-dot.png", // url
    scaledSize: new google.maps.Size(26, 26)
  };

  selected_icon = {
    url: "img/yellow-dot.png"
  }


  // This ensures that the map stays centered wherever the user last centered it.
  // Solution found here: https://ao.gl/keep-google-map-v3-centered-when-browser-is-resized/
  google.maps.event.addDomListener(window, 'resize', function () {
    recenterZoomMap();
  });
}



function recenterZoomMap() {
  console.log("recenterZoomMap");
  var currentCenter = map.getCenter();
  var currentZoom = map.getZoom();
  google.maps.event.trigger(map, 'resize');
  map.setCenter(currentCenter);
  map.setZoom(currentZoom);
}



function extendBoundsFitMap() {
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + bound_extender, bounds.getNorthEast().lng() + bound_extender);
    var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - bound_extender, bounds.getNorthEast().lng() - bound_extender);
    bounds.extend(extendPoint1);
    bounds.extend(extendPoint2);
    map.fitBounds(bounds);
  }
  else {
    map.fitBounds(bounds);
  }
}


var slideout = new Slideout({
  'panel': document.getElementById('panel'),
  'menu': document.getElementById('menu'),
  'padding': 310,
  'tolerance': 70,
  'touch': false
});


var Brewery = function (data, index) {
  var self = this;
  self.rating = '';
  self.rating_color = '';
  self.price = '';
  self.url = '';
  self.tip = '';
  self.tip_url = '';
  self.fs_url = '';
  self.index = index;
  self.name = data.name;
  self.location = data.location;
  self.place_id = data.place_id;
  self.marker = new google.maps.Marker({
    map: map,
    visible: true,
    position: data.location,
    title: data.name,
    icon: default_icon,
    animation: google.maps.Animation.DROP,
    optimized: false
  });
};

function setPano(brewery) {
  sv.getPanoramaByLocation(brewery.location, 200, function (data, status) {
    if (status === 'OK') {
      panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));
      panorama.setPano(data.location.pano);
      panorama.setPov({
        heading: google.maps.geometry.spherical.computeHeading(data.location.latLng, new google.maps.LatLng(brewery.location)),
        pitch: 0
      });
    }
    else {
      brewery.panorama.setVisible(false);
      document.getElementById('pano').innerHTML = 'Street View data not found for this location.';
    }
  });
}

function getFourSquareData(brewery) {
  var url = 'https://api.foursquare.com/v2/venues/search?';
  var params = {
    ll: brewery.location.lat + ',' + brewery.location.lng,
    name: brewery.name,
    intent: 'match',
    client_id: fs_client_id,
    client_secret: fs_client_secret,
    v: '20180201'
  };
  url += $.param(params);
  var venueId = $.getJSON(url);
  var venueDetails = venueId.then(function (data) {
    url = 'https://api.foursquare.com/v2/venues/' + data.response.venues[0].id + '?';
    params = {
      client_id: fs_client_id,
      client_secret: fs_client_secret,
      v: '20180201'
    }
    url += $.param(params);
    return $.getJSON(url);
  });
  venueDetails.done(function (data) {
    console.log(data);
    var data = data.response.venue;
    brewery.rating = data.rating;
    brewery.price = data.price.currency.repeat(data.price.tier);
    brewery.rating_color = '#' + data.ratingColor;
    brewery.url = data.url;
    brewery.tip = '"' + data.tips.groups[0].items[0].text + '"';
    brewery.tip_url = data.tips.groups[0].items[0].canonicalUrl;
    brewery.fs_url = data.canonicalUrl;

    $('.overlay').hide();

  }).fail(function () {
    console.log("failed to get data from foursquare");
    $('.overlay').hide();
    var saveData = JSON.parse(localStorage.saveData || null) || {};
    console.log(new Date().getTime());
    saveData.time = new Date().getTime();
  });
}






var ViewModel = function () {
  var self = this;
  self.initialList = ko.observableArray([]);
  self.filter = ko.observable('');
  self.visibleMarkers = ko.observableArray([]);

  // Construct brewery objects
  Object.keys(brewery_data).forEach(function (key, index) {
    self.initialList().push(new Brewery(brewery_data[key], index));
  });

  for (var i = 0; i < self.initialList().length; i++) {
    (function (i) { // protects i in an immediately called function
      var brewery = self.initialList()[i];
      console.log(brewery);
      getFourSquareData(brewery);
    })(i);
  }

  self.initialList().forEach(function (brewery) {
    initBounds.extend(brewery.marker.getPosition());
  });



  function infoWindowInitialize() {
    var infoWindowHTML =
      '<div id="info-window"' +
      'data-bind="template: { name: \'info-window-template\', data: selectedBrewery }">' +
      '</div>';

    self.infoWindow = new google.maps.InfoWindow({
      content: infoWindowHTML,
      contextmenu: true
    });
    var isInfoWindowLoaded = false;

    /*
     * When the info window opens, bind it to Knockout.
     * Only do this once.
     */
    google.maps.event.addListener(self.infoWindow, 'domready', function () {
      if (!isInfoWindowLoaded) {
        ko.applyBindings(self, $("#info-window")[0]);
        isInfoWindowLoaded = true;
        console.log(isInfoWindowLoaded);
      }
    });

    google.maps.event.addListener(self.infoWindow, 'closeclick', function () {
      self.selectedBrewery().marker.setIcon(default_icon);
    });
  }
  infoWindowInitialize();







  self.toggleMarkers = function (filtered) {
    self.initialList().forEach(function (brewery) {
      filtered.includes(brewery) ? brewery.marker.setVisible(true) : brewery.marker.setVisible(false);
    });
  }

  self.toggleInfoWindows = function (filtered) {
    self.initialList().forEach(function (brewery) {
      if (!filtered.includes(brewery)) {
        brewery.marker.setIcon(default_icon);
      }
    });
  }



  self.filteredList = ko.computed(function () {
    var filtered = self.initialList().filter(function (brewery) {
      return brewery.name.toLowerCase().indexOf(self.filter().toLowerCase()) != -1;
    });

    self.toggleMarkers(filtered);

    self.visibleMarkers([]);
    filtered.forEach(function (brewery) {
      self.visibleMarkers().push(brewery.marker);
    });

    bounds = new google.maps.LatLngBounds(null);
    self.visibleMarkers().forEach(function (marker) {
      bounds.extend(marker.getPosition());
    });

    extendBoundsFitMap();
    return filtered;
  });

  self.selectedBrewery = ko.observable(self.filteredList()[0]);


  // Assign click listenders for each brewery that update markers and Street View panos
  self.initialList().forEach(function (brewery) {
    brewery.marker.addListener('click', function () {
      self.toggleSelection(brewery);
    });


  })

  self.openSlideout = function () {
    slideout.toggle();
  }

  self.resetMap = function resetMap() {
    map.setZoom(zoom);
    map.setCenter(center);
    map.fitBounds(initBounds);
  }


  self.toggleSelection = function (brewery) {
    // Clear infoWindow and reset marker to default for previous selection
    self.selectedBrewery().marker.setIcon(default_icon);

    // Update selected brewery and open its infoWindow
    self.infoWindow.open(map, brewery.marker);
    self.selectedBrewery(brewery);
    self.selectedBrewery().marker.setIcon(selected_icon);
    self.selectedBrewery().marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () { self.selectedBrewery().marker.setAnimation(null); }, 100);
    setPano(self.selectedBrewery());
  }
};

function initApp() {
  initMap();
  ko.applyBindings(new ViewModel());
};