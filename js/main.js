const dbPromise = DBHelper.openDatabase();

let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  fetchReviews();
});

/**
 * Fetch all reviews.
 */
 
fetchReviews = () => {
  DBHelper.fetchReviews((error, reviews) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.reviews = reviews;
      console.log("reviews added");
      //fillReviewsHTML();
    }
  });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZWRvbm5lIiwiYSI6ImNqaWFucTBjZjE5N3kza3BhMTB6bXpmengifQ.2MHNCTRBxMqupXkXJ3vYVA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = '/img/' + restaurant.id + '_1x.jpg';
  image.srcset = '/img/' + restaurant.id + '_1x.jpg 1x, /img/' + restaurant.id + '_2x.jpg 2x';
  image.alt = descriptions[(restaurant.id - 1)];
  li.append(image);
  
  const name = document.createElement('a');
  name.innerHTML = restaurant.name;
  name.href = DBHelper.urlForRestaurant(restaurant);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);
  
  const favorite = document.createElement('button');
  favorite.innerHTML = "+ Favorite";
  favorite.setAttribute("class", "faveButton");
  favorite.setAttribute("id", "favorite_" + restaurant.id);
  favorite.setAttribute("aria-label", "add favorite");
  li.append(favorite);
  favorite.onclick = function(){faved(this.id);};
  
  /*
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)*/

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

function faved(thisid){
	//console.log('fave clicked');
	var f = document.getElementById(thisid);
	if(f.classList.contains("faved")){
		f.classList.remove("faved");
		f.innerHTML = "+ Favorite";
		f.style.backgroundColor = "#004d00";
		f.setAttribute("aria-label", "add favorite");
	} else{
		f.className += " faved";
		f.innerHTML = "Favorited";
		f.style.backgroundColor = "#004d99";
		f.setAttribute("aria-label", "undo favorite");
	}
}

var descriptions = [

	"Cozy restaurant with brick exterior, and many people inside.",
	"A slightly burned, authentic looking pizza with melted slices of mozzarella.",
	"A metallic kitchen-like restaurant space with wooden tables topped with burners for heating food.",
	"The outside of a diner restaurant with a neon sign and lights at night.",
	"A casual pizza counter with crowded seating area. Christmas lights decorate the side wall.",
	"A large, sparse room with an industrial ceiling and an American flag on the back wall. People sit in casual groups on folding chairs.",
	"A stylized black and white photo of a storefront with a spray-painted sign. Two men in grunge attire converse outside; one is leading a dog.",
	"The exterior of a clean, gray brick building with a classic blue sign and an awning, contrasted against a red building behind it and a tree to the right of the building.",
	"A black and white photo of young people who are mostly Asian eating at narrow tables that are arranged close together.",
	"A stark white space with round stools along a silver counter. A barrel holds bare tree branches, and behind the counter is a selection of multicolored bottles.",
	
]

