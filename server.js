const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());

const port = process.env.PORT || 5000
let docker
let client_id = 0
let clients = new Map()

app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

router.get('/docker_hello', (req, res) => {
  //if (/* is really our docker)*/)
  console.log("Docker Hello")
  docker = res
  setTimeout(function(){
    console.log(docker!= null)
    if(docker != null ){
      res.send("200");
      docker = null
      console.log("Docker Bye")
    }
  }, 25000);
})

router.post("/docker_post",(req, res) => {
  let id = parseInt(req.body.id)
  clients.get(id).send(req.body.data)
  clients.delete(id)
  res.send("200");
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
