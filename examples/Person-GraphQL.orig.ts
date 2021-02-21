export class Person {
  id: number;

  username: string;

  firstName: string;

  lastName: string;

  signUpTimestamp: number;

  get signedUpAgo() {
    return Date.now() - this.signUpTimestamp;
  }
}
