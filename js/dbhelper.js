/**
 * Common database helper functions.
 */
var dbPromise

  /* Creat a index DB version 1 with object store 'restaurants' */

  dbPromise  = idb.open('restaurant-store', 2, upgradeDB => {
  upgradeDB.createObjectStore('restaurants',{keyPath: 'id'});
  });

  /*Check if the data exist in Index DB . If it exists return all the data*/

  function fetchRestaurantsFromIndexDB(){
    return dbPromise.then(function(db) {
      if(!db) return;
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    });
   }

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEW_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }


  /* Fetch restaurant Details
  * Firstly check if the data exist in Index DB, if it exist return the data
  * Go to the network fetch the data and store the data in the index DB store.
  * Also in order the postReview method to work. We need to have field in restaurant for reviews
  * which we are fetching using the api call
  */

  static fetchRestaurants(callback){
    fetchRestaurantsFromIndexDB().then(function(restaurants){
      if(restaurants.length>0){
        return callback(null,restaurants);
      }
    fetch(DBHelper.DATABASE_URL)
    .then(function(response) {
    return response.json();
  }).then(function(restaurantsData) {
    dbPromise.then(function(db){
     if(!db) return db;
     restaurantsData.forEach(restaurant => {
    fetch(`${DBHelper.REVIEW_URL}/?restaurant_id=${restaurant.id}`).then(function(response){
                return response.json()
            }).then(function(review){
              restaurant.reviews=review;
               dbPromise.then(function(db){
          var tx = db.transaction('restaurants' , 'readwrite');
          var store = tx.objectStore('restaurants');
          restaurantsData.forEach(restaurant => store.put(restaurant));
      })
    })
          })
      return callback(null, restaurantsData);
   })
    .catch(function(error) {
      return callback(error, null);
    });
  })
  })
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
              return callback(null, restaurant);
            } else { // Restaurant does not exist in the database
              callback('Restaurant does not exist. Please try again', null);
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
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.id}`);
  }

  /**
   * Restaurant image alt.
   */
  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.alt_text}`);
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
  /**
  * Here we will store whether the restaurant has been marked as favourite or not based on the click on favourite link
  and store the result in Indexed DB
  */
  static toggleFavorite(restaurant, isFavorite) {
    fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, {
      method: 'PUT'
    })
    .then(function(response) {
    return response.json();
  }).then(function(restaurantsData) {
      dbPromise.then(function(db){
        if(!db) return db;
          var tx = db.transaction('restaurants' , 'readwrite');
          var store = tx.objectStore('restaurants');
          //console.log(isFavorite)
          store.put(restaurant)
      })
      return data;
    })
    .catch(function(error) {
      //console.log("dajdanjkda"+isFavorite)
      restaurant.is_favorite=isFavorite;
      dbPromise.then(function(db){
        if(!db) return db;
          var tx = db.transaction('restaurants' , 'readwrite');
          var store = tx.objectStore('restaurants');
          store.put(restaurant)
      }).catch(error => {
        return;
      });
    });
  }

  /**
  * Here we will store user's restaurant review based on the form submission
  and store the result in Indexed DB
  */
  static postNewReview(name, id, rate, comment,createdAt) {
    var payload = {};
    payload.restaurant_id = id;
    payload.name = name;
    payload.rating = rate;
    payload.comments = comment;
    payload.createdAt=createdAt;
    payload.id=id
    payload.updatedAt=createdAt
    var json = JSON.stringify(payload);
    fetch(`${DBHelper.REVIEW_URL}/`, {
      method: 'POST',
      body: payload
    })
    .then(function(response) {
    return response.json();
  }).then(function(restaurantsData) {
      dbPromise.then(function(db){
        if(!db) return db;
     var tx = db.transaction('restaurants' , 'readwrite');
     var store = tx.objectStore('restaurants');
      return store.get(parseInt(id)).then(restaurant => {
        restaurant.reviews.push(payload);
        let restaurantStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        restaurantStore.put(restaurant);
        return restaurantStore.complete;
    });
    })
    }).catch(function(error) {
      dbPromise.then(function(db){
        if(!db) return db;
        var tx = db.transaction('restaurants' , 'readwrite');
        var store = tx.objectStore('restaurants');
      return store.get(parseInt(id)).then(restaurant => {
        restaurant.reviews.push(payload);
        let restaurantStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        restaurantStore.put(restaurant);
      }).catch(error => {
        return;
      });
    });
  })
}
}