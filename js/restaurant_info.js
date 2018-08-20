let restaurant;
let reviews;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current reviews from page URL.
 */
fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // reviews already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant review id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = '/img/' + restaurant.id + '_1x.jpg';
  image.srcset = '/img/' + restaurant.id + '_1x.jpg 1x, /img/' + restaurant.id + '_2x.jpg 2x';
  image.alt = descriptions[(restaurant.id - 1)];

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  
  console.log('reviews: ' + reviews);
  
  /*const ul = document.getElementById('reviews-list');
  
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);*/
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  const favorite = document.createElement('button');
  favorite.innerHTML = "+ Favorite";
  favorite.setAttribute("class", "faveButton2");
  favorite.setAttribute("id", "favorite_" + restaurant.id);
  favorite.onclick = function(){faved(this.id);};
  breadcrumb.appendChild(li);
  li.appendChild(a);
  li.appendChild(favorite);
  a.innerHTML = restaurant.name;
  a.setAttribute("aria-current","page");
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function faved(thisid){
	//console.log('fave clicked');
	var f = document.getElementById(thisid);
	if(f.classList.contains("faved")){
		f.classList.remove("faved");
		f.innerHTML = "+ Favorite";
		f.style.backgroundColor = "#004d00";
	} else{
		f.className += " faved";
		f.innerHTML = "Favorited";
		f.style.backgroundColor = "#004d99";
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
