let restaurant;
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
        mapboxToken: 'pk.eyJ1IjoiaGFycHJlZXQwMDciLCJhIjoiY2pqMnJnMHpqMG9rZDN3cjV3cXVoODQxbCJ9.ugmrtuBbPRfm5Smi4hOaEQ',
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

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

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
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage. We will also listen if the user
 * have marked the restaurant as favourite or has removed the restaurant from his/her favourite
 */
var id;
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label',`${restaurant.name} Address  is ${restaurant.address}`)
  address.innerHTML = restaurant.address;

  const favCheck = document.getElementById('favourite');
  var isFav=restaurant.is_favorite;
   if(isFav==true){
          favCheck.style.color = "green"
    }else{
          favCheck.style.color = "red"
    }
  favCheck.addEventListener('click', event => {
    favourite(event);
  });

  favCheck.addEventListener('keypress',event => {
    if (event.which == 13 || event.keyCode == 13) {
       favourite(event)
       return;
    }
    return;
  });

  function favourite(event){
      if(isFav==true){
          favCheck.style.color = "red"

          isFav=false;
  }else{
          favCheck.style.color = "green"
          isFav=true;
    }
    restaurant.is_favorite=isFav
    DBHelper.toggleFavorite(restaurant, restaurant.is_favorite);
  }


  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  imageRestaurant=DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = `${imageRestaurant}-320w.jpg 320w, ${imageRestaurant}-480w.jpg 480w, ${imageRestaurant}.jpg 800w`;
  image.sizes = "(max-width: 320px) 280px, (max-width: 480px) 440px, 800px";
  image.src = `${imageRestaurant}.jpg`;
  image.setAttribute('alt',`Image of ${restaurant.name} restaurant`)

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label',`The Cuisine of the restaurant ${restaurant.name} is ${restaurant.cuisine_type}`)
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  id=restaurant.id
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  const headerRow=document.createElement('tr');
  const dayHeader = document.createElement('th');
  dayHeader.innerHTML="Days"
  dayHeader.setAttribute('scope','col')
  const timing = document.createElement('th');
  timing.innerHTML="Timings";
  timing.setAttribute('scope','col')
  headerRow.appendChild(dayHeader)
  headerRow.appendChild(timing)
  hours.appendChild(headerRow)
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('scope','row')
    row.appendChild(day);
    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
  }
}

/**
* Whenever user submits review, firstly check if the name field is not empty
* Then get the current date time and send the json to be added to idb for caching to
* class DBHelper which will store the review in objectStore. Once the response is success then add the review
* to the page
*/
document.getElementById("review-button").addEventListener('click',(e)=>{
  e.preventDefault();
  const reviewsList = document.querySelector('#reviews-list');
  var name = document.getElementById('name').value;
  var rate = document.getElementById('rating').value;
  var comment = document.getElementById('comments').value;
  var form= document.getElementById('review-form')
  // add data to server
  if(name.length==0){
    alert('Name cant be empty')
    return;
  }

  var date=new Date()
  var utc = date.toJSON().slice(0,10).replace(/-/g,'/');
  DBHelper.postNewReview(name, id, rate, comment,date);
  const userReview = {
     'restaurant_id': id,
     'name': name,
     'rating': rate,
     'comments': comment,
     'createdAt': date
  }
  const appendReview = createReviewHTML(userReview);
  reviewsList.appendChild(appendReview);
  form.reset();
  var para=document.getElementById('thanks-para')
  para.style.display="block"
  para.style.fontWeight = "bolder";
  para.style.margin = "0 auto"
  para.style.padding="10px"
  para.style.textAlign="center"
  form.style.display="none"
})
/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
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
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.setAttribute('aria-label',`Reviewer Name ${review.name}`)
  name.className ='reviewer-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  var createdAt = new Date(review.createdAt).toJSON().slice(0,10).replace(/-/g,'/');
  date.setAttribute('aria-label',`Date of review ${createdAt}`)
  date.className='review-date';
  date.innerHTML = createdAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = 'review-rating';
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
  li.innerHTML = restaurant.name;
  li.setAttribute('role','none')
  breadcrumb.appendChild(li);
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
