import {LZString} from "./libs/lz-string.js"
import {TextEditor} from "./TextEditor";

//handles sharing the text through a link
export class ShareLink {
    private static _inputElement: HTMLTextAreaElement
    private static _texthandler:TextEditor
    private static _generatedURL:string = ""
    constructor(texthandler:TextEditor) {

        ShareLink._inputElement = document.getElementById("CodeInput") as HTMLTextAreaElement
        document.getElementById("ShareButton").addEventListener("click",ShareLink.genSharelinkOptionsModal)
        document.getElementById("ShareConfirmButton").addEventListener("click",ShareLink.share)
        ShareLink._texthandler = texthandler
        //immediately read from url
        this.readSharelink()
    }


//compress data and check if the url would be too long
    private static genSharelinkOptionsModal(){
        //compression
        const compressedString = LZString.compressToEncodedURIComponent(ShareLink._inputElement.value)
        let url = new URL(window.location.origin)
        url.searchParams.append("text", compressedString)
        ShareLink._generatedURL = url.toString()
        //check if link would be too long for nginx
        let xmlhttpCheckLinkLength = new XMLHttpRequest();
        xmlhttpCheckLinkLength.onreadystatechange = function() {
            if ((xmlhttpCheckLinkLength) && (xmlhttpCheckLinkLength.readyState == 4))
            {
                let linkRadio = document.getElementById("ShareRadioLink") as HTMLInputElement
                if (xmlhttpCheckLinkLength.status == 200){
                    linkRadio.disabled = false
                    linkRadio.labels.item(0).innerText = "Share as link"
                } else if (xmlhttpCheckLinkLength.status == 414){
                    linkRadio.disabled = true
                    linkRadio.checked = false
                    linkRadio.labels.item(0).innerText = "Share as link (disabled: link too long)"
                }
            }
        }
        xmlhttpCheckLinkLength.open("GET", url.toString(), true );
        try {xmlhttpCheckLinkLength.send();} catch (e) {}

    }

    private static share(){
        //this should never happen but just to be safe
        if (ShareLink._generatedURL == ""){
            ShareLink.genSharelinkOptionsModal()
        }
        let radios = document.forms.namedItem("shareForm").elements.namedItem("ShareRadios") as RadioNodeList
        if (radios.value == "link"){
            //set url
            if ((document.forms.namedItem("shareForm").elements.namedItem("copyToClip") as HTMLInputElement).checked) {
                navigator.clipboard.writeText(ShareLink._generatedURL.toString())
            }
            history.replaceState(null, "",  ShareLink._generatedURL.toString())
        } else {
            let response:string = ""
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if ((xmlhttp) && (xmlhttp.readyState == 4) && (xmlhttp.status == 200))
                {
                    response = xmlhttp.response;
                    let url = new URL(window.location.origin)
                    url.searchParams.append("file", response)

                    if ((document.forms.namedItem("shareForm").elements.namedItem("copyToClip") as HTMLInputElement).checked) {
                        navigator.clipboard.writeText(url.toString())
                    }
                    history.replaceState(null, "",  url.toString())
                }
            }
            let formData = new FormData();
            formData.append("text", LZString.compressToBase64(ShareLink._inputElement.value));
            xmlhttp.open("POST", "/ajax/save/", true );
            xmlhttp.send(formData);
        }

    }
    //read data from url into input
    private readSharelink(){
        let url = new URLSearchParams(window.location.search)
        if (url.has("text")) {
            ShareLink._inputElement.value = LZString.decompressFromEncodedURIComponent(url.get("text"))

            ShareLink._texthandler.update()
            setTimeout(() => {ShareLink._texthandler.startParser()}, 1)

        } else if (url.has("file")) {
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if ((xmlhttp) && (xmlhttp.readyState == 4) && (xmlhttp.status == 200))
                {
                    if (xmlhttp.responseText != "error") {
                        ShareLink._inputElement.value = LZString.decompressFromBase64(xmlhttp.response)
                        ShareLink._texthandler.update()
                        setTimeout(() => {ShareLink._texthandler.startParser()}, 1)
                    }
                }
            }
            xmlhttp.open("GET", "/ajax/get/" + url.get("file"), true );
            xmlhttp.send();
        } else {
            ShareLink._inputElement.value = (sessionStorage.getItem("MSCGen+ autosave") || "")
            ShareLink._texthandler.update()
            setTimeout(() => {ShareLink._texthandler.startParser()}, 1)
        }
    }
}