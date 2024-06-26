const express = require("express");
const bodyParser = require('body-parser');
const port = 8080;
const cors = require('cors');
const cron = require('./cron');
const fs = require('fs');

var clients = {};
var trucksId = {};
var stopData = {};
var truckClient = {};
var notifi = {};

const jwt = require('jsonwebtoken');
const config = require('./config/otherConfig.json')
const secretKey = config.header.secret_key;
const middleware = require('./common/Utility')

const truck = require('./models/truck')
const user = require('./models/user')
const vendor = require('./models/vendor')
const country = require('./models/country')
// const state = require('./models/state')
// const city = require('./models/city')
const sequelize = require('./models/index');
const translation = require('./models/translation')
const translationsData = require('./utils/language.json')
const favTruck = require('./models/favourite_truck');
const rate_truck = require("./models/rate_truck")
const report_data = require("./models/report_data")
const avatar = require('./models/avatar')

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const userRoute = require('./routes/user_routes');
const vendorRoute = require('./routes/vendor_routes');
const commonRoute = require('./routes/common_routes')
const adminRoute = require('./routes/admin_routes');
const { where } = require("sequelize");
const truckRingtone = require("./models/truck_ringtone");
const rington = require("./models/ringtone");

app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('images'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '3mb', extended: true }));
app.use(cors("*"));

app.get('/', async (req, res) => {

  // const keys = Object.keys(translationsData);
  // const translations = keys.map(key => ({
  //   name: key, // Using the key as the value for the 'name' column
  //   en_name: translationsData[key].en,
  //   es_name: translationsData[key].es,
  // }));

  //   for (const key in translationsData) {
  //     if (translationsData.hasOwnProperty(key)) {
  //         const enValue = translationsData[key]["en"];
  //         const esValue = translationsData[key]["es"];
  //         translation.create({name: key, en_value: translationsData[key]["en"], es_value: translationsData[key]["es"]})
  //         console.log(key + ": " + enValue + " - " + esValue);
  //     }
  // }

  res.render('index.pug');
});

app.use('/api/dev/user', userRoute);
app.use('/api/dev/vendor', vendorRoute);
app.use('/api/dev/admin', adminRoute);
app.use('/api/dev', commonRoute);

io.on('connection', async (socket) => {
  const userId = socket.id;
  console.log("Socket ID : ", userId);
  let userTruckTimeout, userTimeout, truckTimeout, userActiveTruckTimeout;

  socket.on('API', async (msg) => {
    console.log(msg)
    // console.log(clients)
    try {
      const data = JSON.parse(msg);

      // Clear existing interval, if any
      if (userTruckTimeout) {
        clearTimeout(userTruckTimeout);
      }

      if (userActiveTruckTimeout) {
        clearTimeout(userActiveTruckTimeout);
      }

      if (userTimeout) {
        clearTimeout(userTimeout);
      }

      if (truckTimeout) {
        clearTimeout(truckTimeout);
      }

      const tokenMsg = verifyTokenMsg(data.token);
      if (tokenMsg == "Invalid Token") {
        return socket.emit('APIResponse', JSON.stringify({
          success: false,
          status_code: 400,
          message: 'Invalid Token',
          data: [],
        }));
      }
      if (data.endPoint == '/vendorLocation' || data.endPoint == '/getUserTrucks' || data.endPoint == '/getActiveUserTrucks' || data.endPoint == '/getUserDetails' || data.endPoint == '/takeUturn' || data.endPoint == '/stopTrucks') {
        if (
          typeof data.id === 'string' &&
          typeof data.lat === 'string' &&
          typeof data.long === 'string' &&
          typeof data.endPoint === 'string'
        ) {
          switch (data.endPoint) {
            case '/vendorLocation':
              await truck.update({ is_online: true }, { where: { truck_id: data.id } })
              for (const key in trucksId) {
                if (data.id == trucksId[key]) {
                  delete trucksId[userId];
                }
              }
              trucksId[userId] = data.id;
              await updateVendorLocation(data.lat, data.long, data.id, socket)
              break;
            case '/getUserTrucks':
              clients[`${userId}`] = data.id;
              if (typeof data.isCompass === 'string') {
                // myInterval = setInterval(async function () {
                //   await getUserTrucks(data.lat, data.long, data.id, data.isCompass, socket);
                // }, 15000);
                const getData = async () => {
                  await getUserTrucks(data.lat, data.long, data.id, data.isCompass, socket);
                  userTruckTimeout = setTimeout(getData, 15000);
                };
                getData();
              } else {
                return emitError(socket);
              }
              break;
            case '/getActiveUserTrucks':
              const getData = async () => {
                await getUserActiveTrucks(data.lat, data.long, data.id, socket)
                userActiveTruckTimeout = setTimeout(getData, 15000);
              };
              getData();
              break;
            case '/getUserDetails':
              // await getAllUsersStatus(socket);
              break;
            case '/takeUturn':
              if (typeof data.truckIds === 'string') {
                await uTurn(data.lat, data.long, data.id, data.truckIds, socket);
              } else {
                return emitError(socket);
              }
              break;
            case '/stopTrucks':
              await stop(data.lat, data.long, data.id, socket);
              break;
            default:
              return emitError(socket);
              break;
          }
        } else {
          return emitError(socket);
        }
      }
      if (data.endPoint == '/getAllUsers' || data.endPoint == '/getAllTrucks') {
        if (
          typeof data.endPoint === 'string'
        ) {
          switch (data.endPoint) {
            case '/getAllUsers':
              const getUserData = async () => {
                await getAllUsers(socket)
                userTimeout = setTimeout(getUserData, 10000);
              };
              getUserData();
              break;
            case '/getAllTrucks':
              const getTruckData = async () => {
                await getAllTrucks(socket)
                truckTimeout = setTimeout(getTruckData, 10000);
              };
              getTruckData();
              break;
            default:
              return emitError(socket);
              break;
          }
        } else {
          return emitError(socket);
        }
      }
    } catch (error) {
      console.log(error);
      return emitError(socket);
    }
  })
  // {"endPoint":"/getAllUsers"}
  socket.on('disconnect', async (reason) => {
    console.log('User disconnected:', socket.id);
    console.log('Reason:', reason);
    notifi = {};
    delete clients[userId];
    if (trucksId[userId]) {
      await truck.update({ is_online: false }, { where: { truck_id: trucksId[userId] } })
    }
    delete trucksId[userId];
    clearTimeout(userTruckTimeout);
    clearTimeout(userActiveTruckTimeout);
    clearTimeout(userTimeout);
    clearTimeout(truckTimeout);
  });
});

async function uTurn(lat, long, id, ids, socket) {
  try {
    const uturnIds = JSON.parse(ids);
    uturnIds.forEach(async truckId => {
      let truckData = await truck.findOne({
        attributes: ['fcm_token'],
        where: { truck_id: truckId }
      })
      middleware.CustomNotification("U-Turn Alert", `User is requesting U-Turn`, truckData.fcm_token, "default")
    })

    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Successfully Notified For U-Turn',
      stop_data: [],
    }));

  } catch (error) {
    console.log(error);
  }
}

const clearStopData = () => {
  stopData = {};
}

async function stop(lat, long, userId, socket) {
  try {
    const radius = 10; // 20km radius

    const userLat = lat;
    const userLong = long;

    const query = `SELECT truck_id, truck_name, username, lat, \`long\`, avatar_id FROM truck HAVING ${radius} >= (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(lat)) * COS(RADIANS(\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(lat))))`;
    sequelize.query(query, {
      replacements: { userLat, userLong },
      type: sequelize.QueryTypes.SELECT,
    })
      .then(async trucks => {

        let favTrucks = await favTruck.findAll({ where: { user_id: userId } })
        const favTruckIds = favTrucks.map(favTruck => favTruck.truck_id);
        const length = favTruckIds.length;

        const truckIds = trucks.map(truck => truck.truck_id)

        console.log("favTrucks", favTruckIds)
        console.log("Trucks", truckIds)

        var stopIds;

        if (length >= 3) {
          stopIds = favTruckIds
        } else {
          stopIds = truckIds
        }

        // stopIds = JSON.parse(ids);
        // console.log("stopId----->", stopIds)
        // console.log("truckids---->", trucksId)
        stopData[userId] == {}
        truckClient = {}
        stopIds.forEach(id => {
          if (Object.keys(trucksId).length === 0) {
            truckClient[id] = "Inactive";
          } else {
            for (const key in trucksId) {
              if (id == trucksId[key]) {
                truckClient[id] = key;
              } else {
                truckClient[id] = "Inactive";
              }
            }
          }
        })
        stopData[userId] = {};
        stopData[userId] = truckClient;
        console.log("stopData----->", stopData)
      })

    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Successfully Stopped',
      stop_data: [],
    }));

  } catch (error) {
    console.log(error);
  }
}

async function endRoute(lat, long, id, socket) {
  try {
    await truck.update({ lat: lat, long: long }, { where: { truck_id: parseInt(id) } })
    let truckDetail = await truck.findOne({ where: { truck_id: id } })
    const allUsers = await user.findAll()

    for (const data of allUsers) {
      const userLat = data.lat;
      const userLong = data.long;
      const userId = data.user_id;

      if (notifi[userId + id]) {
        notifi[userId + id] = false;
      }

    }

    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'End Route Successfull',
      end_data: [],
    }));
  } catch (error) {
    console.log(error);
    // return emitError(socket);
  }
}

async function updateVendorLocation(lat, long, id, socket) {
  try {
    await truck.update({ lat: lat, long: long }, { where: { truck_id: parseInt(id) } })
    let truckDetail = await truck.findOne({ where: { truck_id: id } })
    const allUsers = await user.findAll()

    for (const data of allUsers) {
      const userLat = data.lat;
      const userLong = data.long;
      const userId = data.user_id;

      const distance = calculateDistanceMiles(userLat, userLong, lat, long)
      // console.log("Distance", distance)
      // console.log("Notifi", notifi[userId])
      if (!notifi[userId]) {
        if (distance <= truckDetail.first_alert) {
          notifi[userId] = true;

          let result = await truckRingtone.findOne({
            where: {
              truck_id: id,
              user_id: userId
            },
            attributes: ["ringtone_id"]
          })

          var ringtoneName;
          let ringtone;
          if (result) {
            console.log("Here", result.ringtone_id)
            ringtone = await rington.findOne({ where: { ringtone_id: result.ringtone_id }, attributes: ["en"] });
          } else {
            console.log("Here", data.ringtone_id)
            ringtone = await rington.findOne({ where: { ringtone_id: data.ringtone_id }, attributes: ["en"] })
          }
          ringtoneName = ringtone.en;
          console.log(ringtoneName)
          if (distance <= truckDetail.second_alert) {
            if (data.fcm_token) {
              middleware.CustomNotification("Truck Alert", `${truckDetail.truck_name} is pretty close to you`, data.fcm_token, ringtoneName)
            }
          } else {
            if (data.fcm_token) {
              middleware.CustomNotification("Truck Alert", `${truckDetail.truck_name} is in your neighbourhood`, data.fcm_token, ringtoneName)
            }
          }
        }
      }
    }

    await getAllUsersStatus(id, lat, long, socket)
    // return socket.emit('APIResponse', JSON.stringify({
    //   success: true,
    //   status_code: 200,
    //   message: 'Location Saved!',
    //   location_data: [],
    // }));
  } catch (error) {
    console.log(error);
    // return emitError(socket);
  }
}

async function getAllUsersStatus(id, truckLat, truckLong, socket) {
  try {
    const radius = 10;

    const query = `SELECT user_id, lat, \`long\`, isCompass
    FROM user HAVING
    ${radius} >= (6371 * acos(cos(radians(:truckLat)) * cos(radians(lat)) * cos(radians(\`long\`) - radians(:truckLong)) + sin(radians(:truckLat)) * sin(radians(lat))));`
    console.log(clients)
    sequelize.query(query, {
      replacements: { truckLat, truckLong },
      type: sequelize.QueryTypes.SELECT,
    })
      .then(async userData => {

        for (const data of userData) {
          if (Object.keys(clients).length === 0) {
            data.status = 0;
          } else {
            let isActive = false;
            // console.log(clients)
            for (const key in clients) {
              if (data.user_id == clients[key]) {
                // console.log(clients[key])
                isActive = true;
                if (stopData.hasOwnProperty(data.user_id)) {
                  var dataL = stopData[data.user_id];
                  if (dataL.hasOwnProperty(id)) {
                    let truckData = await truck.findOne({ attributes: ['second_alert'], where: { truck_id: id } })
                    const distance = calculateDistanceMiles(truckLat, truckLong, data.lat, data.long)
                    console.log(`${truckLat}  ${truckLong}  ${data.lat}  ${data.long}`)
                    // console.log(distance)
                    // console.log(truckData.second_alert)
                    if (distance <= truckData.second_alert) {
                      // console.log(dataL[id])
                      delete dataL[id];
                      // console.log(stopData)
                      data.status = 1;
                    } else {
                      data.status = 2;
                    }
                  } else {
                    data.status = 1;
                  }
                } else {
                  // console.log("Active")
                  data.status = 1;
                }
                break; // No need to continue checking other clients
              }
            }
            if (!isActive) {
              // console.log("Active Not")
              data.status = 0;
            }
          }
        }

        // {"id":"17","lat":"22.7534252","long":"75.8653841","endPoint":"/vendorLocation","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuZHJvaWRAbWFpbGluYXRvci5jb20iLCJ2ZW5kb3JfaWQiOjEwLCJleHAiOjE3MTA1NzE3MDQsImlhdCI6MTcxMDQ4NTMwNH0.L4NkFQMqcnT0lmZDZ7PBTVCeUpn8laXSZIb8oeNEJDk"}

        return socket.emit('APIResponse', JSON.stringify({
          success: true,
          status_code: 200,
          message: 'Users Fetched Successfully',
          userData: userData,
        }));
      })
  } catch (error) {
    console.log(error);
    return socket.emit('APIResponse', JSON.stringify({
      success: false,
      status_code: 200,
      message: 'Error',
      userData: [],
    }));
    // return emitError(socket);
  }
}

async function getAllUsers(socket) {
  try {
    let data = await user.findAll({
      attributes: ['user_id', 'lat', 'long']
    })
    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Users Fetched Successfully',
      userData: data,
    }));
  } catch (error) {
    console.log(error);
    return socket.emit('APIResponse', JSON.stringify({
      success: false,
      status_code: 200,
      message: 'Error',
      userData: [],
    }));
    // return emitError(socket);
  }
}

async function getAllTrucks(socket) {
  try {
    let data = await truck.findAll({
      attributes: ['truck_id', 'vendor_id', 'username', 'lat', 'long']
    })
    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Trucks Fetched Successfully',
      truckData: data,
    }));
  } catch (error) {
    console.log(error);
    // return emitError(socket);
  }
}

async function getAllVendors(socket) {
  try {
    let data = await vendor.findAll({
      attributes: ['vendor_id', 'username', 'email', 'is_deleted', 'is_blocked', 'is_suspended', 'suspend_msg']
    })
    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Vendors Fetched Successfully',
      vendorData: data,
    }));
  } catch (error) {
    console.log(error);
    return emitError(socket);
  }
}

async function getUserTrucks(lat, long, id, isCompass, socket) {

  let userData = await user.findOne({ where: { user_id: id } })

  // console.log(userData)
  var userLat, userLong;
  if (userData) {
    userLat = userData.lat;
    userLong = userData.long;
  }
  // console.log(userLat)
  // console.log(userLong)
  if (isCompass == "1") {
    await user.update({ isCompass: true }, { where: { user_id: id } })
  } else {
    await user.update({ isCompass: false }, { where: { user_id: id } })
  }

  const radius = 10; // 20km radius
  var favTruckCount;

  const query = `SELECT truck_id, truck_name, username, lat, \`long\`, avatar_id, vendor_id, avatar_approved, avatar_url, thumbnail_url FROM truck HAVING ${radius} >= (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(lat)) * COS(RADIANS(\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(lat))))`;
  sequelize.query(query, {
    replacements: { userLat, userLong },
    type: sequelize.QueryTypes.SELECT,
  })
    .then(async trucks => {

      let favTrucks = await favTruck.findAll({ where: { user_id: id } })
      if (favTrucks.length == 0) {
        favTruckCount = 0;
      } else {
        favTruckCount = favTrucks.length;
      }
      const favTruckIds = favTrucks.map(favTruck => favTruck.truck_id);
      console.log("TruckIDS", trucksId)

      for (const truck of trucks) {
        console.log("Trucks", truck.truck_id)
        var currentDistance = calculateDistance(userLat, userLong, truck.lat, truck.long)
        if (currentDistance <= truck.u_turn) {
          await truck.update({ last_distance: currentDistance }, { where: { truck_id: truck.truck_id } })
          if (currentDistance > truck.last_distance) {
            truck.u_turn = true
          } else {
            truck.u_turn = false
          }
        } else {
          truck.u_turn = false
        }

        truck.in_proximity = true;

        if (favTruckIds.includes(truck.truck_id)) {
          truck.is_fav = true;
        } else {
          truck.is_fav = false;
        }

        const [userRating, rateDetail, reportData, avatarData, vendorData] = await Promise.all([
          rate_truck.findOne({
            attributes: ['star_count'],
            where: { user_id: id, truck_id: truck.truck_id }
          }),
          rate_truck.findAll({ where: { truck_id: truck.truck_id } }),
          report_data.findOne({ where: { user_id: id, truck_id: truck.truck_id } }),
          avatar.findOne({ where: { avatar_id: truck.avatar_id } }),
          vendor.findOne({ attributes: ['company_name'], where: { vendor_id: truck.vendor_id } })
        ]);

        truck.company_name = vendorData.company_name

        truck.user_rating = userRating?.star_count || 0;

        const countOfResult = rateDetail.length;

        let totalRating = 0;
        for (let i = 0; i < rateDetail.length; i++) {
          totalRating += rateDetail[i].star_count;
        }

        const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;

        truck.average_rating = parseFloat(averageRating.toFixed(2));

        if (reportData) {
          truck.report_id = reportData.msg_id;
        } else {
          truck.report_id = 0;
        }

        if (truck.avatar_approved == 2) {
          truck.image_url = truck.avatar_url;
          truck.thumbnail = truck.thumbnail_url;
        } else {
          truck.image_url = avatarData.image_url;
          truck.thumbnail = avatarData.thumbnail;
        }
      }
      const uniqueTruckIds = {};
      for (const key in trucksId) {
        uniqueTruckIds[trucksId[key]] = true;
      }
      console.log("UniqueTrucks", uniqueTruckIds)

      var filteredTrucks = [];
      // for (const key in trucksId) {
      //   const filtered = trucks.filter(truck => trucksId[key] == truck.truck_id);
      //   filteredTrucks.push(...filtered);
      // }
      for (const key in uniqueTruckIds) {
        const filtered = trucks.filter(truck => key == truck.truck_id);
        filteredTrucks.push(...filtered);
      }
      const unfilteredTruckCount = Object.keys(uniqueTruckIds).length - filteredTrucks.length;

      // console.log(filteredTrucks)
      return socket.emit('APIResponse', JSON.stringify({
        success: true,
        status_code: 200,
        message: 'Trucks Fetched Successfully',
        fav_truck_count: favTruckCount,
        active_truck_count: unfilteredTruckCount,
        truck_data: filteredTrucks,
      }));
    })
    .catch(error => {
      console.error('Error:', error);
      // return emitError(socket);
    })
}

async function getUserActiveTrucks(lat, long, id, socket) {
  try {
    let userData = await user.findOne({ where: { user_id: id } })

    var userLat, userLong;
    if (userData) {
      userLat = userData.lat;
      userLong = userData.long;
    }

    const truckIds = Object.values(trucksId);
    const uniqueTruckIds = [...new Set(truckIds)];
    let activeTruckCount;
    if (uniqueTruckIds.length == 0) {
      activeTruckCount = 0;
    } else {
      activeTruckCount = uniqueTruckIds.length;
    }

    let favTrucks = await favTruck.findAll({ where: { user_id: id } })
    var favTruckCount;
    if (favTrucks.length == 0) {
      favTruckCount = 0;
    } else {
      favTruckCount = favTrucks.length;
    }

    const favTruckIds = favTrucks.map(favTruck => favTruck.truck_id);

    const resultArray = [];

    for (const value of uniqueTruckIds) {
      let truckData = await truck.findOne({
        where: { truck_id: value },
        attributes: ["truck_id", "truck_name", "username", "lat", "long", "avatar_id", "vendor_id", "avatar_approved", "avatar_url", "thumbnail_url"]
      })

      const currentDistance = calculateDistance(userLat, userLong, truckData.lat, truckData.long)
      if (currentDistance <= truckData.u_turn) {
        await truck.update({ last_distance: currentDistance }, { where: { truck_id: truckData.truck_id } })
        if (currentDistance > truckData.last_distance) {
          truckData.dataValues.u_turn = true
        } else {
          truckData.dataValues.u_turn = false
        }
      } else {
        truckData.dataValues.u_turn = false
      }

      truckData.dataValues.in_proximity = currentDistance <= 10;

      if (favTruckIds.includes(truckData.truck_id)) {
        truckData.dataValues.is_fav = true;
      } else {
        truckData.dataValues.is_fav = false;
      }

      const [userRating, rateDetail, reportData, avatarData, vendorData] = await Promise.all([
        rate_truck.findOne({
          attributes: ['star_count'],
          where: { user_id: id, truck_id: truckData.truck_id }
        }),
        rate_truck.findAll({ where: { truck_id: truckData.truck_id } }),
        report_data.findOne({ where: { user_id: id, truck_id: truckData.truck_id } }),
        avatar.findOne({ where: { avatar_id: truckData.avatar_id } }),
        vendor.findOne({ attributes: ['company_name'], where: { vendor_id: truckData.vendor_id } })
      ]);

      truckData.dataValues.company_name = vendorData.company_name

      truckData.dataValues.user_rating = userRating?.star_count || 0;

      const countOfResult = rateDetail.length;

      let totalRating = 0;
      for (let i = 0; i < rateDetail.length; i++) {
        totalRating += rateDetail[i].star_count;
      }

      const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;

      truckData.dataValues.average_rating = parseFloat(averageRating.toFixed(2));

      if (reportData) {
        truckData.dataValues.report_id = reportData.msg_id;
      } else {
        truckData.dataValues.report_id = 0;
      }

      if (truckData.avatar_approved == 2) {
        truckData.dataValues.image_url = truckData.avatar_url;
        truckData.dataValues.thumbnail = truckData.thumbnail_url;
      } else {
        truckData.dataValues.image_url = avatarData.image_url;
        truckData.dataValues.thumbnail = avatarData.thumbnail;
      }

      resultArray.push(truckData);
    };

    return socket.emit('APIResponse', JSON.stringify({
      success: true,
      status_code: 200,
      message: 'Trucks Fetched Successfully',
      fav_truck_count: favTruckCount,
      active_truck_count: activeTruckCount,
      truck_data: resultArray,
    }));
  } catch (error) {
    console.log(error);
    return emitError(socket);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians
  const toRadians = (deg) => deg * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = 6371000; // Radius of the Earth in meters
  const distanceInMeters = radius * c;

  // Convert meters to feet
  const distanceInFeet = distanceInMeters * 3.28084;

  return distanceInFeet;
}

function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians
  const toRadians = (deg) => deg * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = 6371000; // Radius of the Earth in meters
  const distanceInMeters = radius * c;
  console.log(distanceInMeters)

  // Convert meters to feet
  const distanceInMiles = distanceInMeters * 0.000621371;
  console.log(distanceInMiles)

  return distanceInMiles;
}

function emitError(socket) {
  return socket.emit('APIResponse', JSON.stringify({
    success: false,
    status_code: 400,
    message: 'Invalid request format',
    data: [],
  }));
}

const verifyTokenMsg = (token) => {
  if (!token) {
    throw new Error("Token is missing");
  }

  try {
    const user = jwt.verify(token, secretKey);
    return user;
  } catch (err) {
    return "Invalid Token"
  }
};

server.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  console.log('Press Ctrl+C to quit.');

  const translationsArray = await translation.findAll({
    attributes: ['name', 'en_value', 'es_value']
  })
  const translationsObject = {};

  translationsArray.forEach(translation => {
    const name = translation.name;
    const enValue = translation.en_value;
    const esValue = translation.es_value;

    translationsObject[name] = {
      en: enValue,
      es: esValue
    };
  });

  // 3. write it back to your json file
  fs.writeFile("./utils/data.json", JSON.stringify(translationsObject), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Data has been written to the file successfully.');
    }
  });
});

module.exports = clearStopData