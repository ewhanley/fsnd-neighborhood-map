var center = { lat: 46.878718, lng: -113.996586 };
var zoom = 15;
var bound_extender = 0.005;
var default_icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
var selected_icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
var panorama_options = {
  addressControl: false
};

var brewery_data = {
  "Draught Works": {
    "name": "Draught Works",
    "location": { "lat": 46.8776752, "lng": -114.0034258 },
    "place_id": "ChIJkYebV4fOXVMRQLcYlskN-G0"
  },
  "Highlander Beer - Missoula Brewing Co": {
    "name": "Highlander Beer - Missoula Brewing Co",
    "location": { "lat": 46.904825, "lng": -114.04510700000003 },
    "place_id": "ChIJp3mCu7LPXVMRa6j2BdjkSw8"
  },
  "Great Burn Brewing": {
    "name": "Great Burn Brewing",
    "location": { "lat": 46.839921, "lng": -114.03284489999999 },
    "place_id": "ChIJnUO-AorNXVMRskvwvOhbegg"
  },
  "Bayern Brewing": {
    "name": "Bayern Brewing",
    "location": { "lat": 46.872656, "lng": -114.02018700000002 },
    "place_id": "ChIJ01pL23bOXVMRWHBuERiIBaY"
  },
  "Kettlehouse Brewing Company": {
    "name": "Kettlehouse Brewing Company",
    "location": { "lat": 46.8779152, "lng": -113.99528800000002 },
    "place_id": "ChIJW5nGxYPOXVMRlcOWZaO6txU"
  },
  "Big Sky Brewing Company": {
    "name": "Big Sky Brewing Company",
    "location": { "lat": 46.9222117, "lng": -114.072744 },
    "place_id": "ChIJizWlk5TPXVMRRde_QUuInaM"
  },
  "Imagine Nation Brewing Co": {
    "name": "Imagine Nation Brewing Co",
    "location": { "lat": 46.87645939999999, "lng": -114.00962809999999 },
    "place_id": "ChIJLZ6DBXzOXVMRByCq7v8veQc"
  }
}