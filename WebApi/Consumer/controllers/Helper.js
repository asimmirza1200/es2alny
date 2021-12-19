var appSetting = require('../appsetting');
var FCM = require('fcm-node');
var serverKey = appSetting.Notification.IOS.ApplicationKey; //put your server key here
var fcm = new FCM(serverKey);

var ObjectId = require('mongoose').Types.ObjectId; 
var { UserMaster, UserConsumptions, TemplateLangDetails } = require('../models/entity'); 
var appSetting = require('../appsetting');    
var ObjectId = require('mongoose').Types.ObjectId;  
var constant = require('../../../CommonUtility/constant');  
var LINQ = require('node-linq').LINQ; 
const roundTo = require('round-to');
const sgMail = require('@sendgrid/mail');
const replaceString = require('replace-string');

  
//Send Push Notification
exports.SendPushNotification = function(NotificationDetails)
{
    NotificationDetails.forEach(function(item){
        // console.log(item.deviceToken);

        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: item.deviceToken,
            notification: {
                title: item.title,
                body: item.message,
                sound:  "notification.caf",//item.sound //default  ./notification.mp3
            },
            data: {
                title: item.title,
                body: item.message,
                sound:  "notification.caf",//item.sound //default  ./notification.mp3
            }
        };

        fcm.send(message, function(err, response){
            if (err) {
                console.log("Something has gone wrong!", err);
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });

    });

}


//Calculate Provider Wallet Balance 
exports.getProviderWalletDetailsByUserId = async function (userId) { // Async function statment

    //var TotalPurchases = 0;
    // console.log("============1=============");  
    var data = {
        UserId : userId, 
        TotalEarnReward : 0,
        TotalWithdraw : 0,
        CurrentBalance : 0, 
    }  
        

    // console.log(roundTo.up(1.014, 0));  //ceil
    // console.log(roundTo.up(1.11, 0));    //{ $project: { value: 1, ceilingValue: { $ceil: "$value" } } }
    // console.log(roundTo.up(1.45, 0));  
    // console.log(roundTo.up(1.50, 0));  
    // console.log(roundTo.up(1.55, 0));  
    // console.log(roundTo.up(1.99, 0));  
    // console.log(roundTo.up(1.00, 0));  
    // console.log(roundTo.down(10.00, 0));    //floor
    // console.log(roundTo.down(10.015, 0));    // { $project: { value: 1, floorValue: { $floor: "$value" } } }
    // console.log(roundTo.down(10.111, 0));
    // console.log(roundTo.down(10.456, 0));
    // console.log(roundTo.down(10.500, 0));
    // console.log(roundTo.down(10.555, 0));
    // console.log(roundTo.down(10.999, 0));

 
    let promise = await new Promise(async function(resolve, reject) {
       // resolve( await
            UserConsumptions.aggregate(
            [   
                {
                    $lookup:
                    {
                        from: "usermasters",
                        localField: "consumer_user_Id",
                        foreignField: "_id",
                        as: "usermasters"
                    }  
                },                                   
                {
                    $match : 
                    {  
                        "provider_user_Id" : ObjectId(userId),   
                    }
                },  
                {
                    $project:
                    {   
                        _id: 0,
                        appointmentId: "$appointment_details_Id", 
                        consumerUserId: "$consumer_user_Id",
                        //providerUserId : "$provider_user_Id",
                        commissionPercentage: "$commissionPercentage",
                        price: "$price",
                        commissionPrice: 
                        {
                            $ceil: { 
                                $divide: [
                                    { 
                                        $multiply: [ "$price", "$commissionPercentage" ] 
                                    }, 100
                                ] 
                            }
                        },
                        totalPrice : { 
                            $subtract : 
                            [ 
                                "$price",  
                                {  
                                    $ceil:
                                    {
                                        $divide: 
                                        [
                                            { 
                                                $multiply: [ "$price", "$commissionPercentage" ] 
                                            }, 100
                                        ]   
                                    }
                                }   
                            ]
                        },  

                    }
                }, 
          
    
            ], async (err, transactionDetails) =>
            {       

                
              //  var TotalEarn =
                let TotalEarnReward = await new Promise(function(resolve, reject) 
                                { 
                                    resolve(new LINQ(transactionDetails).Sum(function(transactionDetail) 
                                        {  
                                            //console.log(transactionDetail.totalPrice); 
                                            return transactionDetail.totalPrice;   
                                        })
                                    );
                                });
 
                let TotalWithdraw = await new Promise(async function(resolve, reject) 
                {
                    await UserMaster.aggregate(
                        [ 
                            {
                                $lookup:
                                {
                                    from: "withdrawdetails",
                                    //localField: "_id",
                                    //foreignField: "provider_user_Id",
                
                                    let: { userId: "$_id" }, //, order_qty: "$ordered" 
                                    pipeline: [
                                        { 
                                            $match:
                                            { 
                                                //  lookupDetails_Id : $degree,
                                                $expr:
                                                { 
                                                    $and:
                                                    [ 
                                                        { $eq: [ "$user_Id",  "$$userId" ] },
                                                        { $eq: [ "$isActive", true ] },
                                                        { $eq: [ "$isWithdraw", true ] }, 
                                                        //{ $eq: [ "$isDeleted", false ]  }, 
                                                        { $ne: [ "$price",  null ] }, 
                                                    ]
                                                }
                                            }
                                        }, 
                                        {
                                            $group: 
                                            {
                                                _id: "$user_Id",
                                                //uniqueIds: {$addToSet: "$_id"},
                                                totalWithdraw : { $sum: "$price" },
                                                //noOfQue: { $sum: 1 },
                                                //avg : { $avg : "$price" },
                                                // count1 : {$count : "$_id" }
                                            }
                                        },
                                        { 
                                            $project: 
                                            { 
                                                //NoOfQue: "$noOfQue", 
                                                totalWithdraw: "$totalWithdraw", 
                                                //avg : "$avg", 
                                                // count1 : "$count1",
                                                _id : 0 
                                            } 
                                        }
                                    ],   
                
                                    as: "withdrawdetails"
                
                                }  
                            },  
                            // {
                            //     $unwind:"$withdrawdetails"
                            // },     
                            
                            {
                                $match : 
                                { 
                                    _id : ObjectId(userId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false
                                }
                            },   
                            {
                                $project:
                                {  
                                    _id: 0,
                                    userId: "$_id",    
                                    totalWithdraw : //"$userPurchases.totalPurchase",
                                    {
                                        $cond: [ 
                                            {
                                                $eq: ["$withdrawdetails", [] ]
                                            }, 0, 
                                            {
                                                $arrayElemAt:[ "$withdrawdetails.totalWithdraw", 0]
                                            }] 
                                    }, 
                                    
                                }
                            }, 
                        ], (err, result) =>
                        {      
                
                            console.log(result);
                 
                            //data.TotalWithdraw = result[0].totalWithdraw; 
                
                            //console.log(data);
                            resolve (result[0].totalWithdraw);
                        }); 
                      
                });


                data.TotalEarnReward = TotalEarnReward;
                data.TotalWithdraw = TotalWithdraw;
                data.CurrentBalance = TotalEarnReward - TotalWithdraw;
                console.log("TotalEarnReward : " + TotalEarnReward);
                console.log("TotalWithdraw : " + TotalWithdraw);
                console.log("CurrentBalance : " + TotalEarnReward - TotalWithdraw);
                console.log(data);
               
                
                resolve(data);
             //   res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, TotalEarn ));  
    
            }); 
        //)
 
    });

   console.log(promise);
   return promise;
 
}



//Only for Consumer
exports.getWalletDetailsByUserId = async function (userId) { // Async function statment

    //var TotalPurchases = 0;
    // console.log("============1=============");  
    var data = {
        UserId : "",
        TotalPurchase : 0,
        TotalConsumption : 0,
        CurrentBalance : 0, 
    }  
       

    let promise = await new Promise(async function(resolve, reject) {


        await UserMaster.aggregate(
            [       
                {
                    $lookup:
                    {
                        from: "userpurchases",
                        //localField: "_id",
                        //foreignField: "provider_user_Id",
    
                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                        pipeline: [
                            { 
                                $match:
                                { 
                                    //  lookupDetails_Id : $degree,
                                    $expr:
                                    { 
                                        $and:
                                        [ 
                                            { $eq: [ "$user_Id",  "$$userId" ] },
                                            { $eq: [ "$isActive", true ] },
                                            { $eq: [ "$isDeleted", false ] }, 
                                            { $ne: [ "$price",  null ] }
                                        ]
                                    }
                                }
                            }, 
                            {
                                $group: 
                                {
                                    _id: "$user_Id",
                                    //uniqueIds: {$addToSet: "$_id"},
                                    totalPurchase: { $sum: "$price" },
                                    //noOfQue: { $sum: 1 },
                                    //avg : { $avg : "$price" },
                                    // count1 : {$count : "$_id" }
                                }
                            },
                            { 
                                $project: 
                                { 
                                    //NoOfQue: "$noOfQue", 
                                    totalPurchase: "$totalPurchase", 
                                    //avg : "$avg", 
                                    // count1 : "$count1",
                                    _id : 0 
                                } 
                            }
                        ],   
    
                        as: "userPurchases"
    
                    }  
                },  
                // {
                //     $unwind:"$userPurchases"
                // },    
                {
                    $lookup:
                    {
                        from: "userconsumptions",
                        //localField: "_id",
                        //foreignField: "provider_user_Id",
    
                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                        pipeline: [
                            { 
                                $match:
                                { 
                                    //  lookupDetails_Id : $degree,
                                    $expr:
                                    { 
                                        $and:
                                        [ 
                                            { $eq: [ "$consumer_user_Id",  "$$userId" ] },
                                            { $eq: [ "$isActive", true ] },
                                            { $eq: [ "$isDeleted", false ]  }, 
                                            { $ne: [ "$price",  null ] }
                                        ]
                                    }
                                }
                            }, 
                            {
                                $group: 
                                {
                                    _id: "$consumer_user_Id",
                                    //uniqueIds: {$addToSet: "$_id"},
                                    totalConsumption : { $sum: "$price" },
                                    //noOfQue: { $sum: 1 },
                                    //avg : { $avg : "$price" },
                                    // count1 : {$count : "$_id" }
                                }
                            },
                            { 
                                $project: 
                                { 
                                    //NoOfQue: "$noOfQue", 
                                    totalConsumption: "$totalConsumption", 
                                    //avg : "$avg", 
                                    // count1 : "$count1",
                                    _id : 0 
                                } 
                            }
                        ],   
    
                        as: "userConsumptions"
    
                    }  
                },  
                // {
                //     $unwind:"$userConsumptions"
                // },                                                                  
                {
                    $match : 
                    { 
                        _id : ObjectId(userId), userTypeId : ObjectId(constant.UserType.Consumer), isActive : true, isDeleted : false
                    }
                },   
                {
                    $project:
                    {  
                        _id: 0,
                        userId: "$_id",    
                        totalPurchases : //"$userPurchases.totalPurchase",
                        {
                            $cond: [ 
                                {
                                    $eq: ["$userPurchases", [] ]
                                }, 0, 
                                {
                                    $arrayElemAt:[ "$userPurchases.totalPurchase", 0]
                                }] 
                        }, 
                        totalConsumptions : //"$userConsumptions.totalConsumption",
                        {
                            $cond: [ 
                                {
                                    $eq: ["$userConsumptions", [] ]
                                }, 0, 
                                {
                                    $arrayElemAt:[ "$userConsumptions.totalConsumption", 0]
                                }] 
                        }, 
                        currentBalance: 
                        { 
                            $subtract: 
                            [ 
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$userPurchases", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$userPurchases.totalPurchase", 0]
                                        }] 
                                }, 
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$userConsumptions", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$userConsumptions.totalConsumption", 0]
                                        }] 
                                } 
                            ]
                        } 
                    }
                },  
            ], (err, result) =>
            {      
                if(!err)
                { 
                    console.log(result);
                    
                    data.UserId = result[0].userId;
                    data.TotalPurchase = result[0].totalPurchases;
                    data.TotalConsumption = result[0].totalConsumptions;
                    data.CurrentBalance = result[0].currentBalance;
        
                    console.log(data);
                    resolve (data);
                }
                else
                {
                    throw err;
                }
            }); 
 
    });

 
    return promise;
    //return data;
}


// //Send Email 
// exports.SendEmail = function(EmailDetails)
// {
//     console.log("Start Sending the email....");
//     if(constant.TemplateCode.WelcomeEmail == EmailDetails.templateCode)
//     {

//         var query = {
//             language_Id : ObjectId(EmailDetails.languageid),
//             templateCode : EmailDetails.templateCode, 
//             isActive:  true, 
//             isDeleted:  false 
//         };
            
//         console.log(query);

//         TemplateLangDetails.find(query, (err, templateLangDetails) => 
//         {
 
//             console.log("======> " + templateLangDetails.length); 
//             if (!err) 
//             { 
//                 //console.log(doc);   
//                 console.log("Template Lang Details : ");
//                 console.log(templateLangDetails);
                
//                 if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
//                 { 

//                     console.log("START send email...");

//                     var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
//                     emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
//                     emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                   
//                     sgMail.setApiKey(appSetting.Email.SENDGRID_API_KEY);
//                     const msg = {
//                         to: EmailDetails.to, 
//                         //to: 'testupdates1@gmail.com',
//                         from: EmailDetails.from,
//                         subject: templateLangDetails[0].emailSubject,
//                         //text: 'and easy to do anywhere, even with Node.js',
//                         html: emailBody,
//                     }; 
//                     (async () => {
//                         try {
//                         await sgMail.send(msg);
//                         console.log("Successfully sent the email.");
//                         } catch (err) {
//                         //console.error(err.toString());
//                         console.log("Email Not Send. Error : ", err.toString());
//                         }
//                     })();


//                 }
//                 else
//                 {
//                     console.log("Not found the template for send the email.");
//                     console.log('Error :' + JSON.stringify(err, undefined, 2));
//                     //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
//                 }
                
//             }
//             else 
//             { 
//                 console.log('Error :' + JSON.stringify(err, undefined, 2));
//                 //res.send(ResponseDTO.TechnicalError()); 
//             }
//         });
    
//     }

      

// }


 

    
//Send Email 
exports.SendEmail = async function(EmailDetails)
{
    console.log("Start Sending the email....");
    console.log(EmailDetails);

    let promise = await new Promise(async function(resolve, reject) {

        sgMail.setApiKey(appSetting.Email.SENDGRID_API_KEY);
        const msg = {
            //to: 'testupdates1@gmail.com',
            // from: "noreply@es2alny.com",
            // subject: "Email Subject", 
            // html: "Email Body",

            to: EmailDetails.To,  
            from: EmailDetails.From,
            subject: EmailDetails.Subject,
            //text: 'and easy to do anywhere, even with Node.js',
            html: EmailDetails.Body,
        }; 
        (async () => {
            try 
            {
                await sgMail.send(msg);
                resolve (true);
                console.log("Successfully sent the email.");
            } 
            catch (err) 
            {
                resolve (false);
                //console.error(err.toString());
                console.log("Email Not Send. Error : ", err.toString());
            }
        })(); 
    });

 
    return promise;



}
 