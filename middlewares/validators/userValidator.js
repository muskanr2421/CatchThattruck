var { Validator } = require('node-input-validator')

async function addNewUserInput(req, res, next) {
    let validator = new Validator(req.body, {

        first_name: 'required|string',
        last_name: 'required|string',
        email: 'required|email',
        phone: 'required',
        city: 'required|string',
        state: 'required|string',
        country_id: 'required',
        zip_code: 'required',
        device_id: 'required',
        company_name: 'required',
        username: 'required|string',
        password: 'required|string',
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function editDetailsValidation(req, res, next) {
    let validator = new Validator(req.body, {

        first_name: 'required|string',
        last_name: 'required|string',
        email: 'required|email',
        phone : 'required',
        company_name: 'required|string',
        city: 'required|string',
        state: 'required|string',
        country_id: 'required|string',
        zip_code: 'required|string',
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function loginValidation(req, res, next) {
    let validator = new Validator(req.body, {

        username: 'required|string',
        password: 'required|string',
        device_id: 'required|string',
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function adminLoginValidation(req, res, next) {
    let validator = new Validator(req.body, {

        username: 'required|string',
        password: 'required|string',
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function truckValidation(req, res, next) {
    let validator = new Validator(req.body, {

        truck_name: 'required|string',
        username: 'required|string',
        password: 'required|string',
        avatar_id: 'required',
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function eventValidation(req, res, next) {
    let validator = new Validator(req.body, {

        event_name: 'required|string',
        phone: 'required|string',
        country_code: 'required|string',
        email: 'required|email',
        address: 'required|string',
        event_type: 'required|string',
        event_date: 'required|string',
        guest_count: 'required',
        truck_id: 'required|array'
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function userValidation(req, res, next) {
    let validator = new Validator(req.body, {

        device_id: 'required',
        lat: 'required',
        long: 'required'
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function routeValidation(req, res, next) {
    let validator = new Validator(req.body, {

        truck_id: 'required',
        route_name: 'required|string',
        route_string: 'required|string',
        coordinates: 'required|string'
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

async function updateRouteValidation(req, res, next) {
    let validator = new Validator(req.body, {

        truck_id: 'required',
        route_id: 'required',
        route_name: 'required|string',
        route_string: 'required|string',
        coordinates: 'required|string'
    });

    validator.check().then(function (matched) {
        if (!matched) {
            res.status(400).send({
                message: (Object.values(validator.errors))[0].message,
                status: "false",
                code: 400,
                data: []
            })
        }
        else { next() }
    });
}

module.exports = {
    addNewUserInput,
    loginValidation,
    adminLoginValidation,
    editDetailsValidation,
    truckValidation,
    eventValidation,
    userValidation,
    routeValidation,
    updateRouteValidation
}