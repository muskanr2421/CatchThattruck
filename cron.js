const cron = require('node-cron');
const sequelize = require('./models/index');
const User = require('./models/user')
const notifi = require('./models/notifi')
const middleware = require('./common/Utility')
const clearStopData = require('./server')

//First and Second Alert Radius Notification to Use
// cron.schedule('*/15 * * * *', async function () {
//     try {
//         const allUsers = await User.findAll()
//         console.log("Cron Started")

//         for (const data of allUsers) {
//             const userLat = data.lat;
//             const userLong = data.long;
//             const userId = data.user_id;

//             var queryFirst, querySecond;

//             if (!(data.opt_out)) {
//                 if (data.notifi == 1) {
//                     queryFirst = `SELECT 
//                     t.truck_id, 
//                     t.truck_name, 
//                     t.username, 
//                     t.lat, 
//                     t.\`long\`, 
//                     t.avatar_id, 
//                     t.first_alert,
//                     t.second_alert
//                 FROM 
//                     truck t 
//                 WHERE 
//                     (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.first_alert / 0.62137;`
//                 } else {
//                     queryFirst = `SELECT 
//                     t.truck_id, 
//                     t.truck_name, 
//                     t.username, 
//                     t.lat, 
//                     t.\`long\`, 
//                     t.avatar_id, 
//                     t.first_alert,
//                     t.second_alert
//                 FROM 
//                     truck t 
//                     INNER JOIN favourite_truck ft ON t.truck_id = ft.truck_id 
//                 WHERE 
//                     ft.user_id = :userId 
//                     AND ft.notifi = true
//                     AND (
//                         (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.first_alert / 0.62137
//                     );`

//                     const queryQ = `SELECT t.truck_id, t.truck_name, t.username, t.lat, t.\`long\`, t.avatar_id, (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) AS distance FROM truck t INNER JOIN favourite_truck ft ON t.truck_id = ft.truck_id WHERE ft.user_id = :userId AND (distance <= t.first_radius / 0.62137 OR distance <= t.second_radius / 0.62137)`;
//                 }

//                 if (data.notifi == 1) {
//                     querySecond = `SELECT 
//                     t.truck_id, 
//                     t.truck_name, 
//                     t.username, 
//                     t.lat, 
//                     t.\`long\`, 
//                     t.avatar_id, 
//                     t.first_alert,
//                     t.second_alert
//                 FROM 
//                     truck t 
//                 WHERE 
//                     (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.second_alert / 0.62137;`
//                 } else {
//                     querySecond = `SELECT 
//                     t.truck_id, 
//                     t.truck_name, 
//                     t.username, 
//                     t.lat, 
//                     t.\`long\`, 
//                     t.avatar_id, 
//                     t.first_alert,
//                     t.second_alert
//                 FROM 
//                     truck t 
//                     INNER JOIN favourite_truck ft ON t.truck_id = ft.truck_id 
//                 WHERE 
//                     ft.user_id = :userId 
//                     AND ft.notifi = true
//                     AND (
//                         (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.second_alert / 0.62137
//                     );`
//                 }

//                 const trucksFirst = await sequelize.query(queryFirst, {
//                     replacements: { userLat, userLong, userId },
//                     type: sequelize.QueryTypes.SELECT,
//                 });

//                 const trucksSecond = await sequelize.query(querySecond, {
//                     replacements: { userLat, userLong, userId },
//                     type: sequelize.QueryTypes.SELECT,
//                 });
//                 var truckIds = [];
//                 // console.log("Truck First", trucksFirst)
//                 // console.log("Truck Second", trucksSecond)        

//                 for (const truck of trucksSecond) {
//                     truckIds.push(truck.truck_id);
//                     // let result = await notifi.findOne({ where: { user_id: userId, truck_id: truck.truck_id } })
//                     // if (!result) {
//                         // await notifi.create({ user_id: userId, truck_id: truck.truck_id })
//                         middleware.CustomNotification("Truck Alert", `${truck.truck_name} is pretty close to you`, data.fcm_token)
//                     // }
//                 }


//                 for (const truck of trucksFirst) {
//                     // console.log("Truckids--->", truckIds)
//                     if (!truckIds.includes(truck.truck_id)) {
//                         // let result = await notifi.findOne({ where: { user_id: userId, truck_id: truck.truck_id } })
//                         // if (!result) {
//                             // truckIds.push(truck.truck_id)
//                             // await notifi.create({ user_id: userId, truck_id: truck.truck_id })
//                             middleware.CustomNotification("Truck Alert", `${truck.truck_name} is in your neighbourhood`, data.fcm_token)
//                         // }
//                     }
//                 }
//             }
//         }
//     } catch (err) {
//         console.log('cron err : ', err);
//     }
// });


//Clear Stop Data at MidNight 12:00 AM
cron.schedule('0 0 * * *', async () => {
    clearStopData()
    // await notifi.destroy({
    //     where: {}, // Empty where clause to match all entries
    //     truncate: true // Optionally truncate the table instead of deleting individual entries
    // })
}, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Set the timezone to Pacific Standard Time
});


module.exports = cron