import {TextEditor} from "./TextEditor.js";
import {Globals} from "./Globals.js";
import {DiagramExporter} from "./DiagramExporter.js";
import {ShareLink} from "./Share.js";

export let globals : Globals = new Globals()
document.getElementById("autorendercheck").addEventListener("change", () => {
    localStorage.setItem("autorendercheck", (document.getElementById("autorendercheck") as HTMLInputElement).checked.toString())
})
setTimeout(() => {
    text = new TextEditor()
    shareHandler = new ShareLink(text)
    exporter= new DiagramExporter()

}, 1)
setInterval(() =>{
    console.log("saving...")
    sessionStorage.setItem("MSCGen+ autosave", (document.getElementById("CodeInput") as HTMLTextAreaElement).value)
}, 30000)
let text : TextEditor
let shareHandler : ShareLink
let exporter : DiagramExporter
