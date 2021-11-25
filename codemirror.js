/* eslint-env browser */

// @ts-ignore
import CodeMirror from 'codemirror'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from 'y-codemirror'
import 'codemirror/mode/markdown/markdown.js'

//Prendo i parametri dell'URL da cui si arriva
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
var username = params.username; 


//Al caricamento della pagina vengono inseriti tutti i controlli
window.addEventListener('load', async () => {
    var logintime = new Date();
    //Alcune info generali
    document.getElementById('room').innerText = "Stai collaborando nella stanza: " + params.room;
    document.getElementById('user').innerText = "Benvenuto " + params.username + "!";
    document.getElementById('accesstime').innerText = "Ultimo login: " + logintime.toUTCString();
    const ydoc = new Y.Doc()
    //Creazione collegamento tra peer basato su stesso nome stanza
    const provider = new WebsocketProvider(
        'ws://localchost:1234',
        params.room,
        ydoc

    )
    const ytext = ydoc.getText('codemirror')
    const editorContainer = document.createElement('div')
    editorContainer.style = "border: 2px solid #ccc; width: 100%"
    editorContainer.setAttribute('id', 'editor')
    document.body.insertBefore(editorContainer, null)

    //Creo l'editor usando il mode markdown (Formato di note gestite da Joplin)
    const editor = CodeMirror(editorContainer, {
        mode: 'markdown',
        lineNumbers: true
    })


    const binding = new CodemirrorBinding(ytext, editor, provider.awareness)
    binding.awareness.setLocalStateField('user', { color: '#008833', name: username });
    const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))

    //Al click del bottone disconnetti l'utente si disconnette dalla stanza
    connectBtn.addEventListener('click', () => {
        if (provider.shouldConnect) {
            provider.disconnect()
            window.location.href = "login.html"
        } else {
            provider.connect()
            connectBtn.textContent = 'Disconnetti'
        }
      })

    console.log(params)
    //Recuperiamo le note da Joplin se il token è immesso
    if (params.token != undefined) {
        let textarea = document.createElement('textarea');
        textarea.id = 'title';
        textarea.style = "border: 2px solid #ccc; width:100%";
        document.body.insertBefore(textarea, editorContainer);
        console.log("Il token è: " + params.token);
        //Aggiungo alla schermata principale i due bottoni di controllo 
        // per caricare la nota selezionata o salvare la nota modificata
        //nel Joplin locale
        let btnSave = document.createElement('button')
        btnSave.type = "button"
        btnSave.id = "btnSave"
        btnSave.textContent = "Salva nota"
        btnSave.style = "float:left"

        let btnLoad = document.createElement('button')
        btnLoad.type = "button"
        btnLoad.id = "btnLoad"
        btnLoad.textContent = "Carica nota selezionata"
        btnLoad.style = "float.left"

        //Aggiungo i bottoni nella posizione desiderata all'interno dell'html
        let parent = document.getElementById('checks')
        parent.appendChild(btnLoad);
        parent.appendChild(btnSave);

        //Effettuo la chiamata al server locale di Joplin
        let response = await new Promise(resolve => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://localhost:41184/notes?token=" + params.token + "&fields=id,title,body", true);
            xhr.onload = function (e) {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                resolve(undefined);
                console.error("** An error occurred during the XMLHttpRequest");
            };
            xhr.send();
        })
        response = JSON.parse(response);
        //Vengono creati dei radio button associati a ogni nota presente su Joplin
        //Affinchè sia riconoscibile la nota che l'utente vuole modificare
        let notelist = document.getElementById("noteslist");
        for (let i = 0; i < response.items.length; i++) {
            let div = document.createElement('div');
            let button = document.createElement('input');
            button.type = "radio";
            button.name = "select";
            button.id = i;
            button.style = "float:left"
            let title = document.createElement('p');
            title.textContent = "Titolo:\t" + response.items[i].title + "\t\t\t{id: " + response.items[i].id + "}";
            div.appendChild(button);
            div.appendChild(title);
            notelist.appendChild(div);
        }
        console.log(response);

        //Comportamento da seguire quando si clicca il bottone per recuperare la nota da Joplin
        const loadbutton = document.getElementById('btnLoad');
        loadbutton.addEventListener("click", () => {
            //Recupera l'id(rappresentante il numero della nota da caricare)
            let itemtoload = document.querySelector("input[name=select]:checked") == null ? -1 : document.querySelector("input[name=select]:checked").id
            var textArea = document.getElementById('editor');
            textArea.value = ""
            if (itemtoload == -1) {
                alert("Per favore, seleziona una nota da modificare")
            }
            else {
                //Carico il contenuto della nota all'interno dell'editor
                editor.setValue(response.items[itemtoload].body);
                document.getElementById('title').value = response.items[itemtoload].title; 
            }
            
        })

        //Comportamento da seguire quando si clicca il bottone per salvare la nota
        const savebutton = document.getElementById('btnSave');
        btnSave.addEventListener("click", async() => {
            let res = await new Promise(resolve => {
                let itemtoload = document.querySelector("input[name=select]:checked") == null ? -1 : document.querySelector("input[name=select]:checked").id

                //In questo caso la nota è nuova e va salvata
                if (itemtoload == -1) {

                    let newValue = JSON.stringify({ 'body': editor.getValue(), 'title': document.getElementById('title').value });

                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", "http://localhost:41184/notes/?token=" + params.token, true);
                    xhr.onload = function (e) {
                        resolve(xhr.response);
                        alert("Aggiornamento avvenuto con successo")
                    };
                    xhr.onerror = function () {
                        resolve(undefined);
                        console.error("** An error occurred during the XMLHttpRequest");
                    };
                    xhr.send(newValue);

                }
                //altrimenti va aggiornata
                else {
                    let newValue = JSON.stringify({ 'body': editor.getValue(), 'title': document.getElementById('title').value });

                    var xhr = new XMLHttpRequest();
                    xhr.open("PUT", "http://localhost:41184/notes/" + response.items[itemtoload].id + "?token=" + params.token, true);
                    xhr.onload = function (e) {
                        resolve(xhr.response);
                        alert("Aggiornamento avvenuto con successo")
                    };
                    xhr.onerror = function () {
                        resolve(undefined);
                        console.error("** An error occurred during the XMLHttpRequest");
                    };
                    xhr.send(newValue);
                }
                    
               
            })
            res = JSON.parse(res);
        })

       


    }
    else {
        console.log("Il token non è definito");
    }
    
      // @ts-ignore
    window.example = { provider, ydoc, ytext, binding, Y }

 
})
