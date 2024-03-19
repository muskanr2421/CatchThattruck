// Common Success Response
const sendSuccessResponse = (res, data = null, message = "Success") => {
  res.status(200).json({
    success: true,
    message: message,
    data: data,
  });
};

// Common Error Response
const sendErrorResponse = (res, statusCode = 500, message = "Internal Server Error") => {
  console.log(`send error`,statusCode);
  res.status(statusCode).json({
    success: false,
    message: message,
    data:[],
    status_code:500
  });
};


const sendSuccessResponseMobile = (res, data, message = "Success", code = 200) => {
  res.status(200).json({
    status: true,
    status_code: code,
    message: message,
    data: data,
  });
};

const sendErrorResponseMobile = (res, statusCode = 500, message = "Internal Server Error") => {
  console.log(`send error`,statusCode);
  res.status(statusCode).json({
    success: false,
    status_code: code,
    message: message,
    data:[],
  });
};


const sendBadRequestResponse = (res, message= "Bad Request") =>{
  res.status(200).json({
    status: false,
    status_code: 400,
    message: message,
    data:[]
  });
}

const sendBadRequestResponseAdmin = (res, statusCode, message= "Bad Request") =>{
  res.status(statusCode).json({
    status: false,
    status_code: 400,
    message: message,
    data:[]
  });
}

module.exports = {sendSuccessResponse , sendErrorResponse, sendSuccessResponseMobile, sendErrorResponseMobile, sendBadRequestResponse, sendBadRequestResponseAdmin}




// const sendSuccessResponse = (res, data = null, message = "Success") => {
//   sendResponse(res, true, 200, message, data);
// };

// const sendErrorResponse = (res, statusCode = 500, message = "Internal Server Error") => {
//   console.log(`send error`, statusCode);
//   sendResponse(res, false, statusCode, message);
// };

// const sendSuccessResponseMobile = (res, data = null, message = "Success", code = 200) => {
//   sendResponse(res, true, code, message, data);
// };

// const sendErrorResponseMobile = (res, statusCode = 500, message = "Internal Server Error", code = 500) => { 
//   console.log(`send error`, statusCode);
//   sendResponse(res, false, statusCode, message);
// };

// const sendBadRequestResponse = (res, message = "Bad Request") => {
//   sendResponse(res, false, 400, message);
// };

// module.exports = { sendSuccessResponse, sendErrorResponse, sendSuccessResponseMobile, sendErrorResponseMobile, sendBadRequestResponse };

