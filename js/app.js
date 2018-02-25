var map;
var sv;
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

  // This ensures that the map stays centered wherever the user last centered it.
  // Solution found here: https://ao.gl/keep-google-map-v3-centered-when-browser-is-resized/
  google.maps.event.addDomListener(window, 'resize', function () {
    recenterZoomMap();
  });
}

function getVenueId(brewery) {
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
  $.getJSON(url).done(function (data) {
    console.log(data.response.venues[0].id);
    return data.response.venues[0].id;
  })
    .fail(function () {
      alert("Foursquare doesn't have any information for " + brewery.name);
    });
}

function recenterZoomMap() {
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
  'tolerance': 70
});



// https://stackoverflow.com/a/28350952
function processSVData(data, status) {
  if (status == google.maps.StreetViewStatus.OK) {
    panorama.setPano(data.location.pano);
    panorama.setPov({
      heading: 270,
      pitch: 0
    });
    panorama.setVisible(true);
    console.log(status);
  }
  else {
    panorama.setVisible(false);
    console.log(status);
  }
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
    animation: google.maps.Animation.DROP
  });

  self.infoWindow = new google.maps.InfoWindow({
    content: '<h3>' + this.name + '</h3><div id="pano' + index + '"class="pano">There is no Street View available for this location.</div>'
  });

  self.fs_venue_id = getVenueId(self);


  self.marker.addListener('click', function () {
    self.marker.setIcon(selected_icon);
    self.infoWindow.open(map, this);
    panorama = new google.maps.StreetViewPanorama(document.getElementById('pano' + self.index));
    sv.getPanoramaByLocation(self.location, 200, processSVData);
  });

  self.infoWindow.addListener('closeclick', function () {
    self.marker.setIcon(default_icon);
  });
};



var ViewModel = function () {
  var self = this;
  self.initialList = ko.observableArray([]);
  self.filter = ko.observable('');
  self.visibleMarkers = ko.observableArray([]);
  self.isSlideoutOpen = ko.observable(slideout.isOpen());

  Object.keys(brewery_data).forEach(function (key, index) {
    self.initialList().push(new Brewery(brewery_data[key], index));
  });

  self.openSlideout = function () {
    slideout.toggle();
    self.isSlideoutOpen(slideout.isOpen());
  }

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

  self.toggleSelection = function () {
    self.selectedBrewery().infoWindow.setMap(null);
    self.selectedBrewery().marker.setIcon(default_icon);
    self.selectedBrewery(this);
    self.selectedBrewery().marker.setIcon(selected_icon);
    self.selectedBrewery().infoWindow.open(map, this.marker);
    panorama = new google.maps.StreetViewPanorama(document.getElementById('pano' + this.index));
    sv.getPanoramaByLocation(self.selectedBrewery().location, 200, processSVData);
  }


};

function initApp() {
  initMap();
  ko.applyBindings(new ViewModel());

};