const cron = require('node-cron');
const sequelize = require('./models/index');
const User = require('./models/user')
const middleware = require('./common/Utility')
const clearStopData = require('./server')

cron.schedule('*/5 * * * *', async function () {
    try {
        const allUsers = await User.findAll()

        for (const data of allUsers) {
            const userLat = data.lat;
            const userLong = data.long;
            const userId = data.user_id;

            var query;

            if (!(data.opt_out)) {
                if (data.notifi == 1) {
                    query = `SELECT 
                    t.truck_id, 
                    t.truck_name, 
                    t.username, 
                    t.lat, 
                    t.\`long\`, 
                    t.avatar_id, 
                    t.first_alert,
                    t.second_alert
                FROM 
                    truck t 
                WHERE 
                    (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.first_alert / 0.62137 
                    OR 
                    (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.second_alert / 0.62137;
                    `
                } else {
                    query = `SELECT 
                    t.truck_id, 
                    t.truck_name, 
                    t.username, 
                    t.lat, 
                    t.\`long\`, 
                    t.avatar_id, 
                    t.first_alert,
                    t.second_alert
                FROM 
                    truck t 
                    INNER JOIN favourite_truck ft ON t.truck_id = ft.truck_id 
                WHERE 
                    ft.user_id = :userId 
                    AND ft.notifi = true
                    AND (
                        (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.first_alert / 0.62137 
                        OR 
                        (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) <= t.second_alert / 0.62137
                    );`

                    const queryQ = `SELECT t.truck_id, t.truck_name, t.username, t.lat, t.\`long\`, t.avatar_id, (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(t.lat)) * COS(RADIANS(t.\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(t.lat)))) AS distance FROM truck t INNER JOIN favourite_truck ft ON t.truck_id = ft.truck_id WHERE ft.user_id = :userId AND (distance <= t.first_radius / 0.62137 OR distance <= t.second_radius / 0.62137)`;


                }

                const trucks = await sequelize.query(query, {
                    replacements: { userLat, userLong, userId },
                    type: sequelize.QueryTypes.SELECT,
                });

                for (const truck of trucks) {
                    // console.log("cron---->", truck.truck_id)
                    // console.log(data.fcm_token)
                    middleware.CustomNotification("Truck Alert", `${truck.truck_name} is Near You`, data.fcm_token)
                }
            }
        }

    } catch (err) {
        console.log('cron err : ', err);
    }


});

cron.schedule('0 0 * * *', async () => {
    clearStopData()
}, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Set the timezone to Pacific Standard Time
});

cron.schedule('* * * * *', async () => {
    clearStopData()
}, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Set the timezone to Pacific Standard Time
});


module.exports = cron