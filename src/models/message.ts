export class Message {
  public object: {};
  constructor(
    public sender: string, //userId of sender
    public type: number, //0 = text, 1 = image
    public message: string,
    public date: Date
  ) {
    this.object = {
      sender: sender,
      type: type,
      message: message,
      date: date
    };
  }
}
