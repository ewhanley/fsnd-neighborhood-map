var map;
var bounds;
var bound_extender = 0.005;
var default_icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
var selected_icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

var locality = "Missoula";
var map_center_name = "Missoula, MT";
var breweries = ["Draught Works",
  "Kettlehouse Brewing Company",
  "Highlander Beer - Missoula Brewing Co",
  "Imagine Nation Brewing Co",
  "Great Burn Brewing",
  "Big Sky Brewing Company",
  "Bayern Brewing"];

var center = { lat: 46.878718, lng: -113.996586 };
var zoom = 15;

/* function geocodeLocation(address) {
  var geocoder = new google.maps.Geocoder();
  var restrictions = { locality: locality };
  geocoder.geocode({ address: address, componentRestrictions: restrictions }, function (results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      console.log(status);
      console.log(results);
      return results;
    }
    else {
      console.log(address + ' returned ' + status);
    }
  });
} */

function createData() {
  if (!localStorage.brewery_data) {
    console.log("Geocoding brewery locations and saving in localStorage.");
    localStorage.brewery_data = JSON.stringify({});
    var geocoder = new google.maps.Geocoder();
    breweries.forEach(function (brewery) {
      var restrictions = { locality: locality };
      console.log("Adding " + brewery);
      geocoder.geocode({ address: brewery, componentRestrictions: restrictions }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var brewery_data = JSON.parse(localStorage.brewery_data);
          var obj = {
            name: brewery,
            location: results[0].geometry.location,
            place_id: results[0].place_id
          };
          brewery_data[brewery] = obj;
          localStorage.brewery_data = JSON.stringify(brewery_data);
        }
        else {
          console.log(brewery + " failed with status " + status);
        }
      });
    });
  }

}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: zoom,
    zoomControl: true
  });

  bounds = new google.maps.LatLngBounds(null);

  // This ensures that the map stays centered wherever the user last centered it.
  // Solution found here: https://ao.gl/keep-google-map-v3-centered-when-browser-is-resized/
  google.maps.event.addDomListener(window, 'resize', function () {
    var currentCenter = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentCenter);
  });
}



var Brewery = function (data) {
  var self = this;
  this.name = data.name;
  this.location = data.location;
  this.place_id = data.place_id;
  this.marker = new google.maps.Marker({
    map: map,
    visible: true,
    position: data.location,
    title: data.name,
    icon: default_icon,
    animation: google.maps.Animation.DROP
  });
  this.infoWindow = new google.maps.InfoWindow({
    content: this.name
  });

  this.marker.addListener('click', function () {
    self.marker.setIcon(selected_icon);
    self.infoWindow.open(map, this);
  });

  this.infoWindow.addListener('closeclick', function () {
    self.marker.setIcon(default_icon);
  });
};



var ViewModel = function () {
  //createData();
  var self = this;
  self.initialList = ko.observableArray([]);
  self.filter = ko.observable('');
  self.visibleMarkers = [];

  var slideout = new Slideout({
    'panel': document.getElementById('panel'),
    'menu': document.getElementById('menu'),
    'padding': 310,
    'tolerance': 70
  });


  self.isSlideoutOpen = ko.observable(slideout.isOpen());

  self.openSlideout = function () {
    slideout.toggle();
    self.isSlideoutOpen(slideout.isOpen());
    var currentCenter = map.getCenter();
    var currentZoom = map.getZoom();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentCenter);
    map.setZoom(currentZoom);
  }

  var data = brewery_data;

  Object.keys(data).forEach(function (key) {
    self.initialList.push(new Brewery(data[key]));
  });

  self.initialList().forEach(function (brewery) {
    bounds.extend(brewery.marker.getPosition());
  });

  map.fitBounds(bounds);

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
    self.visibleMarkers = [];
    filtered.forEach(function (brewery) {
      self.visibleMarkers.push(brewery.marker);
    });
    bounds = new google.maps.LatLngBounds(null);
    self.visibleMarkers.forEach(function (marker) {
      bounds.extend(marker.getPosition());
    });


    // Don't zoom in too far on only one marker
    // From https://stackoverflow.com/a/5345708
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + bound_extender, bounds.getNorthEast().lng() + bound_extender);
      var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - bound_extender, bounds.getNorthEast().lng() - bound_extender);
      bounds.extend(extendPoint1);
      bounds.extend(extendPoint2);
    }
    map.fitBounds(bounds);
    return filtered;
  });

  self.selectedBrewery = ko.observable(self.filteredList()[0]);

  self.toggleSelection = function () {
    self.selectedBrewery().infoWindow.setMap(null);
    self.selectedBrewery().marker.setIcon(default_icon);
    self.selectedBrewery(this);
    this.marker.setIcon(selected_icon);
    this.infoWindow.open(map, this.marker);
  }
};

function initApp() {
  initMap();
  ko.applyBindings(new ViewModel());

};