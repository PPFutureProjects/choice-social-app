import { Injectable } from '@angular/core';

@Injectable()
export class TranslateProvider {
  private translations: any;

  constructor() { }

  // Set the translations of the app.
  public setTranslations(translations: any): void {
    this.translations = translations;
  }

  public getTranslations(): any {
    return this.translations;
  }

  // Get the translated string given the key based on the i18n .json file.
  public get(key: string): string {
    return this.translations[key];
  }

}
