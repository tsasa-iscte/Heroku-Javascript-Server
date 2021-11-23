const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());

const port = process.env.PORT || 5000
let docker
let client_id = 0
let special_client_id = 0
let clients = new Map()
let special_clients = new Map()

app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

router.get('/docker_hello', (req, res) => {
  //if (/* is really our docker)*/)
  console.log("Docker Hello")
  console.log(special_client_id)
  special_client_id += 1
  console.log(special_client_id)
  let this_client_id = special_client_id
  console.log("This_client_id inicial: " + this_client_id)
  special_clients.set(this_client_id, res)
  docker = res
  setTimeout(function(){
    if(special_clients.get(this_client_id) != null){
      res.send("200");
      console.log("This_client_id timeout: " + this_client_id)
      special_clients.delete(this_client_id)
      docker = null
      console.log("Docker Bye")
    }
  }, 5000);
})

router.post("/docker_post",(req, res) => {
  let client_id = parseInt(req.body.client_id)
  let special_client_id = parseInt(req.body.special_client_id)
  clients.get(client_id).send(req.body.data)
  special_clients.get(special_client_id).send("200")
  clients.delete(client_id)
  special_clients.delete(special_client_id)
  res.send("200");
  docker = null
  console.log("Docker Bye")
});

app.use("/", router);

router.get('*', handle_client_get)

function handle_client_get(req, res){
  console.log(req.params)
  if (docker){
    client_id += 1
    let url_tail = req.params[0] || ""   
    docker.send(client_id + "|" + url_tail)
    clients.set(client_id, res)
    docker = null
  }else{
    res.send("Docker not connected!")
  }
}

router.post('*', handle_client_post)

function handle_client_post(req, res){
  if (docker){
    client_id += 1
    let url_tail = req.params[0] || ""
    docker.send(client_id + "|" + url_tail + "|" + JSON.stringify(req.body))  //req.body -> dados do POST
    clients.set(client_id, res)
    docker = null
  }else{
    res.send("Docker not connected!")
  }
}
