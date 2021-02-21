const fire = require('./fire')
var admin = require("firebase-admin");
const db = fire.firestore();

const userRef = db.collection('users');
const hotelRef = db.collection('hotels');

async function listUsers() {

  const snapshot = await userRef.get();
  var users = []
  snapshot.forEach((doc) => {
    users.push({ ...doc.data() })
  })
  console.log(users);

}

async function getLocations(lat, lon) {

  var latitude = 0.0144927536231884;
  var longitude = 0.0181818181818182;
  // construct the GeoPoints
  const lesserGeopoint = new admin.firestore.GeoPoint(lat - (latitude * 10), lon - (longitude * 10));
  const greaterGeopoint = new admin.firestore.GeoPoint(lat + (latitude * 10), lon + (longitude * 10));

  // construct the Firestore query
  let query = hotelRef.where('location', '>', lesserGeopoint).where('location', '<', greaterGeopoint);

  // return a Promise that fulfills with the locations
  await query.get()
    .then((snapshot) => {
      const allLocs = []; // used to hold all the loc data
      snapshot.forEach((loc) => {
        // get the data
        const data = loc.data();
        // calculate a distance from the center
        // add to the array
        allLocs.push(data);
      });
      console.log(allLocs)
      return allLocs;
    })
    .catch((err) => {
      return new Error('Error while retrieving events');
    });
}

async function createUser(props) {

  const snapshot = await userRef.where('mobileno', '==', props.mobileno).get();
  if (snapshot.empty) {

    const data = {
      name: props.name,
      email: props.email,
      gender: props.gender,
      img: '',
      uid: props.uid,
      mobileno: props.mobileno,
      address: new admin.firestore.GeoPoint(props.latitude, props.longitude),
      admin: {
        hotels: []
      }
    };
    await userRef.add(data).then(async (snapshotId, err) => {
      if (!err) {
        console.log('Added document with ID: ', snapshotId.id);
        return snapshotId.id;
      }
      else {
        console.log('Unable to add user :' + err);
        return null
      }
    });
  }
  else {
    console.log('User already exists');
    return null
  }
}

async function addHotel(props) {
  const data = {
    name: props.name,
    description: props.description,
    img: props.img,
    ownerid: props.ownerid,
    workingtime: props.workingtime,
    logo: props.logo,
    mobileno: props.mobileno,
    location: new admin.firestore.GeoPoint(props.latitude, props.longitude),
  }
  const snapshot = await hotelRef.where('location', '==', data.location).where('name', '==', data.name).get();
  if (snapshot.empty) {
    await hotelRef.add(data).then(async (snapshotId, err) => {
      if (!err) {
        console.log('Added hotel with ID: ', snapshotId.id);
        await userRef.doc(props.ownerid).set({
          admin: {
            hotels: admin.firestore.FieldValue.arrayUnion(snapshotId.id)
          }
        }, {
          merge: true
        });
      }
      else {
        console.log('Unable to add hotel :' + err);
      }
      return null;
    });
  } else {
    console.log('Hotel already exists');
    return null
  }
}

async function addRoom(props,hotelId) {

  const data = {
    ...props,
    booked: false
  }
  const snapshot = await hotelRef.doc(hotelId).collection('rooms').where('rmno','==',props.rmno).get();
  if (snapshot.empty) {
    console.log('Room does not exist')
  }
  else{
    console.log('Room already exists')
  }

}

var user = {

  name: 'Alfas',
  email: 'alfas@gmail.com',
  latitude: 11.1323,
  longitude: 12.43545,
  gender: 'male',
  uid: '12345',
  mobileno: '8891584808'

}

const hotel = {
  name: 'Delicia',
  description: 'Best hotel in Malappuram',
  img: ['imagelink1', 'imagelink2', 'imagelink3'],
  ownerid: '2MO9eyee7oyDgFHzNlkA',
  workingtime: 'Opens between 9 a.m to 11 p.m from Monday to Saturday',
  logo: 'logosrc',
  mobileno: ['mobileno1', 'mobileno2'],
  latitude: 12.4434,
  longitude: 13.4343,
  // reviews: [{
  //   ownerid:'2MO9eyee7oyDgFHzNlkA',
  //   msgid:toString(Math.random*3+Date.now()),
  //   msg:'Best hotel in malappuram!',
  //   name:'Alfas',
  //   timestamp:admin.firestore.Timestamp.now(),
  //   rating:5
  // },{
  //   ownerid:'2MO9eyee7oyDgFHzNlkA',
  //   msgid:toString(Math.random*3+Date.now()),
  //   msg:'Best hotel in malappuram!',
  //   name:'Alfas',
  //   timestamp:admin.firestore.Timestamp.now(),
  //   rating:5
  // }]
};

const room = {
  ac: true,
  rmno: 87,
  rmimg: ['imgsrc1', 'imgsrc2'],
  pricing: '300₹ per night',
  description: 'Room with king sized bed'
}

// getLocations(11.23456, 12.13452);
// createUser(user);
// addHotel(hotel);
addRoom(room)