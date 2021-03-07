/* eslint-disable space-before-function-paren */
/* eslint-disable no-unused-vars */
const fire = require('./fire')
const admin = require('firebase-admin')
const db = fire.firestore()

const userRef = db.collection('users')
const hotelRef = db.collection('hotels')

async function listUsers() {
  const snapshot = await userRef.get()
  const users = []
  snapshot.forEach((doc) => {
    users.push({ ...doc.data() })
  })
  console.log(users)
}

async function getLocations(lat, lon) {
  // approximte values for a mile
  const latitude = 0.0144927536231884
  const longitude = 0.0181818181818182
  // construct the GeoPoints
  const lesserGeopoint = new admin.firestore.GeoPoint(lat - (latitude * 10), lon - (longitude * 10))
  const greaterGeopoint = new admin.firestore.GeoPoint(lat + (latitude * 10), lon + (longitude * 10))

  // construct the Firestore query
  const query = hotelRef.where('location', '>', lesserGeopoint).where('location', '<', greaterGeopoint)

  const allLocs = [] // used to hold all the loc data
  // return a Promise that fulfills with the locations
  const snapshot = await query.get()
  const length = snapshot.size

  for (let i = 0; i < length; i++) {
    const roomSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('rooms').get()
    const foodSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('foods').get()
    if (roomSnapshot.size > 0 && foodSnapshot.size > 0) {
      allLocs.push({ id: snapshot.docs[i].id, ...snapshot.docs[i].data() })
    }
  }
  return allLocs
}

async function createUser(props) {
  const snapshot = await userRef.where('mobileno', '==', props.mobileno).get()
  if (snapshot.empty) {
    const data = {
      name: props.name,
      email: props.email,
      uid: props.uid,
      mobileno: props.mobileno,
      address: new admin.firestore.GeoPoint(props.latitude, props.longitude),
      admin: {
        hotels: []
      },
      cart: []
    }

    await userRef.add(data).then(async (snapshotId, err) => {
      if (!err) {
        console.log('Added document with ID: ', snapshotId.id)
        return snapshotId.id
      } else {
        console.log('Unable to add user :' + err)
        return null
      }
    })
  } else {
    console.log('User already exists')
    return null
  }
}

async function addHotel(props, rooms, foods) {
  const data = {
    name: props.name,
    description: props.description,
    img: props.img,
    ownerid: props.ownerid,
    mobileno: props.mobileno,
    rating: 0,
    totalrating: 0,
    location: new admin.firestore.GeoPoint(props.latitude, props.longitude)
  }
  const snapshot = await hotelRef.where('location', '==', data.location).where('name', '==', data.name).get()
  if (snapshot.empty) {
    await hotelRef.add(data).then(async (doc, err) => {
      if (!err) {
        console.log('Added hotel with ID: ', doc.id)
        await userRef.doc(props.ownerid).set({
          admin: {
            hotels: admin.firestore.FieldValue.arrayUnion(doc.id)
          }
        }, {
          merge: true
        }).then(async () => {
          for (let i = 0; i < rooms.length; i++) {
            await hotelRef.doc(doc.id).collection('rooms').add(rooms[i])
          }
          for (let i = 0; i < foods.length; i++) {
            await hotelRef.doc(doc.id).collection('foods').add(foods[i])
          }
        }
        )
        return 'success'
      } else {
        console.log('Unable to add hotel :' + err)
      }
      return null
    })
  } else {
    console.log('Hotel already exists')
    return null
  }
}

async function getHotels(props) {
  const hotels = []
  if (props.all === true) {
    const hotelAll = await getLocations(props.lat, props.lon)
    for (let i = 0; i < hotelAll.length; i++) {
      const roomSnap = await hotelRef.doc(hotelAll[i].id).collection('rooms').get()
      const reviewSnap = await hotelRef.doc(hotelAll[i].id).collection('reviews').get()
      const foodSnap = await hotelRef.doc(hotelAll[i].id).collection('foods').get()
      const rooms = []
      const foods = []
      const reviews = []
      roomSnap.docs.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() })
      })

      reviewSnap.docs.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() })
      })

      foodSnap.docs.forEach((doc) => {
        foods.push({ id: doc.id, ...doc.data() })
      })
      hotelAll[i].rooms = rooms
      hotelAll[i].reviews = reviews
      hotelAll[i].foods = foods
    }
    return hotelAll
  }
  if (props.food === true) {
    // approximte values for a mile
    const latitude = 0.0144927536231884
    const longitude = 0.0181818181818182
    // construct the GeoPoints
    const lesserGeopoint = new admin.firestore.GeoPoint(props.lat - (latitude * 10), props.lon - (longitude * 10))
    const greaterGeopoint = new admin.firestore.GeoPoint(props.lat + (latitude * 10), props.lon + (longitude * 10))

    const snapshot = await hotelRef.where('location', '>', lesserGeopoint).where('location', '<', greaterGeopoint).get()

    const length = snapshot.size

    for (let i = 0; i < length; i++) {
      const roomSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('rooms').get()
      const foodSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('foods').get()
      if (roomSnapshot.size === 0 && foodSnapshot.size > 0) {
        hotels.push({ id: snapshot.docs[i].id, ...snapshot.docs[i].data() })
      }
    }
    for (let i = 0; i < hotels.length; i++) {
      const roomSnap = await hotelRef.doc(hotel[i].id).collection('rooms').get()
      const reviewSnap = await hotelRef.doc(hotel[i].id).collection('reviews').get()
      const foodSnap = await hotelRef.doc(hotel[i].id).collection('foods').get()
      const rooms = []
      const foods = []
      const reviews = []
      roomSnap.docs.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() })
      })

      reviewSnap.docs.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() })
      })

      foodSnap.docs.forEach((doc) => {
        foods.push({ id: doc.id, ...doc.data() })
      })
      hotel[i].rooms = rooms
      hotel[i].reviews = reviews
      hotel[i].foods = foods
    }
    return hotels
  }
  if (props.room === true) {
    // approximte values for a mile
    const latitude = 0.0144927536231884
    const longitude = 0.0181818181818182
    // construct the GeoPoints
    const lesserGeopoint = new admin.firestore.GeoPoint(props.lat - (latitude * 10), props.lon - (longitude * 10))
    const greaterGeopoint = new admin.firestore.GeoPoint(props.lat + (latitude * 10), props.lon + (longitude * 10))

    const snapshot = await hotelRef.where('location', '>', lesserGeopoint).where('location', '<', greaterGeopoint).get()

    const length = snapshot.size

    for (let i = 0; i < length; i++) {
      const roomSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('rooms').get()
      const foodSnapshot = await hotelRef.doc(snapshot.docs[i].id).collection('foods').get()
      if (roomSnapshot.size > 0 && foodSnapshot.size > 0) {
        hotels.push({ id: snapshot.docs[i].id, ...snapshot.docs[i].data() })
      }
    }
    for (let i = 0; i < hotels.length; i++) {
      const roomSnap = await hotelRef.doc(hotels[i].id).collection('rooms').get()
      const reviewSnap = await hotelRef.doc(hotels[i].id).collection('reviews').get()
      const foodSnap = await hotelRef.doc(hotels[i].id).collection('foods').get()
      const rooms = []
      const foods = []
      const reviews = []
      roomSnap.docs.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() })
      })

      reviewSnap.docs.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() })
      })

      foodSnap.docs.forEach((doc) => {
        foods.push({ id: doc.id, ...doc.data() })
      })
      hotels[i].rooms = rooms
      hotels[i].reviews = reviews
      hotels[i].foods = foods
    }
    return hotels
  }
}

async function viewHotel(userId) {
  const hotels = []
  const snapshot = await userRef.doc(userId).get()
  const data = snapshot.data()
  const length = data.admin.hotels.length
  for (let i = 0; i < length; i++) {
    const hotelSnapshot = await hotelRef.doc(data.admin.hotels[i]).get()
    const roomSnapshot = await hotelRef.doc(data.admin.hotels[i]).collection('rooms').get()
    const foodSnapshot = await hotelRef.doc(data.admin.hotels[i]).collection('foods').get()
    const rooms = []
    const foods = []
    roomSnapshot.docs.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() })
    })

    foodSnapshot.docs.forEach((doc) => {
      foods.push({ id: doc.id, ...doc.data() })
    })
    hotels.push(hotelSnapshot.data())
    hotels[i].rooms = rooms
    hotels[i].foods = foods
  }

  return hotels
}

async function removeHotel(hotelId) {
  await hotelRef.doc(hotelId).delete()
}

async function addReview(props) {
  const hotelSnapshot = hotelRef.doc(props.hotelId)

  const hoteldata = await hotelSnapshot.get()
  const hoteldata1 = hoteldata.data()
  const snapshot = await hotelSnapshot.collection('reviews').where('authorid', '==', props.authorid).get()
  if (snapshot.empty) {
    const data = {
      ...props,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }
    await hotelSnapshot.collection('reviews').add(data)
    const reviewSnap = hotelSnapshot.collection('reviews').get()
    const size = await (await reviewSnap).size
    await hotelRef.doc(props.hotelId).set({
      rating: (hoteldata1.totalrating + props.rating) / size,
      totalrating: hoteldata1.totalrating + props.rating
    }, {
      merge: true
    })
    console.log('Review Added')
    return true
  } else {
    console.log('review already exists')
    return false
  }
}

async function orderMeal(params) {

}

async function editHotel(props, editRooms, removeRooms, addRooms, editFoods, removeFoods, addFoods) {
  try {
    const data = {
      name: props.name,
      description: props.description,
      img: props.img,
      mobileno: props.mobileno,
      location: new admin.firestore.GeoPoint(props.latitude, props.longitude)
    }
    await hotelRef.doc(props.hotelId).set(data, { merge: true })
    for (let i = 0; i < removeRooms.length; i++) {
      await hotelRef.doc(props.hotelId).collection('rooms').doc(removeRooms[i]).delete()
    }
    for (let i = 0; i < removeFoods.length; i++) {
      await hotelRef.doc(props.hotelId).collection('foods').doc(removeFoods[i]).delete()
    }
    for (let i = 0; i < addRooms.length; i++) {
      await hotelRef.doc(props.hotelId).collection('rooms').add(addRooms[i])
    }
    for (let i = 0; i < addFoods.length; i++) {
      await hotelRef.doc(props.hotelId).collection('foods').add(addFoods[i])
    }

    for (const food of editFoods) {
      await hotelRef.doc(props.hotelId).collection('foods').doc(food.id).set({
        description: food.description,
        name: food.name,
        price: food.price
      }, { merge: true })
    }
    for (let i = 0; i <= editRooms.length; i++) {
      await hotelRef.doc(props.hotelId).collection('rooms').doc(editRooms[i].id).set({
        description: editRooms[i].description,
        isbooked: editRooms[i].isbooked,
        name: editRooms[i].name,
        price: editRooms[i].price
      }, { merge: true })
    }

    return true
  } catch {
    return false
  }
}

async function viewUser(mobileno) {
  const snapshot = await userRef.where('mobileno', '==', mobileno).get()
  const users = []
  snapshot.forEach((doc) => {
    users.push({ ...doc.data() })
  })
  return users[0]
}

async function addToCart(props, items) {
  if (props.food === true) {
    await userRef.doc(props.userId).collection('cart').add({
      food: true,
      hotelId: props.hotelId,
      foods: items
    })
  }
  if (props.food === false) {
    await userRef.doc(props.userId).collection('cart').add({
      food: false,
      hotelId: props.hotelId,
      rooms: items
    })
  }
}

async function viewCart(userId) {
  const cart = []
  const temp = []
  const snapshot = await userRef.doc(userId).collection('cart').get()
  snapshot.forEach((doc) => {
    temp.push({ id: doc.id, ...doc.data() })
  })
  const l1 = temp.length
  for (let i = 0; i < l1; i++) {
    if (temp[i].food === true) {
      // console.log(temp[i])
      const l2 = temp[i].foods.length
      for (let j = 0; j < l2; j++) {
        const foodRef = await hotelRef.doc(temp[i].hotelId).collection('foods').doc(temp[i].foods[j].foodid).get()
        cart.push({ ...foodRef.data(), count: temp[i].foods[j].count, foodid: foodRef.id, food: true })
      }
    }
    if (temp[i].food === false) {
      const l2 = temp[i].rooms.length
      // for (let j = 0; j < l2.length; j++) {
      //   console.log('hello')
      // }
      for (const room of temp[i].rooms) {
        const roomRef = await hotelRef.doc(temp[i].hotelId).collection('rooms').doc(room).get()
        cart.push({ ...roomRef.data(), id: roomRef.id, food: false })
      }
    }
  }
  return cart
}

const user = {

  name: 'Alfas',
  email: 'alfas@gmail.com',
  latitude: 11.1323,
  longitude: 12.43545,
  uid: '12345',
  mobileno: '889158480812'

}

const review = {
  authorid: '04UoKZbrgGypkZ9XLucq',
  author: 'Alfas',
  content: 'Food was great,especially the Biriyani',
  rating: 4,
  hotelId: 'Ep2jvPkamOQAZQFFN0AK'

}

const hotel = {
  name: 'Hotel Airline',
  description: ' Second Best hotel in Malappuram',
  img: 'imgsrc',
  ownerid: '04UoKZbrgGypkZ9XLucq',
  mobileno: '8891594908',
  latitude: 12.4434,
  longitude: 13.4343
}

const hotelcategory = {
  all: true,
  food: false,
  room: false,
  lat: 11.0444224,
  lon: 76.0786785
}

const hoteldetails = {
  name: 'Hotel Rahmath',
  description: 'Best hotel in Kozhikode',
  img: 'https://firebasestorage.googleapis.com/v0/b/hotel-hunt-4e835.appspot.com/o/delicia.png?alt=media&token=1d672882-6744-41bb-a746-22065e77439e',
  mobileno: '8891584808',
  latitude: 12.4434,
  longitude: 13.4343,
  hotelId: 'Ep2jvPkamOQAZQFFN0AK'

}

const editRooms = [{
  id: 'MXiWbceVdocOTWvX9TgE',
  description: 'check in at 9:00 am and check out 8:00 am',
  isbooked: false,
  name: '2 rooms 2 kitchen 2 bathrooms',
  price: 362
}]

const removeRooms = ['iXYWcUPEcnZEnhLer7ih']

const addRooms = [{
  description: 'check in at 9:00 am and check out 8:00 am',
  isbooked: false,
  name: '3 rooms 3 kitchen 3 bathrooms',
  price: 251
}]

const editFoods = [{
  id: 'T9nXOnYOlzslNNQX8vzk',
  description: 'good',
  name: 'Samoosa',
  price: 11
}]

const removeFoods = ['Ai1qXoErUc29Nk9CiBGN']

const addFoods = [{
  description: 'good',
  name: 'Samoosa',
  price: 11
}]

const cart = {
  userId: '04UoKZbrgGypkZ9XLucq',
  hotelId: 'Ep2jvPkamOQAZQFFN0AK',
  food: true
}

const items = [{ count: 1, foodid: 'Ai1qXoErUc29Nk9CiBGN' }, { count: 3, foodid: 'T9nXOnYOlzslNNQX8vzk' }]

// getHotels(hotelcategory).then((v) => {
//   console.dir(v, { depth: null })
// })

// const room = {
//   ac: true,
//   rmno: 87,
//   rmimg: ['imgsrc1', 'imgsrc2'],
//   pricing: '300₹ per night',
//   description: 'Room with king sized bed'
// }

// getLocations(11.23456, 12.13452);
// createUser(user);
// addHotel(hotel, [{ name: 'helo' }, { name: 'not hello' }], [])
// viewHotel('04UoKZbrgGypkZ9XLucq')
// removeHotel('It2maEFxBnKGsFH6cj4M')
// addReview(review)
// editHotel(hoteldetails, editRooms, removeRooms, addRooms, editFoods, removeFoods, addFoods)
// viewUser('8891584808').then((usr) => console.log(usr))
// addToCart(cart, items)
// viewCart('04UoKZbrgGypkZ9XLucq')
