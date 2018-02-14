var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: locations.map_center.location,
    zoom: locations.map_center.zoom
  });
}

function populateInfoWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);
    infowindow.addListener('closeclick', function () {
      infowindow.setMarker = null;
    });
  }
}

function initMarker(place) {
  var self = this;
  var largeInfowindow = new google.maps.InfoWindow();
  var bounds = new google.maps.LatLngBounds();
  var marker = new google.maps.Marker({
    map: map,
    position: place.location,
    title: place.name,
    animation: google.maps.Animation.DROP
  });

  marker.addListener('click', function () {
    populateInfoWindow(this, largeInfowindow);
  });
}


var ViewModel = function () {
  var self = this;
  locations.outfitters.forEach(initMarker);
};

var initApp = function () {
  initMap();
  ko.applyBindings(new ViewModel());
};