import ko from 'knockout';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import Slideout from 'slideout';
import './css/styles.css';
import blueIcon from './img/blue-dot.png';
import yellowIcon from './img/yellow-dot.png';
import fsLogo from './img/Powered-by-Foursquare-full-color-300.png';
import breweryData from './data/data.json';
/* Register initMap and initApp with window object so they have global
scope for webpack build. */
window.initMap = initMap;
window.initApp = initApp;

const numBreweries = Object.keys(breweryData).length;
const center = { lat: 46.878718, lng: -113.996586 };
const zoom = 15;
// Used to extend bounds when extents
const boundExtender = 0.005;

let map;
let panorama;
let sv;
let initBounds;
let bounds;
let defaultIcon;
let selectedIcon;
const fsClientID = 'T20SKUKOMVZAPRO0UZ1ARLXY2QDSJXJSDDZXHRJFI0ZMGSFP';
const fsClientSecret = 'HRJ0NJBBHWIQQV3J1QB32CEXRDDFBZDCD3OXP5UMMJBI0BRK';
const fsHomeUrl = 'https://foursquare.com/';

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

  defaultIcon = {
    url: blueIcon, // url
    scaledSize: new google.maps.Size(26, 26)
  };

  selectedIcon = {
    url: yellowIcon
  };

  /* This ensures that the map stays centered wherever the user last centered
  it. Solution found here:
  https://ao.gl/keep-google-map-v3-centered-when-browser-is-resized/ */
  google.maps.event.addDomListener(window, 'resize', function () {
    recenterZoomMap();
  });
}

// Re-centers and sets zoom to values before window resize
function recenterZoomMap() {
  let currentCenter = map.getCenter();
  let currentZoom = map.getZoom();
  google.maps.event.trigger(map, 'resize');
  map.setCenter(currentCenter);
  map.setZoom(currentZoom);
}

/* In cases when filtering to a single marker, the map bounds result in a
maximum zoom. This function extends the bounds by a pre-configured distance 
(boundExtender let) and fits the map to the extended bounds. This solution was
found here: https://stackoverflow.com/a/5345708 */
function extendBoundsFitMap() {
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    let extendPoint1 =
      new google.maps.LatLng(bounds.getNorthEast().lat() + boundExtender,
        bounds.getNorthEast().lng() + boundExtender);
    let extendPoint2 =
      new google.maps.LatLng(bounds.getNorthEast().lat() - boundExtender,
        bounds.getNorthEast().lng() - boundExtender);
    bounds.extend(extendPoint1);
    bounds.extend(extendPoint2);
    map.fitBounds(bounds);
  }
  else {
    map.fitBounds(bounds);
  }
}

// Initialize slideout menu
let slideout = new Slideout({
  'panel': document.getElementById('panel'),
  'menu': document.getElementById('menu'),
  'padding': 310,
  'tolerance': 70,
  'touch': false
});

// Brewery object model
let Brewery = function (data) {
  let self = this;
  self.rating = '';
  self.ratingColor = '';
  self.price = '';
  self.url = '';
  self.tip = '';
  self.tipUrl = '';
  self.fsUrl = '';
  self.fsHomeUrl = fsHomeUrl;
  self.fsFail = Boolean(false);
  self.name = data.name;
  self.location = data.location;
  self.placeID = data.placeID;
  self.marker = new google.maps.Marker({
    map: map,
    visible: true,
    position: data.location,
    title: data.name,
    icon: defaultIcon,
    animation: google.maps.Animation.DROP,
    optimized: false
  });
};

/* This function retrieves the nearest Google Steet View panorama for a given
location and updates the pano element with it. In the event of no response,
the pano element is updated to reflect accordingly. */
function setPano(brewery) {
  sv.getPanoramaByLocation(brewery.location, 200, function (data, status) {
    if (status === 'OK') {
      panorama =
        new google.maps.StreetViewPanorama(document.getElementById('pano'));
      panorama.setPano(data.location.pano);
      panorama.setPov({
        heading:
          google.maps.geometry.spherical.computeHeading(data.location.latLng,
            new google.maps.LatLng(brewery.location)),
        pitch: 0
      });
    }
    else {
      document.getElementById('pano').innerHTML =
        'Street View data not found for this location.';
    }
  });
}

function breweryFSCallback(brewery, venueData) {
  brewery.rating = venueData.rating;
  brewery.price = venueData.price.currency.repeat(venueData.price.tier);
  brewery.ratingColor = '#' + venueData.ratingColor;
  brewery.url = venueData.url;
  brewery.tip = '"' + venueData.tips.groups[0].items[0].text + '"';
  brewery.tipUrl = venueData.tips.groups[0].items[0].canonicalUrl;
  brewery.fsUrl = venueData.canonicalUrl;
}

function breweryFSFailCallback(brewery) {
  brewery.fsFail = true;
}

/* Function for getting JSON venue data from Foursquare. In the getJSON .always
it uses the number of breweries (and thus requests) to determine when to clear
the loading spinner overlay. */
let requestCount = numBreweries;
function getFourSquareData(brewery) {
  let url = 'https://api.foursquare.com/v2/venues/search?';
  let params = {
    ll: brewery.location.lat + ',' + brewery.location.lng,
    name: brewery.name,
    intent: 'match',
    client_id: fsClientID,
    client_secret: fsClientSecret,
    v: '20180201'
  };
  url += $.param(params);
  let venueId = $.getJSON(url);
  let venueDetails = venueId.then(function (data) {
    url = 'https://api.foursquare.com/v2/venues/' +
      data.response.venues[0].id + '?';
    params = {
      client_id: fsClientID,
      client_secret: fsClientSecret,
      v: '20180201'
    };
    url += $.param(params);
    return $.getJSON(url);
  });
  venueDetails.done(function (data) {
    let venueData = data.response.venue;
    breweryFSCallback(brewery, venueData);

  }).fail(function () {
    console.log('Failed to get data for ' +
      brewery.name +
      ' from foursquare.');
    breweryFSFailCallback(brewery);
  }).always(function () {
    /* This clears the loading spinner overlay after the last request completes
    whether successful or not. */
    requestCount--;
    if (requestCount === 0) {
      $('.overlay').hide();
    }
  });
}

let ViewModel = function () {
  let self = this;
  self.initialList = ko.observableArray([]);
  self.filter = ko.observable('');
  self.visibleMarkers = ko.observableArray([]);

  // Construct brewery objects
  Object.keys(breweryData).forEach(function (key) {
    self.initialList().push(new Brewery(breweryData[key]));
  });

  for (let i = 0; i < self.initialList().length; i++) {
    let brewery = self.initialList()[i];
    getFourSquareData(brewery);
  }

  // Extend map bounds to encompass all markers
  self.initialList().forEach(function (brewery) {
    initBounds.extend(brewery.marker.getPosition());
  });

  function infoWindowInitialize() {
    let infoWindowHTML =
      '<div id="info-window"' +
      'data-bind="template: ' +
      '{ name: \'info-window-template\', data: selectedBrewery }">' +
      '</div>';

    self.infoWindow = new google.maps.InfoWindow({
      content: infoWindowHTML,
      contextmenu: true
    });
    let isInfoWindowLoaded = Boolean(false);

    /* When the info window opens, bind it to Knockout.
    Only do this once. Solution found here:
     https://jsfiddle.net/SittingFox/nr8tr5oo/ */
    google.maps.event.addListener(self.infoWindow, 'domready', function () {
      if (!isInfoWindowLoaded) {
        ko.applyBindings(self, $("#info-window")[0]);
        isInfoWindowLoaded = true;
      }
    });

    google.maps.event.addListener(self.infoWindow, 'closeclick', function () {
      self.selectedBrewery().marker.setIcon(defaultIcon);
    });
  }
  infoWindowInitialize();

  // Function to toggle marker visibility when list is filtered
  self.toggleMarkers = function (filtered) {
    self.initialList().forEach(function (brewery) {
      filtered.includes(brewery) ? brewery.marker.setVisible(true) :
        brewery.marker.setVisible(false);
    });
  };

  // Function to toggle marker icon type when selected
  self.toggleInfoWindows = function (filtered) {
    self.initialList().forEach(function (brewery) {
      if (!filtered.includes(brewery)) {
        brewery.marker.setIcon(defaultIcon);
      }
    });
  };

  self.filteredList = ko.computed(function () {
    let filtered = self.initialList().filter(function (brewery) {
      return brewery.name.toLowerCase().indexOf(self.filter().toLowerCase()) != -1;
    });

    self.toggleMarkers(filtered);

    // Update map with bounds that encompass only the filtered markers
    bounds = new google.maps.LatLngBounds(null);
    filtered.forEach(function (brewery) {
      bounds.extend(brewery.marker.getPosition());
    });
    extendBoundsFitMap();

    return filtered;
  });

  self.selectedBrewery = ko.observable(self.filteredList()[0]);

  // Assign click listeners for each brewery
  self.initialList().forEach(function (brewery) {
    brewery.marker.addListener('click', function () {
      self.toggleSelection(brewery);
    });
  });

  self.openSlideout = function () {
    slideout.toggle();
  };

  self.resetMap = function resetMap() {
    map.setZoom(zoom);
    map.setCenter(center);
    map.fitBounds(initBounds);
  };

  self.toggleSelection = function (brewery) {
    // Reset marker to default for previous selection
    self.selectedBrewery().marker.setIcon(defaultIcon);

    // Update selected brewery and open its infoWindow
    self.infoWindow.open(map, brewery.marker);
    self.selectedBrewery(brewery);
    self.selectedBrewery().marker.setIcon(selectedIcon);
    self.selectedBrewery().marker.setAnimation(google.maps.Animation.BOUNCE);
    /* This stops the marker bounce animation after one bounce by setting the
    animation to null after 100ms. */
    setTimeout(function () {
      self.selectedBrewery().marker.setAnimation(null);
    }, 100);
    setPano(self.selectedBrewery());
  };
};

function initApp() {
  initMap();
  ko.applyBindings(new ViewModel());
}