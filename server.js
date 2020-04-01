// simple CRUD
// Create, Read, Update, Delete
// POST, GET, PUT, DELETE

const express = require('express')
const bodyParser = require('body-parser') // Este é um "plugin" (middleware) do Express que ajuda na interação com os dads do req e res no nosso app
const app = express() // Express é uma forma mais rápida de criar servidores com NodeJS

const ObjectId = require('mongodb').ObjectID
const MongoClient = require('mongodb').MongoClient // Configurando para o clinte MongoDB

const uri = "mongodb+srv://username:password@cluster0-njnwe.mongodb.net/test?retryWrites=true&w=majority"

const crypto = require('crypto') // Middleware para criptografar as senhas



MongoClient.connect(uri, (err, client) => { // Conectando com o cliente MongoDB e startando o server
    if (err) return console.log(err) 
    db = client.db('simpleCRUD')

    app.listen(3000, () => { // O servidor só roda no localhost:3000 se conseguir se conectar no cliente MongoDB
        console.log('Server running on port 3000 and Mongo Client connected!') // O método ".listen" do Express inicia um socket UNIX e escuta as conexões em um caminho fornecido (no caso, localhost:3000)
    })
})

app.use(express.static(__dirname + '/public')) // Para usar o CSS

app.use(bodyParser.urlencoded({ extended: true })) //O método urlencoded dentro de body-parser diz ao body-parser para extrair dados do elemento <form> e adicioná-los à propriedade body no objeto request.

app.set('view engine', 'ejs') // Configurando o EJS, que facilita a interação entre o Express e o HTML

const getHashedPassword = (password) => { // Nossa função para criptografar as senhas
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}



// GET (Read)
app.get('/', (req, res) => { // TODO session management
    res.redirect('/register') // Ao abrir a página,. o navegador fará imediatamente uma requisição GET
})

// GET (Read)
app.get('/register', (req, res) => { 
    res.render('register.ejs') // Ao abrir a página,. o navegador fará imediatamente uma requisição GET
})

// GET (Read)
app.get('/login', (req, res) => {
    res.render('login.ejs') 
})

// GET (Read)
app.get('/show', (req, res) => { // O nosso form nos manda para "/show" e lá o navegador irá fazer outra request GET, que respondemos com os dados do nosso banco no ejs
    db.collection('data').find().toArray((err, results) => {
        if (err) return console.log(err)

        res.render('show.ejs', { data: results })
    })
})

// POST (Create)
app.post('/show', (req, res) => { // Este bloco recebe a submissão do form que foi marcado como "/show" no nosso HTML e envia para o cliente MongoDB, redirecionando no final para "/show"
    if (req.body.name == undefined) { // No caso de a requisição vier de login.ejs (não existe nenhum input de "name", logo, sai undefined)
        let reqEmail = req.body.email
        req.body.password = getHashedPassword(req.body.password) // Criptografando nossa senha antes de tudo

        db.collection('data').find({ email: reqEmail }).toArray((err, results) => { // Achar o email no db
            if (err) return console.log(err)

            if (results.length > 0) { // Os resultados chegam em um array, pdemos ver a .length dele
                if (results[0].password == req.body.password) { // Como recebemos em um array, temos que escolher o índice primeiro
                    res.redirect('/show')
                }
                else { 
                    return res.send("Senha Incorreta!")
                }
            }
            else { // Caso não seja achado nada no banco
                return res.send("Este usuário não existe")
            }
        })
    }
    else { // No caso de a requisição vier de register.ejs
        req.body.password = getHashedPassword(req.body.password) // Criptografando nossa senha antes de salvar
        let reqEmail = req.body.email // Email da request para fazer a validação

        db.collection('data').find({ email: reqEmail }).toArray((err, results) => {
            if(err) return console.log(err)
            if (results.length > 0) {
                return res.send("Usuário já cadastrado!")
            }
            else {
                db.collection('data').save(req.body, (err, result) => { // Salvando a request no db
                    if (err) return console.log(err)

                    console.log('Salvo no banco de dados!')
                    res.redirect('/show') // Redirecionando o usuário para a página de demonstração novamente
                })
            }
        })
    }
})

// Para editar os dados (PUT)
app.route('/edit/:id')
.get((req, res) => { // Pegando o id do que queremos editar com base no que foi feito na view
    var id = req.params.id

    db.collection('data').find(ObjectId(id)).toArray((err, result) => { // Com base nesse id, nosso server.js vai renderiazar a página de edição para o id (a pessoa) que queremos
        if (err) return res.send(err)
        res.render('edit.ejs', { data: result })
    })
})
.post((req, res) => { // Fazendo o update baseado na request 
    var id = req.params.id
    var name = req.body.name
    var surname = req.body.surname
    var email = req.body.email
    var password = getHashedPassword(req.body.password)

    db.collection('data').updateOne({_id: ObjectId(id)}, {
        $set: {
            name: name,
            surname: surname,
            email: email,
            password: password
        }
    }, (err, result) => {
        if (err) return res.send(err), console.log(err)
        res.redirect('/show')
        console.log('Atualizado no Banco de Dados!')
    })
})

// DELETE
app.route('/delete/:id')
.get((req, res) => {
    var id = req.params.id // Pegando o id dado na request para poder deletar corretamente no bd

    db.collection('data').deleteOne({_id: ObjectId(id)}, (err, result) => {
        if (err) return res.send(500, err)
        console.log('Deletado do Banco de Dados')
        res.redirect('/show')
    })
})





