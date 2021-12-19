//var async = require('async');
const TokenGenerator = require('uuid-token-generator');
let date = require('date-and-time');
let {AgeFromDateString, AgeFromDate} = require('age-calculator');
const split = require('split-string');
date.locale('hi');
var appSetting = require('../appsetting');  
var { mongoose } = require('../db');
//var mongodb = require("mongodb");
const express = require('express');
var router = express.Router();
//var db = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
  
var path = require('path')
var multer = require('multer')
//const upload = multer({dest: __dirname + '/uploads/images'});

 
var constant = require('../../../CommonUtility/constant');   

// constant.SUMMER.BEGINNING 
var { LoginMaster, OTPDetail, LoginToken, DeviceTokenMasters, UserMaster, UserDetails, ProviderDetails, ProviderLangDetails, LookupLangDetails, UserPurchases, UserConsumptions } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

// => localhost:3000/account/

 

function addUpdateLoginToken(userId, appId, deviceId, loginToken)
{ 
    console.log("userId : "+ userId +"  appId : "+ appId +" deviceId : "+ deviceId +"   deviceToken : "+ loginToken);
    LoginToken.find({appId : appId, deviceId : deviceId, isDeleted : false}, (err, loginTokenDetails)  => 
    {  
        if(!err)
        {
            if(loginTokenDetails.length)
            {
                //Update
                LoginToken.updateOne({appId : appId, deviceId : deviceId}, { $set: {user_Id: ObjectId(userId), loginToken : loginToken, startDate : new Date(), isActive : true, updatedBy: ObjectId(userId), updatedDateTime : new Date() } }, function(err, res) {
                    if (err) throw err;
                    console.log("Update Login Token Details : " + loginToken); 
                  }); 
            }
            else
            {
                //Insert
                var loginTokenDetail = new LoginToken({ 
                    user_Id : ObjectId(userId),
                    appId : appId,
                    deviceId : deviceId,
                    loginToken : loginToken, 
                    startDate : new Date(),
                    isActive : true,
                    isDeleted : false, 
                    createdBy : ObjectId(userId),
                    createdDateTime : new Date(),
                    updatedBy : null,
                    updatedDateTime : null
                });

                loginTokenDetail.save((err, doc) => {
                    if (!err) { 
                        console.log("Store Login Token Details" + loginToken); 
                    }
                    else { 
                        console.log(err);
                        //res.send(ResponseDTO.TechnicalError())
                     }
                });      
            }
        }

    }); 
}

 
// For Verify OTP and get User details
router.post('/Login', (req, res) => {
      console.log(req.body);
   
  
      if(req.body.emailaddress == undefined || req.body.password == undefined || req.body.emailaddress.trim() == "" || req.body.password.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {  
        console.log(req.body.emailaddress);
        // req.body.emailAddress = req.body.emailAddress;
        console.log(req.body.emailaddress+" dfdfgdfg");
        console.log( req.body.emailaddress);

        var query = {
            emailaddress : req.body.emailaddress,
            password: req.body.password,
            usertype :  ObjectId(constant.UserType.Admin) ,
            isActive:  true, 
            isDeleted:  false 
        };
            
       
        LoginMaster.find({}, (err, loginDetails) => 
        {
            console.log("======>" + loginDetails.length);
            console.log(loginDetails)
            if (!err) 
            { 
                //console.log(doc);   
                if(loginDetails.length > 0)
                { 
                  
                    console.log(req.headers);
                            
                    const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                    var loginToken = tokgen.generate();
                    addUpdateLoginToken(loginDetails[0]._id, req.headers.appid, req.headers.deviceid, loginToken);
                            
                    loginDetails[0].image = appSetting.SystemConfiguration.APIBaseUrl + appSetting.SystemConfiguration.UserDisplayImagePath + (loginDetails[0].image == null || loginDetails[0].image == "" ? appSetting.SystemConfiguration.UserDefaultImage : loginDetails[0]._id +"/"+ loginDetails[0].image);
                    //console.log(loginDetails[0]);
                    res.send(ResponseDTO.GetAdminDetails(constant.ErrorCode.LoginSuccessfully, constant.ErrorMsg.LoginSuccessfully, loginDetails[0], loginToken) );
                        
                
                }
                else
                {
                    //console.log("<==========");
                    //console.log('Error :' + JSON.stringify(err, undefined, 2));
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
                }
                
            }
            else 
            { 
                //console.log('Error :' + JSON.stringify(err, undefined, 2));
                res.send(ResponseDTO.TechnicalError()); 
            }
        });
        
             
      }
   
});


// For Logout
router.post('/Logout', (req, res) => {

    if(req.body.userId == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   
        //Expire Login Token
        LoginToken.find({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid }, (err, loginTokenDetails)  => 
        {  
            if(!err)
            {
                if(loginTokenDetails.length)
                {
                    //Update
                    LoginToken.updateOne({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid }, { $set: { isActive : false } }, function(err, res) {
                        if (err) throw err;
                        console.log("Expire Login Token"); 
                    }); 
                } 
            }
    
        }); 

    }

    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.LogoutSuccessfully, constant.ErrorMsg.LogoutSuccessfully, {} ));

 
});


  
module.exports = router;