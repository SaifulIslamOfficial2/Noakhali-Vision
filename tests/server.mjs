import { setDb } from "../api/_lib/db.js";
import { FakeDb } from "./fake-mongo.mjs";
setDb(new FakeDb());
await import("../dev-api.mjs");
