var map;


var Outfitter = function (data) {
  var self = this;
  this.name = data.name;
  this.location = data.location;
  this.place_id = data.place_id;
  this.foo = "bar";
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
  })
};

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: data.map_center.location,
    zoom: data.map_center.zoom
  });
}


var ViewModel = function () {
  var self = this;
  self.initialList = ko.observableArray([]);
  self.filteredList = ko.observableArray([]);
  self.filter = ko.observable();

  initMap();

  data.outfitters.forEach(function (outfitter) {
    self.initialList.push(new Outfitter(outfitter));
  });

  self.w3_open = function w3_open() {
    document.getElementById("map").style.marginLeft = "25%";
    document.getElementById("header").style.marginLeft = "25%";
    document.getElementById("mySidebar").style.width = "25%";
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("openNav").style.display = 'none';
  }
  self.w3_close = function w3_close() {
    document.getElementById("map").style.marginLeft = "0%";
    document.getElementById("header").style.marginLeft = "0%";
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("openNav").style.display = "inline-block";
  }
};

var initApp = function () {
  ko.applyBindings(new ViewModel());
};