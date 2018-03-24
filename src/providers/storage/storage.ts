import { Injectable } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File, Entry } from '@ionic-native/file';
import { LoadingProvider, ToastProvider, TranslateProvider } from '../';
import firebase from 'firebase';

@Injectable()
export class StorageProvider {
  public profilePhoto: CameraOptions;
  public photoMessage: CameraOptions;

  constructor(private camera: Camera, public file: File,
    private loading: LoadingProvider,
    private toast: ToastProvider,
    private translate: TranslateProvider) {
    // Set profilePhoto specifications based on CameraOptions.
    // For reference: https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/index.html
    this.profilePhoto = {
      quality: 25,
      targetWidth: 288,
      targetHeight: 288,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true,
      allowEdit: true
    };

    this.photoMessage = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: false,
      allowEdit: false
    };
  }

  // Convert fileURI to Blob.
  private uriToBlob(fileURI): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.file.resolveLocalFilesystemUrl(fileURI).then((fileEntry: Entry) => {
        fileEntry.getParent((directoryEntry: Entry) => {
          this.file.readAsArrayBuffer(directoryEntry.nativeURL, fileEntry.name).then((data: ArrayBuffer) => {
            var uint8Array = new Uint8Array(data);
            var buffer = uint8Array.buffer;
            let blob = new Blob([buffer]);
            resolve(blob);
          }).catch(err => {
            reject(err);
          });
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  // Upload an image file provided the userId, cameraOptions, and sourceType.
  public upload(userId: string, options: CameraOptions, sourceType: number): Promise<string> {
    options.sourceType = sourceType;
    return new Promise((resolve, reject) => {
      // Get the image file from camera or photo gallery.
      this.camera.getPicture(options).then(fileUri => {
        this.loading.show();
        let fileName = JSON.stringify(fileUri).substr(JSON.stringify(fileUri).lastIndexOf('/') + 1);
        fileName = fileName.substr(0, fileName.length - 1);
        // Append the date string to the file name to make each upload unique.
        fileName = this.appendDateString(fileName);
        // Convert URI to Blob.
        console.log("File: " + fileName);
        console.log("FileURI: " + fileUri);
        this.uriToBlob(fileUri).then(blob => {
          let metadata = {
            'contentType': blob.type
          };
          // Upload blob to Firebase storage.
          firebase.storage().ref().child('images/' + userId + '/' + fileName).put(blob, metadata).then(snapshot => {
            let url = snapshot.metadata.downloadURLs[0];
            this.loading.hide();
            resolve(url);
          }).catch(err => {
            console.log("ERROR STORAGE: " + JSON.stringify(err));
            this.loading.hide();
            reject();
            this.toast.show(this.translate.get('storage.upload.error'));
          });
        }).catch(err => {
          console.log("ERROR BLOB: " + err);
          this.loading.hide();
          reject();
          this.toast.show(this.translate.get('storage.upload.error'));
        });
      }).catch(err => {
        console.log("ERROR CAMERA: " + JSON.stringify(err));
        reject();
        this.toast.show(this.translate.get('storage.upload.error'));
      });
    });
  }

  // Delete the uploaded file by the user, given the userId and URL of the file.
  public delete(userId: string, url: string): void {
    // Get the fileName from the URL.
    let fileName = url.substring(url.lastIndexOf('%2F') + 3, url.lastIndexOf('?'));
    // Check if file really exists on Firebase storage.
    firebase.storage().ref().child('images/' + userId + '/' + fileName).getDownloadURL().then(res => {
      // Delete file from storage.
      firebase.storage().ref().child('images/' + userId + '/' + fileName).delete();
    }).catch(err => { });
  }

  // Append the current date as string to the file name.
  private appendDateString(fileName: string): string {
    let name = fileName.substr(0, fileName.lastIndexOf('.')) + '_' + Date.now();
    let extension = fileName.substr(fileName.lastIndexOf('.'), fileName.length);
    return name + '' + extension;
  }

}
