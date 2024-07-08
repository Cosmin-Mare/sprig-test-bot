import * as Y from "yjs";
import admin from "firebase-admin";
import { WebrtcProvider } from "./y-webrtc.js";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import { StatsD } from "node-statsd";
config();

let roomsListening = [];
let firebaseApp = null;
if (admin.apps.length === 0) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(process.env.FIREBASE_CREDENTIAL, "base64").toString()
      )
    ),
  });
} else {
  firebaseApp = admin.apps[0];
}

const firestore = getFirestore(firebaseApp);
try {
  firestore.settings({ preferRest: true });
} catch (e) {
  console.log(e);
}

const environment = process.env.NODE_ENV;
const graphite = process.env.GRAPHITE_HOST;

if (graphite === null) throw new Error("Graphite host is not configured");

const options = {
  host: graphite,
  port: 8125,
  prefix: `${environment}.sprig.`,
};

const metrics = new StatsD(options);

export default metrics;

const timedOperation = async (metricKey, callback) => {
  const startTime = new Date().getTime();
  const result = await callback();
  const endTime = new Date().getTime() - startTime;

  metrics.timing(metricKey, endTime);
  return result;
};
function getGame(id) {
  return firestore.collection("games").doc(id).get();
}

// firestore.collection("games").onSnapshot((snapshot) => {
//   snapshot.docChanges().forEach((change) => {
//     let firstUpdated = true;
//     const doc = change.doc;
//     const data = change.doc.data();
//     const lastModified = data.modifiedAt.toDate()
//     console.log(doc.id === "yfOJcm01IvronK4e8MtY" ? lastModified : null) 
//     const now = new Date()
//     const diff = now - lastModified
//     if(diff < 5 * 1000 * 60){
//       if(roomsListening.find((r) => r.room === doc.id) === undefined){
//         console.log("Started listening " + doc.id)
//         let ydoc = new Y.Doc();
//         ydoc.getText("codemirror").insert(0, data.code);
//         let provider = new WebrtcProvider(doc.id, ydoc, {
//           signaling: ["wss://yjs-signaling-server-5fb6d64b3314.herokuapp.com"],
//         });
//         roomsListening.push({
//           room: doc.id,
//           provider: provider,
//           ydoc: ydoc,
//         });
//         let code = ydoc.getText("codemirror").toString();
//         ydoc.on("update", () => {
//           console.log(provider.awareness.getStates())
//           if (!firstUpdated) {
//             provider.awareness.setLocalState({ saved: "saving" });
//             return;
//           }
//           firstUpdated = false;
//           setInterval(async () => {
//             if (provider.awareness.getStates().size <= 1) {
//               provider.awareness.setLocalStateField("saved", "error");
//               return;
//             }
//             const metricKey = "database.update";
//             code = ydoc.getText("codemirror").toString();
    
//             // await timedOperation(metricKey, async () => {
//               firestore
//                 .collection("games")
//                 .doc(doc.id)
//                 .update({
//                   code,
//                   modifiedAt: Timestamp.now(),
//                   tutorialName: data.tutorialName ?? null,
//                 });
//             // });
    
//             // await timedOperation(metricKey, async () => {
//               firestore
//                 .collection("daily-edits")
//                 .doc(`${doc.id}-${new Date().toDateString()}`)
//                 .set({
//                   type: "game",
//                   date: Timestamp.now(),
//                   id: doc.id,
//                 });
//             // });
//             provider.awareness.setLocalStateField("saved", "saved");
//           }, 2000);
//         });
//       }
//     }
//   })
// })

const args = process.argv.slice(2)
const room = args[0]
try {
    if (!room) {
        throw new Error("Room is required");
    }
    // if (!(await getGame(room)).exists) {
    //     throw new Error("Room does not exist");
    // }
    // const roomData = roomsListening.find((r) => r.room === room);
    // if (roomData !== undefined) {
    //     return res.status(200).send("Already listening");
    // }
    let ydoc = new Y.Doc();
    let provider = new WebrtcProvider(room, ydoc, {
        signaling: ["wss://yjs-signaling-server-5fb6d64b3314.herokuapp.com"],
    });
    const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const id = genRanHex(8)
    provider.awareness.setLocalStateField("bot", id);
    let firstUpdate = true;
    ydoc.getText("codemirror").insert(0, id);
    console.log("Wrote")
    ydoc.on("update", () => {
        if(firstUpdate){
        }
        console.log(ydoc.getText("codemirror").toString()+" ")
    });
    roomsListening.push({
        room: room,
        provider: provider,
        ydoc: ydoc,
    });
} catch (e) {
    console.log(e);
}