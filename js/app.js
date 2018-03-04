var map;
var sv;
var initBounds;
var bounds;
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

function infoWindowSVContent(brewery) {
  var contentString = '';
  contentString += '<h3 id="name">' + brewery.name + '</h3>';
  contentString += '<div id="info-box">';
  contentString += '<div id="pano' + brewery.index + '" class="pano"></div>';
  contentString += '<div id="fs' + brewery.index + '"class="fs-info"></div>';
  contentString += '</div>';
  return contentString;
}

function infoWindowFSContent(data) {
  var venue_data = data.response.venue;
  var contentString = '';
  contentString += '<div class="fs-details"><div class="score-box" style="background-color:#' + venue_data.ratingColor + '">' + venue_data.rating + '</div>';
  contentString += '<div class="price-box">' + '$'.repeat(venue_data.price.tier) + '</div>';
  contentString += '<div class="fs-logo"><a target="_blank" href="https://foursquare.com/"><img width="auto" height="30px" src="img/Powered-by-Foursquare-full-color-300.png"></a></div></div>';
  contentString += '<p class="cust-say">Customers say:</p>';
  contentString += '<div class="quote-box">'
  contentString += '<a class="tip" target="_blank" href="' + venue_data.tips.groups[0].items[0].canonicalUrl + '">' + venue_data.tips.groups[0].items[0].text + '</a>';
  contentString += '</div>';
  return contentString;
}










var Brewery = function (data, index) {
  var self = this;
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
  self.infoWindow = new google.maps.InfoWindow();
  //self.infoWindow.setContent(infoWindowSVContent(self));
};

function setPano(brewery) {
  sv.getPanoramaByLocation(brewery.location, 200, function (data, status) {
    if (status === 'OK') {
      brewery.panorama.setPano(data.location.pano);
      brewery.panorama.setPov({
        heading: google.maps.geometry.spherical.computeHeading(data.location.latLng, new google.maps.LatLng(brewery.location)),
        pitch: 0
      });
    }
    else {
      brewery.panorama.setVisible(false);
      document.getElementById('pano' + brewery.index).innerHTML = 'Street View data not found for this location.';
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
    document.getElementById('fs' + brewery.index).innerHTML = infoWindowFSContent(data);
    document.getElementById('name').innerHTML = '<a href="' + data.response.venue.url + '"><h3>' + brewery.name + '</h3></a>';
  }).fail(function () {
    console.log("failed to get data from foursquare");
    document.getElementById('fs' + brewery.index).innerHTML = '<div class="fs-fail">Foursquare data not found for this location.</div>';
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

  self.initialList().forEach(function (brewery) {
    initBounds.extend(brewery.marker.getPosition());
  });





  self.toggleMarkers = function (filtered) {
    self.initialList().forEach(function (brewery) {
      filtered.includes(brewery) ? brewery.marker.setVisible(true) : brewery.marker.setVisible(false);
    });
  }

  self.toggleInfoWindows = function (filtered) {
    self.initialList().forEach(function (brewery) {
      if (!filtered.includes(brewery)) {
        brewery.infoWindow.close();
        brewery.marker.setIcon(default_icon);
      }
    });
  }



  self.filteredList = ko.computed(function () {
    var filtered = self.initialList().filter(function (brewery) {
      return brewery.name.toLowerCase().indexOf(self.filter().toLowerCase()) != -1;
    });

    self.toggleMarkers(filtered);
    self.toggleInfoWindows(filtered);

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

      console.log(brewery);
      self.toggleSelection(brewery);
    });

    brewery.infoWindow.addListener('closeclick', function () {
      brewery.marker.setIcon(default_icon);
    });
  })

  self.openSlideout = function () {
    slideout.toggle();
  }

  self.resetMap = function resetMap() {
    console.log(zoom);
    console.log(center);
    console.log(map.getBounds());
    console.log(initBounds);
    map.setZoom(zoom);
    map.setCenter(center);
    map.fitBounds(initBounds);
    console.log(map.getBounds());


  }







  self.toggleSelection = function (brewery) {
    // Clear infoWindow and reset marker to default for previous selection
    self.selectedBrewery().infoWindow.close();
    self.selectedBrewery().marker.setIcon(default_icon);

    // Update selected brewery and open its infoWindow
    self.selectedBrewery(brewery);
    getFourSquareData(brewery);
    self.selectedBrewery().marker.setIcon(selected_icon);
    self.selectedBrewery().marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () { self.selectedBrewery().marker.setAnimation(null); }, 1000);
    self.selectedBrewery().infoWindow.setContent(infoWindowSVContent(self.selectedBrewery()));
    self.selectedBrewery().infoWindow.open(map, brewery.marker);
    self.selectedBrewery().panorama = new google.maps.StreetViewPanorama(document.getElementById('pano' + self.selectedBrewery().index));
    setPano(self.selectedBrewery());
  }


};

function initApp() {
  initMap();
  ko.applyBindings(new ViewModel());

};