module.exports = {

  Language  : 
  {
    English : "5cb58388dbe4973a7ce65b7d",
    Arabic  : "5cb58602dbe4973a7ce65b8c"
  },
   
  AppType : 
  {
    IOS : 1,
    Android : 2,
    Admin : 3,
  },

  Gender  : 
  {
    Secret : 0, 
    Male : 1,
    Female  : 2    
  },

  LookupCode : 
  {
    Degree : 1,

  },

  CurrencySymbol : 
  {
    Kuwait : "KD"
  },

  UserType :
  {
      Admin : "5cb5adc8dbe4973a7ce65c70",
      Provider : "5cb5ae00dbe4973a7ce65c71",
      Consumer : "5cb5ae45dbe4973a7ce65c72"    
  },

  UserStatus :
  {
      ActiveUser : 1,
      BlockUser  : 2, // Don't use in database otherwise generate major issues (StatusType) - example -> block - active, approved - active related
      NotApproveByAdmin : 3
  },

  PaymentStatusCode : 
  {
      Failed : 0,
      Success : 1, 
      //Pending : 2
  },

  PaymentType : 
  {
      AddByAdmin : 0,
      MyFatoorah : 1,
      KNET : 1,
      VISACHECKOUT : 2
  },
  

  UpdateAppointmentType : 
  {
      Question : 1,
      Answer : 2,
      Rate : 3
  },
   
  LookupCode : 
  {
      Degree : 1,
      SpeaksAndUnderstandsLanguage : 2
  },

  SortOrderId : 
  {
    Asc : 1,
    Desc : 2,
    Default : 3
  },


  FileTypeId : 
  {
    UserProfileImage : 1,
    CategoryImage : 2,
    AppointmentDocument : 3
  },



  ErrorCode : 
  {

    //For API
    InvalidHeader : -1,  
    TechnicalError : -2,  
    InvalidLoginToken : 5,
    InvalidParameter : 6,
    OTPSentSuccessfully : 7,
    InvalidOTP : 8,
    NotRegistration : 9,
    DataRetrievedSuccessfully : 10,
    LogoutSuccessfully : 11,
    EmailAlreadyExists : 12,
    MobileNoAlreadyExists : 13,
    RegistrationSuccessfully : 14,
    InsufficientBalance : 15,
    NegativeBalance : 16,
    IncompleteLastConversation : 17,
    EnableForAskQue : 18,
    UpdateAppointmentSuccessfully : 19,
    NotUpdateAppointment : 20,
    FeedbackSentSuccessfully : 21,
    LoginSuccessfully : 22,
    EnableForPopUpWithoutPayment : 23,
    UpdateProfileSuccessfully : 24,
    NotUpdateProfile : 25,
    ImageUploadSuccessfully : 26,
    NotUploadImage : 27,
    InvalidUserId : 28,
    InvalidPlanId : 29,
    PaymentRequestSuccessfully : 30,
    InvalidFile : 31,
    FileUploadSuccessfully : 32,
    LastRequestNotCompleted : 33,
    WithdrawRequestSendSuccessfully : 34,
    InsufficientProviderBalance : 35,
    DeletedUser : 36,
    InvalidMobileNo : 37,
    ProviderRegistrationSuccessfully : 38,    
    InvalidLogin : 39,
    NotApproveByAdmin : 40,
    BlockUserByAdmin : 41,
    ChangePasswordSuccessfully : 42,
    NotChangePassword : 43,
    InvalidEmailAddress : 44,
    ForgotPasswordEmailSendSuccessfully : 45,
    ForgotPasswordEmailFailed : 46,
    MustBeMinimumWithdrawalAmount : 47,
    UpdateVisitProfileSuccessfully : 48,
    AlreadyGivenRating : 49,
    MissingQuestion : 50,
    MissingAnswer : 51,
    

  //For Admin
    InvalidLoginCredential : 51,
    DeleteSuccessfully : 52,
    UpdateSuccessfully : 53,
    CreateSuccessfully : 54,
    NotUpdated : 55,
    PaymentSuccessfully : 56,
    NotDeleteUseDegree : 57,
    NotDeleteUseCategory : 58,
    NotDeleteUseLanguage : 59,
    NotAddSubCategory : 60,
    NotChangeCategoryTypeRemoveProvider : 61,
    NotChangeCategoryTypeRemoveSubCategory : 62,
    NotDeleteUseCategoryWithSubcategory : 63,
    NotApprovedToDisApprovedUser : 64,

    //Supplier in Multi Vendor 
    SupplierCreatedSuccessfully : 65,
    SupplierCreatedFail : 66, 
    SupplierUpdatedSuccessfully : 67, 
    SupplierUpdatedFail : 68,
    SupplierDataRetrievedSuccessfully : 69, 
    SupplierDataNotFound : 70, 
    BankRetrievedSuccessfully : 71, 

    
    
  },

  ErrorMsg : 
  {

    //For API
    InvalidHeader : "Invalid header.",  
    TechnicalError : "Technical error.",
    InvalidLoginToken : "Invalid login token.",
    InvalidParameter : "Invalid parameter.", 
    OTPSentSuccessfully : "OTP Sent Successfully.", 
    InvalidOTP : "Invalid OTP.", 
    NotRegistration : "This user is not exist. Please registration it.",
    DataRetrievedSuccessfully : "Data retrieved successfully.",
    LogoutSuccessfully : "Logout Successfully", //Expire Login Token and Notification Token
    EmailAlreadyExists : "Email Already Exists",
    MobileNoAlreadyExists : "Mobile No Already Exists",
    RegistrationSuccessfully : "Registration Successfully",
    InsufficientBalance : "Insufficient balance in your wallet.",
    NegativeBalance : "Negative Balance",
    IncompleteLastConversation : "Incomplete Last Conversation.",
    EnableForAskQue : "Amount deducted successfully in your wallet and Ask your question to the provider.",
    UpdateAppointmentSuccessfully : "Appointment updated successfully.", 
    NotUpdateAppointment : "Not Update Appointment details", 
    FeedbackSentSuccessfully : "Feedback Sent Successfully",
    LoginSuccessfully : "Login Successfully",
    EnableForPopUpWithoutPayment : "Enable For PopUp Without Payment (Open Popup).",
    UpdateProfileSuccessfully : "Profile updated successfully.", 
    NotUpdateProfile : "Profile not updated.", 
    ImageUploadSuccessfully : "Image Upload Successfully.", 
    NotUploadImage : "Not Upload Image",
    InvalidUserId : "Invalid User Id",
    InvalidPlanId : "Invalid Plan Id",
    PaymentRequestSuccessfully : "Payment Request Successfully",
    InvalidFile : "Upload valid file.",
    FileUploadSuccessfully : "File Upload Successfully.",
    LastRequestNotCompleted : "Last Request Not Completed By Admin.",
    WithdrawRequestSendSuccessfully : "Withdraw Request Send Successfully",
    InsufficientProviderBalance : "Insufficient Provider Balance.",
    DeletedUser : "Deleted User By Admin",
    InvalidMobileNo : "",
    ProviderRegistrationSuccessfully : "Provider registration successfully.",
    InvalidLogin : "Invalid login credential.",
    NotApproveByAdmin : "Your account is currently pending approval by the site administrator.",
    BlockUserByAdmin : "Your account is currently blocked by the site administrator.",
    ChangePasswordSuccessfully : "Your account password has been changed successfully! ",
    NotChangePassword : "Not change your account password.",
    InvalidEmailAddress : "This email not exists. Please enter valid email.",
    ForgotPasswordEmailSendSuccessfully : "Your account credential sent successfully.",
    ForgotPasswordEmailFailed : "Forgot password email failed.",
    MustBeMinimumWithdrawalAmount : "Minimum withdrawal amount is not mach.",
    UpdateVisitProfileSuccessfully : "Visit profile updated successfully.",
    AlreadyGivenRating : "You have already given rating for this appointment.",
    MissingQuestion : "Missing question for this appointment.",
    MissingAnswer : "Missing answer for this appointment.",


    //For Admin
    InvalidLoginCredential : "Invalid login credential.",
    DeleteSuccessfully : "Record deleted successfully.",
    UpdateSuccessfully : "Record Updated Successfully.",
    CreateSuccessfully : "Record Created Successfully.",
    PaymentSuccessfully : "Payment added successfully.",
    NotDeleteUseDegree : "Some provider use this degree. So, you can not delete this degree.",
    NotDeleteUseCategory : "Some provider use this category. So, you can not delete this category.",
    NotDeleteUseLanguage : "Some provider use this language. So, you can not delete this language.",
    NotAddSubCategory : "You have set as parent category. So, you can't add any subcategory under this",
    
    NotChangeCategoryTypeRemoveProvider : "Please remove the provider of this category then you can change the category type.",
    NotChangeCategoryTypeRemoveSubCategory : "Please remove the sub category then you can change the category type.",
    NotDeleteUseCategoryWithSubcategory : "Some subcategory use in this category. So, you can not delete this category.",
    NotApprovedToDisApprovedUser : "You can't change the active user status. (Approved to Dis-Approved)", 
  

    //Supplier in Multi Vendor 
    SupplierDataRetrievedSuccessfully : "Supplier data retrieved successfully.", 
    SupplierDataNotFound : "Supplier data not found.",
    BankRetrievedSuccessfully : "Bank data retrieved successfully.",
  },

  Template : 
  {
    SMSForOTP : "Please enter the OTP @OTP@ to verify your account."
  },


  TemplateCode : 
  {
    WelcomeEmail : 1,

    ForgotPasswordEmail : 2,

    SuccessPaymentEmail : 3,

    FailedPaymentEmail : 4 
  },



  AppointmentDocumentType : 
  {
    Text : 1,

    Image : 2,

    Audio : 3
  },  
  



};
