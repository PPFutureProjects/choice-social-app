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
  export const gcmKey = 'AAAAW63DFKs:APA91bG3cNKXAIXte89kelXUmvt08lkCeUcSxyKNXHf90jNoc4nyCnzr8VMFXtmwzEi4OS4LNFmC5sT6g-VSKDIn8t5FJt3D3pDkkK3Ckc4Uy-Z2I5wwMx1XpM5Pm65UiOjXS_xfyR1d';
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
  export const googleWebClientId: string = '393757267115-maknmm3b7q8vajvr1h0t5o5k2lld6i6l.apps.googleusercontent.com';
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
