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
    return idb.open('restrev', 1, function(upgradeDb){
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
  
  	//console.log('id from function: ' + id);
  	var id = id; //until can get real id in there
  	//let fetchURL = 'http://localhost:1337/reviews/?restaurant_id=' + id;
  	let fetchURL = 'http://localhost:1337/reviews/';
  	//reviews from IndexedDB
  	var db;
    var store2;
    var dbPromise = idb.open('restrev', 1);
  	dbPromise.then(function(db) {    	
  		var tx = db.transaction('reviews', 'readwrite');
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
					//console.log('reviews: ' + reviews);
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
/*
	//fetch reviews by restaurant id
	static fetchReviewsById(id) {
  
  	let fetchURL = 'http://localhost:1337/reviews/?restaurant_id=' + id;
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
  			console.log('reviews by id empty');
  			//callback(null, reviews);
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
					var reviews = tx.objectStore("reviews");
					reviews.forEach(function(review){
						store2.put(review);
					});
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
*/ 
 
  //add review - offline storage
  static addReview(review) {
  	//data from form
  	var store_offline = {
  		name: 'addReview',
  		data: review,
  		object_type: 'review'
  	};
  	//check online/offline status
  	if (!navigator.onLine && (store_offline.name === 'addReview')){
  		DBHelper.sendDataWhenOnline(store_offline);
  		return;
  	}
  	var sendReview = {
  		"name": review.name,
  		"rating": parseInt(review.rating),
  		"comments": review.comments,
  		"restaurant_id": parseInt(review.restaurant_id)
  	};
  	console.log('Send review: ', sendReview);
  	var fetch_options = {
  		method: 'POST',
  		body: JSON.stringify(sendReview),
  		headers: new Headers({
  			'Content-Type': 'application/json'
  		})
  	};
  	
  	fetch('http://localhost:1337/reviews', fetch_options).then((response) => {
  		const contentType = response.headers.get('content-type');
  		if (contentType && contentType.indexOf('application/json') !== -1){
  			return response.json();
  		} 
  		else {return 'API call successful'}})
  		.then((data) => {console.log('Fetch successful')
  			this.openDatabase()
  				.then(db => {
					const tx = db.transaction('reviews', 'readwrite');
					const store = tx.objectStore('reviews');
					store.put(data);
				})
  		})
  		.catch(error => console.log('error: ', error));
  }
  
  static sendDataWhenOnline(store_offline) {
  	console.log('Offline stored data', store_offline);
  	//store the review object in local storage
  	localStorage.setItem('data', JSON.stringify(store_offline.data));
  	//add an event listener to wait in background until user is online
  	console.log('local storage: ' + store_offline.object_type + 'stored');
  	//when online get the reviews from local storage
  	window.addEventListener('online', (event) => {
  		console.log('Browser: is online');
  		var data = JSON.parse(localStorage.getItem('data'));
  		if (data !== null) {
  			console.log(data);
  			if (store_offline.name === 'addReview'){
  				//send the review tot eh server with addReview
  				DBHelper.addReview(store_offline.data);
  			}
  			
  			console.log('local data sent to api');
  			
  			//remove object from local storage
  			localStorage.removeItem('data');
  			console.log('local storage: ${store_offline.object_type} removed');
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
	
	//changing status of favorite/unfavorite for restaurant
	static updateFavoriteStatus(restaurantId, isFavorite){
		//console.log('changing status to: ', isFavorite);
		
		var fetchURL = 'http://localhost:1337/restaurants/' + restaurantId + '/?is_favorite=' + isFavorite;
		
		fetch(fetchURL, {
				method: 'PUT'
			})
			.then(() => {
				//console.log('changed fav status');
				this.openDatabase()
					.then(db => {
						const tx = db.transaction('restaurants', 'readwrite');
						const store = tx.objectStore('restaurants');
						//console.log('restaurantId: ' + restaurantId);
						store.get(restaurantId)
							.then(restaurant => {
								restaurant.is_favorite = isFavorite;
								store.put(restaurant);
							});
					})
			})
	}
	
	
	/*delete reviews*/
	static deleteReview(url) {
  		return fetch(url, {
    		method: 'DELETE'
  		}).then(response =>
    	response.json().then(json => {
    		console.log('delete a review');
      		return json;
    	})
  		);
	}

}

