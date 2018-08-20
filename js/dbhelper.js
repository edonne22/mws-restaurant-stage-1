/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 
    return 'http://localhost:1337/restaurants';
  }
  
static openDatabase() {
    
    var db;
    var store;
    var store2;
    var dbPromise = idb.open('restrev', 1, function(upgradeDb){
    	store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    	store2 = upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
    	store2.createIndex('restaurant', 'restaurant_id');
    });
	
};

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
  
  	let fetchURL = 'http://localhost:1337/restaurants';
  	//restaurants from IndexedDB
  	var db;
    var store;
    var dbPromise = idb.open('restrev', 1);
  	dbPromise.then(function(db) {    	
  		var tx = db.transaction('restaurants', 'readonly');
  		var store = tx.objectStore('restaurants');
  		return store.getAll();
	}).then(function(restaurants) {
  		if (restaurants.length !== 0){
  			callback(null, restaurants);
  		} else {
  		
  			//if not available from indexedDB, fetch from server
  			fetch(fetchURL, { method: 'GET'})
    
    		.then(function(response){
    			return response.json();
			})
			.then(function(restaurants){
				//after fetch, add to IndexedDB
				dbPromise.then(function(db){
					var tx = db.transaction("restaurants", "readwrite");
					var rest = tx.objectStore("restaurants");
					for (var rest_data of restaurants){
						rest.put(rest_data);
					}
					callback(null, restaurants);
					return tx.complete
				}).then(function() {
					console.log("success: restaurants added from server");
				}).catch(function(error) {
					console.log(error);
					console.log("failed to add restaurant data from server");
				})
			})
  		}
	})
    
  };
  
  //get reviews in separate database
  static fetchReviews(callback, id) {
  
  	let fetchURL = 'http://localhost:1337/reviews/';
  	//reviews from IndexedDB
  	var db;
    var store2;
    var dbPromise = idb.open('restrev', 1);
  	dbPromise.then(function(db) {    	
  		var tx = db.transaction('reviews', 'readonly');
  		var store2 = tx.objectStore('reviews');
  		return store2.getAll();
	}).then(function(reviews) {
  		if (reviews.length !== 0){
  			callback(null, reviews);
  		} else {
  		
  			//if not available from indexedDB, fetch from server
  			fetch(fetchURL, { method: 'GET'})
    
    		.then(function(response){
    			return response.json();
			})
			.then(function(reviews){
				//after fetch, add to IndexedDB
				dbPromise.then(function(db){
					var tx = db.transaction("reviews", "readwrite");
					var rest = tx.objectStore("reviews");
					for (var rest_data of reviews){
						rest.put(rest_data);
					}
					callback(null, reviews);
					return tx.complete
				}).then(function() {
					console.log("success: reviews added from server");
				}).catch(function(error) {
					console.log(error);
					console.log("failed to add review data from server");
				})
			})
  		}
	})
    
  };
  //end reviews section
  
  /*fetch reviews by restaurant ID*/
  static fetchReviewsById(id, callback) {
  	// fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id == id);
        if (review) { // Got the restaurant
          callback(null, review);
        } else { // Review does not exist in the database
          callback('Review does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {

    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
/*
  static imageUrlForRestaurant(restaurant) {
    return ('/img/');
  }
  
  static imageUrlStringForRestaurant(restaurant) {
    return (`${restaurant.photographString}`);
  }*/
  
  static imageDescriptionForRestaurant(restaurant) {
    return (`${restaurant.alttext}`);
  }
  
  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

