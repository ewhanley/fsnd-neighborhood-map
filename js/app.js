var map;
var bounds;

var locality = "Missoula";
var map_center_name = "Missoula, MT";
var breweries = ["Draught Works",
  "Kettlehouse Brewing Company",
  "Highlander Beer - Missoula Brewing Co.",
  "Imagine Nation Brewing Co",
  "Great Burn Brewing",
  "Big Sky Brewing Company",
  "Bayern Brewing"];

var center = { lat: 46.878718, lng: -113.996586 };
var zoom = 20;

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
        location.reload();
      });
    });
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: zoom
  });

  bounds = new google.maps.LatLngBounds();

  // This ensures that the map stays centered wherever the user last centered it.
  // Solution found here: https://ao.gl/keep-google-map-v3-centered-when-browser-is-resized/
  google.maps.event.addDomListener(window, 'resize', function () {
    var currentCenter = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentCenter);
  });
}



var Outfitter = function (data) {
  var self = this;
  this.name = data.name;
  this.location = data.location;
  this.place_id = data.place_id;
  this.marker = new google.maps.Marker({
    map: map,
    position: data.location,
    title: data.name,
    animation: google.maps.Animation.DROP
  });
  this.infoWindow = new google.maps.InfoWindow({
    content: this.name
  });

  this.marker.addListener('click', function () {
    self.infoWindow.open(map, this);
  });
};




var ViewModel = function () {
  createData();
  console.log(localStorage.brewery_data);
  var self = this;
  self.initialList = ko.observableArray([]);
  self.filteredList = ko.observableArray([]);
  self.filter = ko.observable();

  //geocodeLocation(map_center_name);
  //breweries.forEach(geocodeLocation);
  initMap();

  var slideout = new Slideout({
    'panel': document.getElementById('panel'),
    'menu': document.getElementById('menu'),
    'padding': 300,
    'tolerance': 70
  });

  document.querySelector('.toggle-button').addEventListener('click', function () {
    slideout.toggle();
  });


  var data = JSON.parse(localStorage.getItem("brewery_data"));
  console.log(JSON.parse(localStorage.getItem("brewery_data")));



  Object.keys(data).forEach(function (key) {
    self.initialList.push(new Outfitter(data[key]));
  });
  console.log(self.initialList());
  self.initialList().forEach(function (brewery) {
    bounds.extend(brewery.marker.getPosition());
    console.log(bounds);
  });

  map.fitBounds(bounds);


  self.selectedOutfitter = ko.observable(self.initialList()[0]);

  self.toggleSelection = function () {
    self.selectedOutfitter().infoWindow.setMap(null);
    self.selectedOutfitter(this);
    this.infoWindow.open(map, this.marker);
  }
};

var initApp = function () {
  ko.applyBindings(new ViewModel());
};