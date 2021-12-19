const express = require("express");
const bodyParser = require("body-parser");
var ObjectId = require('mongoose').Types.ObjectId; 
const cors = require("cors");
const path = require('path');
const { mongoose } = require("./db.js");
var contains = require("string-contains");

//For API
var accountController = require('./controllers/accountController');
var categoryController = require('./controllers/categoryController');
var providerController = require('./controllers/providerController');
var appointmentController =  require('./controllers/appointmentController');
var creditplanController = require('./controllers/creditplanController');
var commonController = require('./controllers/commonController');
var staticpageController = require('./controllers/staticpageController');
var paymentController = require('./controllers/paymentController');
var withdrawController = require('./controllers/withdrawController');



//For Admin
var ManageAccountController = require('./controllers/ManageAccountController');
var ManageUserController = require('./controllers/ManageUserController');
var ManageProviderController = require('./controllers/ManageProviderController');
var ManageCategoryController = require('./controllers/ManageCategoryController');
var ManagePlanController = require('./controllers/ManagePlanController');
var ManageDegreeController = require('./controllers/ManageDegreeController');
var ManageFeedbackController = require('./controllers/ManageFeedbackController');
var ManageNotificationController = require('./controllers/ManageNotificationController');
var ManageWithdrawController = require('./controllers/ManageWithdrawController');
var ManageReportsController = require('./controllers/ManageReportsController');
var ManageDashboardController = require('./controllers/ManageDashboardController');
var ManageLanguageController = require('./controllers/ManageLanguageController');
var ManageSystemConfigurationController = require('./controllers/ManageSystemConfigurationController');

//For Manage Supplier Payment
var ManageSupplierPaymentController = require('./controllers/ManageSupplierPaymentController');


// var employeeController = require("./controllers/-employeeController");
var constant = require("../../CommonUtility/constant");
//var LoginToken = require('./controllers/loginTokenController');

var { LoginToken, UserMaster, LoginMaster } = require('./models/entity');
var ResponseDTO = require('../../DTO/Consumer/ResponseDTO');   



var app = express();

// app.set('views', __dirname + '/views');
// console.log(__dirname + '/views');
// app.use(express.static(path.join(__dirname, '/Assets')));


// app.use(express.static(__dirname + '/Assets/Images/Category')); //Serves resources from public folder
app.use('/Assets', express.static(path.join(__dirname, 'Assets')));
app.use('/views', express.static(path.join(__dirname, 'views')));
//app.use('/views/staticpage', express.static(path.join(__dirname, 'views/staticpage'))); 
//app.use(express.static('public')); 
// app.use(express.static(__dirname + '/public'));
// app.set('views', __dirname + '/public/views');
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html'); 
// console.log(__dirname + '/Assets/Images/Category'); 



app.use(bodyParser.json()); 
//app.use(cors({ origin: "*" }));  //http://localhost:4200
app.use(cors({ origin: ["*", "http://localhost:4200", "http://es2alny.com"], credentials: true }));
 
//For Local Machine
// app.listen(3000, () => console.log("Server started at port : 3000")); 

//For Local Machine Server
//app.listen(9007, '192.168.0.7', () => console.log("Server started at port : 192.168.0.7:9007"));

//For Local Server
//app.listen(8600, '192.168.0.150', () => console.log("Server started at port : 192.168.0.150:8600")); // http://123.201.108.32:8600/ 

//For Local Server
app.listen(8001, () => console.log("Server started at port : 165.22.163.91:8001")); // http://165.22.163.91:8600/ 



//For Check Header
app.use((req, res, next) => {
    try     
    {

        // res.header("Access-Control-Allow-Origin", "*");
        // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


            console.log("====================== Header ======================");
 
            //console.log(req.headers);

            console.log("API Request URL : " +  req.protocol + '://' + req.get('host') + req.originalUrl);


            var URL = req.protocol + '://' + req.get('host') + req.originalUrl.toLowerCase();
            if(contains(URL, "payment/response") || contains(URL, "/payment/success") || contains(URL, "/payment/cancel") || contains(URL, "/payment/purchaseplan") || contains(URL, "/payment/payment_invoice.aspx") || contains(URL, "/staticpage/") || contains(URL, "/payment/paymentrequestfromknet"))  
            { 
                console.log("Not Apply Any Header");
        
                next();
            }
            else 
            {
                
                //  next();

                 console.log("Apply Header");

                 var BaseUrls = ["/account/sendotp", "/account/verifyotp", "/account/signup", "/common/systemconfiguration", "/common/lookupdetails", "/manageaccount/login", "/payment/response", "/common/manageflow", "/common/providerregistration", "/account/signupprovider", "/account/signin", "/account/forgotpassword", "/common/categorylist", "/account/signupv1", "/common/countrydetils"       ]; //,            "/provider/providerdetails", "/provider/providerupdateprofile", "/account/consumerprofiledetails"  "/provider/providerdetails", "/provider/providerupdateprofile"  
                 var IsSecureUrl = !(BaseUrls.includes(req.originalUrl.toLowerCase()));

                 console.log("Is  Secure  URL : " + IsSecureUrl);  
                 console.log("Req. URL : " + req.originalUrl.toLowerCase());  
                 console.log("Is  Secure  URL : " + IsSecureUrl);                   

                 if (req.headers.appid == undefined || req.headers.languageid == undefined || req.headers.deviceid == undefined || req.headers.userid == undefined || req.headers.logintoken == undefined) 
                 { 
                     res.send(ResponseDTO.InvalidHeader()); 
                 }
                 else if( !(req.headers.appid == constant.AppType.IOS || req.headers.appid == constant.AppType.Android || req.headers.appid == constant.AppType.Admin)  ||  !(req.headers.languageid == constant.Language.English || req.headers.languageid == constant.Language.Arabic) )
                 {
                     res.send(ResponseDTO.InvalidHeader()); 
                 }
                 else
                 {  

                     if(IsSecureUrl)
                     { 
                     if (req.headers.deviceid.trim() == '' || req.headers.userid.trim() == '' || req.headers.logintoken.trim() == '') 
                     { 
                         res.send(ResponseDTO.InvalidHeader()); 
                     }
                     else
                     {
                      
                         if(req.headers.appid == constant.AppType.Admin) 
                         {
                             //For Admin
                             LoginMaster.find({ _id : ObjectId(req.headers.userid), isActive : true, isDeleted : false }, (err, loginMaster) => {
                             if(!err)
                             {
                                 if(loginMaster.length > 0)
                                 {

                                     LoginToken.find({ user_Id : ObjectId(req.headers.userid), appId : req.headers.appid, deviceId : req.headers.deviceid, loginToken : req.headers.logintoken,  isActive : true, isDeleted : false }, (err, loginToken) => {

                                         if(!err)
                                         {
                                             if(loginToken.length > 0)
                                             {
                                                 next();
                                             }
                                             else
                                             {
                                                 res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginToken, constant.ErrorMsg.InvalidLoginToken, {} )); 
                                             }
                                         }
                                         else
                                         {
                                             res.send(ResponseDTO.TechnicalError()); 
                                         }
                                     });
                  
                                 }
                                 else
                                 {
                                     console.log("Header : Invalid UserId");
                                     res.send(ResponseDTO.InvalidHeader()); 
                                 }
                             }
                             else
                             {
                                 res.send(ResponseDTO.TechnicalError()); 
                             }
                         });                  

                         }
                         else
                         {
                         //For IOS and Android
                         UserMaster.find({ _id : ObjectId(req.headers.userid), isActive : true, isDeleted : false }, (err, userMaster) => {
                             if(!err)
                             {
                                 if(userMaster.length > 0)
                                 {

                                     LoginToken.find({ user_Id : ObjectId(req.headers.userid), appId : req.headers.appid, deviceId : req.headers.deviceid, loginToken : req.headers.logintoken,  isActive : true, isDeleted : false }, (err, loginToken) => {

                                         if(!err)
                                         {
                                             if(loginToken.length > 0)
                                             {
                                                 next();
                                             }
                                             else
                                             {
                                                 res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginToken, constant.ErrorMsg.InvalidLoginToken, {} )); 
                                             }
                                         }
                                         else
                                         {
                                             res.send(ResponseDTO.TechnicalError()); 
                                         }
                                     });
                  
                                 }
                                 else
                                 {
                                     console.log("Header : Invalid UserId");
                                     res.send(ResponseDTO.InvalidHeader()); 
                                 }
                             }
                             else
                             {
                                 res.send(ResponseDTO.TechnicalError()); 
                             }
                         });
                         }

                     }
                     }
                     else
                     {
                         next();
                     } 

                 }  
            }
        }
        catch(e)
        {
            res.send(ResponseDTO.InvalidParameter()); 
        }
    
});


//For API
app.use('/account',   accountController);
app.use("/category", categoryController);
app.use("/provider", providerController);
app.use("/appointment", appointmentController);
app.use("/creditplan", creditplanController);
app.use("/common", commonController);
app.use("/staticpage", staticpageController);
app.use("/payment", paymentController);
app.use("/withdraw", withdrawController);




//For Admin
app.use("/ManageAccount", ManageAccountController);
app.use("/ManageUser", ManageUserController); 
app.use("/ManageProvider", ManageProviderController);
app.use("/ManageCategory", ManageCategoryController);
app.use("/ManagePlan", ManagePlanController);
app.use("/ManageDegree", ManageDegreeController);
app.use("/ManageFeedback", ManageFeedbackController);
app.use("/ManageNotification", ManageNotificationController);
app.use("/ManageWithdraw", ManageWithdrawController);
app.use("/ManageReports", ManageReportsController);
app.use("/ManageDashboard", ManageDashboardController);
app.use("/ManageLanguage", ManageLanguageController);
app.use("/ManageSystemConfiguration", ManageSystemConfigurationController);

//For Supplier Payment
app.use("/ManageSupplierPayment", ManageSupplierPaymentController);




 
