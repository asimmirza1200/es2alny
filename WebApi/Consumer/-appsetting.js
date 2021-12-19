const replaceString = require('replace-string');
var dateformat = require('dateformat');

module.exports = {

    Database: 
    {
        //For Local Machine
        //ConnectionString : "mongodb://localhost:27017/",

        //For Local Server
        ConnectionString : "mongodb://192.168.0.150:27017/",

        //For Client Server
        // ConnectionString : "mongodb://165.22.163.91:27017/",

        DatabaseName : "ES2ALNY" //ES2ALNY  CrudDB
    },
    SMS:
    {
        Username : "yusf",
        Password : "@aumacm12",
        CustomerId : "1825",
        SenderText : "SMSBOX.COM", 
        IsSendRealSMS : true,
        AndroidKeyHashForAutoFill : "\nkjRS/YI4a0F",
    },
    SystemConfiguration:
    {    
        PageSize : 30,

        //For Local
        // APIBaseUrl : "http://localhost:8001/", 

        //For Local Machine Host
        //APIBaseUrl : "http://192.168.0.7:9007/",

        //For Local Server
        //APIBaseUrl : "http://123.201.108.32:8600/", 
        //APIBaseUrl : "http://192.168.0.150:8600/", 

        //For Client Server
        // APIBaseUrl : "http://es2alny.com:8001/", 


        //For Category Display Image Path
        CategoryDisplayImagePath : "Assets/Images/Category/",
        CategoryDefaultImage : "Default.jpg",

        //For Category Upload Image Path 
        CategoryUploadImagePath :  replaceString(__dirname +  "/Assets/Images/Category/", "\\", "/" ),


 
        //For User Display Image Path
        UserDisplayImagePath : "Assets/Images/Profile/",
        UserDefaultImage : "Default.png",
        UserMenDefaultImage : "men.png",
        UserWomenDefaultImage : "women.png",
        WithdrawDefaultImage : "withdraw.png",
        AddMoneyDefaultImage : "withdraw.png",

        //For User Upload Image Path 
        UploadUserImagePath :  replaceString(__dirname +  "/Assets/Images/Profile/", "\\", "/" ),



        //For Appointment Documents Display Path
        DisplayAppointmentDocumentPath : "Assets/Document/", 

        //For Appointment Documents Upload Path 
        UploadAppointmentDocumentPath :  replaceString(__dirname +  "/Assets/Document/", "\\", "/" ),



        //View Path
        ViewPath : replaceString(__dirname +  "/views/", "\\", "/" ),

        //Log file Path
        LogPath : replaceString(__dirname +  "/log/", "\\", "/" ),
        FileName : dateformat(new Date(), "dd-mm-yyyy") + ".log",


        AdminGridDateFormat : "yyyy-mm-dd",



        //For IOS Application Hosting fix
        // IsUnderMaintenance : true,
        // UnderMaintenanceAppVersion : 1.1,
        MaintenanceUserList : [ '5ead1ac1e9e987768981fd2b' ],
		MobileListForNotSendSMS : [ '94959697', '95941312', '94951213', '97236719',     '98545212', '98546324' ], //OTP 1234 
        IsVisibleProviderRegistration : false//,
        //WhatsAppMobileNo : "+919723671930"
    },
    Payment :
    { 
        RequestErrorUrl : "creditplan/purchaseplan",

        CancelUrl : "payment/cancel", 

        SuccessUrl : "payment/success",

        PaymentGatewayAPIMerchantCode : "999999",

        PaymentGatewayAPIMerchantUsername : "testapi@myfatoorah.com",

        PaymentGatewayAPIMerchantPassword : "E55D0",

        PaymentGatewayAPIURL:"https://test.myfatoorah.com/pg/PayGatewayServiceV2.asmx?op=PaymentRequestv2",
      
        PaymentGatewayResponseURL : "Payment/Response",
     
        //PaymentGatewayAPIErrorURL : "Payment/Cancel.html",
      
        PaymentGatewayAPIResponseSuccessURL : "https://test.myfatoorah.com/pg/PayGatewayServiceV2.asmx?op=GetOrderStatusRequestV2",
      
        SoapActionParam : "http://tempuri.org/PaymentRequest",



       //New Payment Gateway 
        // Test Environment
        //PaymentGatewayBaseURL : "https://apidemo.myfatoorah.com", //https://apikw.myfatoorah.com
        //UserName : "apidirectpayment@myfatoorah.com", // y.a.h92@outlook.com
        //Password : "api12345*", // Aumacm22
 
        // Live Environment
        PaymentGatewayBaseURL : "https://apikw.myfatoorah.com", 
        UserName : "y.a.h92@outlook.com",  
        Password : "Aumacm22", // 

    },
    Payment_KNET : 
    {

        //PaymentReqUrl : "http://testupdates.com/KNET/PHP/details.php",   // Test Environment,  Also change in PHP Code
        PaymentReqUrl : "http://es2alny.com/KNET-PaymentGateway/details.php",  // LIVE Environment,  Also change in PHP Code
 

        //PaymentReceiptUrl : "http://testupdates.com/KNET/PHP/", // Test Environment, Receipt page
        PaymentReceiptUrl : "http://es2alny.com/KNET-PaymentGateway/", // LIVE Environment, Receipt page


        CancelUrl : "payment/cancel", 

        SuccessUrl : "payment/success",

        PaymentResUrl : "Payment/Response",
    },    
    Notification : 
    {
        
        IOS :
        {
            //Local
            //ApplicationKey : "AAAAL6sp9FM:APA91bGMgj4wiOWOCzPbz5I3mrR1BGmy2fl4ZgBHZD07xvNWbtcxyTJY7q3-C7ljg7hm_w2QaUUxqzHQrk2p0cfviRMT-M7NPCmJB626IU1I0WAizUh-AJ4p1yj9XdrhlABurvzbWv8w",
            //Live
            ApplicationKey : "AAAAALC_Wgg:APA91bFqkv60z0qh4vr3NcWVVstzfz2H0coowQZT7KPdnckxvb20pqQX5k5oWetyfzaeMemQmQhmTVdFfSJ81ZyZKq13QW1b1D-ZOUOQo_LlLOOLU-Q3JE8cmD9sFlV0iz7am-j-DVcp",

        },
        Android : 
        {
            ApplicationKey : "",
        } 
    },
    Email :
    {
        FromEmail : "noreply@es2alny.com",
        //SENDGRID_API_KEY : "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"  //Es2alny_Test
        SENDGRID_API_KEY : "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"  //Live
    }    
 
    // Locale:
    // {
    //     Current
    // } 

};
