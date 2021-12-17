const express = require('express')
const app = express()
const bodyParser = require("body-parser");
var url = require('url');
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.PORT || 5000
let client_id = 0
let special_client_id = 0
let clients = new Map()
let special_clients = new Map()

//Aplicação à escuta no porto
app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

//Ativa quando chega um get de um cliente especial (Docker)
router.get('/special_client_hello', (req, res) => {
  special_client_id += 1
  //Cada cliente fica um um client_id próprio
  let this_client_id = special_client_id
  special_clients.set(this_client_id, res)
  //Por default Heroku tem 30 segundos
  //25 segundos de timeout para compensar possiveis
  //Congestões na rede
  setTimeout(function(){
      disconnect_special_client(this_client_id, res)
  }, 25000);
})

//Envia um Special Client Bye que o java reconhece
function disconnect_special_client(this_client_id){
  if(special_clients.get(this_client_id) != null){
      special_clients.get(this_client_id).send("Special Client Bye");
   }
   special_clients.delete(this_client_id)
   console.log("Special Client Bye")
 }

//Vai buscar um special client que esteja sem fazer nada
function get_idle_special_client(){
    for (var entry of special_clients.entries()) {
        var key = entry[0], value = entry[1];
        if (value != null){
            console.log("Chave: " + key)
            return key
        }
    }
    return null
 }


//Ativa quando chega um post de um cliente especial (Docker)
router.post("/special_client_bye",(req, res) => {
  let client_id = parseInt(req.body.client_id)
  let special_client_id = parseInt(req.body.special_client_id)
  if (req.body.isJson === 'true'){
      //No caso de ser uma resposta em JSON
      clients.get(client_id).send(JSON.parse(req.body.data))
  } else {
      clients.get(client_id).send(req.body.data)
  }
  res.send("200")
  clients.delete(client_id)
  disconnect_special_client(special_client_id)
});

app.use("/", router);

//Todos os gets de cleintes serão 
//tratados na função abaixo
router.get('*', handle_client_get)

function handle_client_get(req, res){
  for (var special_client = get_idle_special_client(); special_clients.get(special_client_id) != null; ){
    client_id += 1
    let url_tail = req.params[0] || ""
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    special_clients.get(special_client_id).send("GET|" + client_id + "|" + special_client_id + "|" + url_tail + "|" + JSON.stringify(req.headers) + "|" + JSON.stringify(query))
    clients.set(client_id, res)
    special_clients.set(special_client_id, null)
  }
}

//Todos os posts de clientes 
//serão tratados na função abaixo
router.post('*', handle_client_post)

function handle_client_post(req, res){
  for (var special_client = get_idle_special_client(); special_clients.get(special_client_id) != null; ){
    client_id += 1
    let url_tail = req.params[0] || ""
    special_clients.get(special_client_id).send("POST|" + client_id + "|" + special_client_id + "|" + url_tail + "|" + JSON.stringify(req.headers) + "|" + JSON.stringify(req.body))
    clients.set(client_id, res)
    special_clients.set(special_client_id, null)
  }
}
