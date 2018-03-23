export namespace Environment {
  // Set your app configurations here.
  // For the list of config options, please refer to https://ionicframework.com/docs/api/config/Config/
  export const config = {
    mode: 'ios', //Firestarter's style is custom-designed based on iOS style, removing or changing this WILL MAKE THE APP LOOK BAD.
    menuType: 'overlay'
  };
  // Set language to use.
  export const language = 'tr';
  // Firebase Cloud Messaging Server Key.
  // Get your gcmKey on https://console.firebase.google.com, under Overview -> Project Settings -> Cloud Messaging.
  // This is needed to send push notifications.
  export const gcmKey = 'AAAAvE9kDCs:APA91bH6ZpM_eY5JTRSPJQ9GDCRGwiVz_kHIyjQv5yt5vb1IjaPO6E0MnYYPg-LYudhLFjtjhoaW3_UbN5m8Q7wACRqYMaGI_HguvwhXEUN0fCrk22zrwPC5TjsEIo4HRC6O9TGwp6Jf';
  // Set to your Firebase app, you can find your credentials on Firebase app console -> Add Web App.
  export const firebase = {
    apiKey: "AIzaSyAkETAXT5cZ9WCxFLNEip4LwENZq49ihMY",
    authDomain: "zigi-v2.firebaseapp.com",
    databaseURL: "https://zigi-v2.firebaseio.com",
    projectId: "zigi-v2",
    storageBucket: "zigi-v2.appspot.com",
    messagingSenderId: "434618250965"
  };
  // You can find your googleWebClientId on your Firebase app console -> Authentication -> Sign-in Method -> Google -> Web client ID
  export const googleWebClientId: string = '808785808427-75h0objp7eq3nehkr6mhin72glpr7sl6.apps.googleusercontent.com';
  // Loading Configuration.
  // Please refer to the official Loading documentation here: https://ionicframework.com/docs/api/components/loading/LoadingController/
  export const loading = {
    spinner: 'circles'
  };
  // Toast Configuration.
  // Please refer to the official Toast documentation here: https://ionicframework.com/docs/api/components/toast/ToastController/
  export const toast = {
    position: 'bottom' // Position of Toast, top, middle, or bottom.
  };
  export const toastDuration = 5000; // Duration (in milliseconds) of how long toast messages should show before they are hidden.
}
