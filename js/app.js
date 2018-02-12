var center = { lat: 45.676998, lng: -111.042934 };
var zoom = 13;
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: zoom
  });
}


var ViewModel = function () {
  console.log("New viewmodel created!");
  var self = this;
};

ko.applyBindings(new ViewModel());