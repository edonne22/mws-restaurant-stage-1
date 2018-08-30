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
  
  //fetchNeighborhoods();
  //fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}*/

/**
 * Set neighborhoods HTML.
 */
 var neighborhoodsArray = [];
 var cuisinesArray = [];
fillNeighborhoodsHTML = (restaurants = self.restaurants) => {
  const select = document.getElementById('neighborhoods-select');
  
  function getNeighborhoods(){
  		console.log("run get neighborhoods");
		//var abc = new Array();
		for(i = 0; i < restaurants.length; i++){
			var current = restaurants[i].neighborhood;
			if(neighborhoodsArray.includes(current)){
				//console.log('already exists');
			}
			else{
				neighborhoodsArray.push(restaurants[i].neighborhood);
				//console.log("restaurant: " + restaurants[i].neighborhood);
			}
		}
		//neighborhoods = abc;
	}
	if(neighborhoodsArray.length < 1){	
  		getNeighborhoods();
  		console.log('fill neighborhoods html');
  		neighborhoodsArray.forEach(neighborhood => {
    	const option = document.createElement('option');
    	option.innerHTML = neighborhood;
    	option.value = neighborhood;
    	select.append(option);
  		});
  	}
}

/**
 * Fetch all cuisines and set their HTML.
 
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}*/

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (restaurants = self.restaurants) => {
  const select = document.getElementById('cuisines-select');
  
    function getCuisines(){
  		console.log("run get cuisines");
		for(i = 0; i < restaurants.length; i++){
			var current = restaurants[i].cuisine_type;
			if(cuisinesArray.includes(current)){
				//console.log('already exists');
			}
			else{
				cuisinesArray.push(restaurants[i].cuisine_type);
			}
		}
  	}
  	if(cuisinesArray.length < 1){	
  		getCuisines();
  		console.log('fill cuisines html');
  		cuisinesArray.forEach(cuisine => {
    	const option = document.createElement('option');
    	option.innerHTML = cuisine;
    	option.value = cuisine;
    	select.append(option);
  		});
  	}
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
      fillNeighborhoodsHTML();
  	  fillCuisinesHTML(); 
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
  favorite.setAttribute("class", "faveButton");
  favorite.setAttribute("id", "favorite_" + restaurant.id);
  //console.log(restaurant.id + " button " + "fave status: " + restaurant.is_favorite);
  if(restaurant.is_favorite == "false"){
  	favorite.classList.remove("faved");
  	favorite.innerHTML = "+ Favorite";
  	favorite.style.backgroundColor = "#004d00";
  	favorite.setAttribute("aria-label", "add favorite");
  } else {
  	favorite.className += " faved";
  	favorite.innerHTML = "Favorited";
  	favorite.style.backgroundColor = "#004d99";
  	favorite.setAttribute("aria-label", "add favorite");
  }
  li.append(favorite);
  favorite.onclick = function(){faved(this.id);};

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

function faved(thisid){
	//console.log('fave clicked');
	var f = document.getElementById(thisid);
	var currentId = thisid;
	currentId = currentId.split("_").pop();
	currentId = parseInt(currentId);
	if(f.classList.contains("faved")){
		f.classList.remove("faved");
		f.innerHTML = "+ Favorite";
		f.style.backgroundColor = "#004d00";
		f.setAttribute("aria-label", "add favorite");
		DBHelper.updateFavoriteStatus(currentId, 'false');
	} else{
		f.className += " faved";
		f.innerHTML = "Favorited";
		f.style.backgroundColor = "#004d99";
		f.setAttribute("aria-label", "undo favorite");
		DBHelper.updateFavoriteStatus(currentId, 'true');
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

