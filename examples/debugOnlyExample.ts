import { debugOnly } from "./debugOnly.decorator";

export class Task {
  @debugOnly
  shouldLog = true;

  run() {
    // ... code in here
  }
}
