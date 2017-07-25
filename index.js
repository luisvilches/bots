const restify = require('restify');
const builder = require('botbuilder');
const fs = require("fs");
const server = restify.createServer();
const banca = require('bci');
const BCI_KEY = '4eac86cd-bdb2-4f84-8575-72a9d09215b4';
const indicadores = new banca.Bci(BCI_KEY);
const consumo = new banca.Consumo(BCI_KEY);
const fetch = require('node-fetch');
var okrabyte = require("n-ocr");
const cloudinary = require('cloudinary');

var usuario = {};

cloudinary.config({ 
  cloud_name: 'accecar', 
  api_key: '581627995675862', 
  api_secret: 'y2jQCRNi1-UVx2n552vEi8Yywoc' 
});

var credito_consumo = { 
    rut: usuario.rut,
    dv: usuario.dv,
    montoCredito: usuario.montoCredito,
    cantidadCuotas: usuario.cantidadCuotas,
    fechaPrimerVencimiento: '26/07/2017',
    canal: '110',
    modalidad: 'SG2',
    tipoCredito: 'UNI',
    renta: usuario.renta,
    codigoJournal: '1',
    mesNoPago1: 0,
    mesNoPago2: 0,
};

/********** setup server restify ******************/

server.listen(1989,function(err){  // create server use
    console.log('-> connect.......ok')
});

/********** end setup server restify ******************/




/********** setup concetor ******************/

var configuracion = {
    appId: process.env.MICROSOFT_APP_ID || '3420812d-5bf4-4b05-98ae-4fd84d6f59e7', // API_KEY Microsoft
    appPassword: process.env.MICROSOFT_APP_PASSWORD || 'uFwomC7LN1oKkgKky7DfJBs'// Password the API_KEY Microsoft
}

var configuracion2 = {
    appId: "", // API_KEY Microsoft
    appPassword: "" // Password the API_KEY Microsoft
}

const connector  = new builder.ChatConnector(configuracion2);

/********** end setup concetor ******************/


/********** setup bot ******************/

const bot = new builder.UniversalBot(connector); // create Universal Bot

/********** end setup bot ******************/

/********** setup LUIS ******************/

// url model Luis
const base = 'https://eastus2.api.cognitive.microsoft.com/luis/v2.0/'
const API_KEY = '30cb11e4-483e-4d4c-9eec-db281d368527';
const SUSCRIPTION_KEY = 'ba7313fd32744ae1af4a93c7ab4dad60';
const modelMain = `${base}${API_KEY}?subscription-key=${SUSCRIPTION_KEY}`;
const otherModel = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/7ae2a752-69b9-43fa-a3d2-e81faa72f73c?subscription-key=a34b73319aa64f55b0ce25641a1a2da0&timezoneOffset=0&verbose=true&q='


//settings for recognizer the words
const recognizer = new builder.LuisRecognizer(otherModel); // the variable recognizer find the word in model the LUIS

const intents = new builder.IntentDialog({ 
    recognizers: [recognizer] 
}); // craete the instens

/********** end setup LUIS ******************/

/********** setup Intents ******************/

intents.matches('Saludar', (session,result) => {
    session.send('Hola soy Santi, cuentame en que te puedo ayudar');
})

intents.matches('Necesidad', (session,result) => {
    indicadores.indicadores().then(response => {
        session.send('cuentame en que puedo ayudarte');
    })
})
intents.matches('UF', (session,result) => {
    indicadores.indicadores().then(response => {
        session.send('el valor de la UF es: ' + response.kpis[0].price + '');
    })
})

intents.matches('Santi', (session,result) => {
    session.send('si, dime');
})

intents.matches('Clima', (session,result) => {
	fetch('https://api.darksky.net/forecast/681f8ea72cac91d788de259234db50ad/-33.441037,-70.6270804')
	.then(response => response.json())
	.then(res => {	
		var tem = Math.floor(Number(res.currently.temperature) - 32 );
		var totalTem = Math.floor(Number(tem) / 1.8 );
    	session.send('la temperatura de hoy es de: ' + totalTem + 'º');
	})    
})

intents.matches('Bip', [(session,result)=>{
	builder.Prompts.text(session, 'Cual es el numero de la tarjeta bip?');

},(session,result) => {
	let tarjeta = result.response;
	fetch('http://bip.franciscocapone.com/api/getSaldo/' + tarjeta)
	.then(data => data.json())
	.then(res => {
		let saldo = res.saldo;
		session.send('el saldo de tu tarjeta es de: ' + saldo)
	})
}])

intents.matches('Agradecimiento', (session,result) => {
	session.send('de nada, no es ninguna molestia.')
})

intents.matches('ResponderSaludo',[(session,result) => {
	builder.Prompts.text(session, 'Muy bien y ¿tu?');
},(session,result) => {
	let resp = result.response;
	if(resp === 'bien tambien'){
		session.send('que bueno me alegro mucho');
	} else if(resp === 'bien'){
		session.send('que bueno me alegro mucho');
	}
}])
//(session,result)=>{builder.Prompts.text(session, '¿Que tipo de credito te gustaria simular?');},
intents.matches('Credito', [(session,result) => {
	let credito = result.response;
	session.send('perfecto te hare algunas preguntas para la simulacion de tu credito de ')
	session.beginDialog('/name');
}])

bot.dialog('/name', [(session,result)=>{
	//builder.Prompts.text(session, 'Primero que nada, ¿Cual es tu nombre?');
	builder.Prompts.attachment(session,'necesito la captura de su cedula de identidad')
},(session,result) => {
	console.log('imagen: ',result.response)
	cloudinary.uploader.upload(result.response.contentUrl, ima => {
		console.log(ima.url);
	})
	/*let i = fs.readFileSync(result.response.contentUrl);
	okrabyte.decodeBuffer(i, function(error, data){
		console.log(data); // Hello World! 
	})*/
	session.send('ok');
	/*let nombre = result.response;
	usuario.name = nombre;
	session.send('perfecto ' + nombre + ', ahora comenzaremos con la simulacion');
	session.beginDialog('/consumo');*/
}])

bot.dialog('/consumo',[(session,result) => {
	builder.Prompts.text(session,'Necesito que me indique tu rut sin puntos y con guión por favor');
},(session,result)=>{
	let rut = result.response;
	let dv = rut.split('-');
	if(validaRut(rut)){
		usuario.rut = dv[0];
		usuario.dv = dv[1];
		credito_consumo.rut = dv[0];
		credito_consumo.dv = dv[1];
		session.beginDialog('/paso1');
	}else{
		builder.Prompts.text(session,'el rut ingresado no es valido, ingresa un rut valido por favor')
	}
},(session,result)=>{
	let rut = result.response;
	let dv = rut.split('-');
	if(validaRut(rut)){
		usuario.rut = dv[0];
		usuario.dv = dv[1];
		credito_consumo.rut = dv[0];
		credito_consumo.dv = dv[1];
		session.beginDialog('/paso1');
	}else{
		builder.Prompts.text(session,'algo anda mal con tu rut, intentemos mas tarde')
	}
}])

bot.dialog('/paso1',[(session,result)=>{
	builder.Prompts.text(session,'Perfecto hasta aqui todo bien, ahora necesito que me indiques tu renta mensual sin puntos ni simbolo peso.');
},(session,result)=>{
	let renta = result.response;
	usuario.renta = renta;
	credito_consumo.renta = renta;
	session.beginDialog('/paso2');
}])

bot.dialog('/paso2',[(session,result) => {
	builder.Prompts.text(session,'Ahora necesito que me indiques el monto que deseas solicitar sin puntos ni simbolo peso.');
},(session,result) => {
	let monto = result.response;
	usuario.montoCredito = monto;
	credito_consumo.montoCredito = monto;
	session.beginDialog('/paso3');
}])

bot.dialog('/paso3',[(session,result)=>{
	usuario.montoFormat = formatMonto(usuario.montoCredito);
	builder.Prompts.text(session, 'Perfecto, cual es el numero cuotas que solicitaras para tu credito de consumo de ' + formatMonto(usuario.montoCredito) + ' ?');
},(session,result) => {
	let cuotas = result.response;
	usuario.cantidadCuotas = cuotas;
	credito_consumo.cantidadCuotas = cuotas;
	session.beginDialog('/resumenCredito');
}])

bot.dialog('/resumenCredito',[(session,result)=>{
	consumo.simulacion(credito_consumo).then(res => {
		let montoTotal = formatMonto(res.creditos_consumo.montoCredito);
		let valorCuota = formatMonto(res.creditos_consumo.montoCuota);
		let gastos = formatMonto(res.creditos_consumo.montoGastos);
		let comision = formatMonto(res.creditos_consumo.montoComisiones);
		let impuestos = formatMonto(res.creditos_consumo.montoImpuestos);
		let seguros = formatMonto(res.creditos_consumo.montoSeguros);
		let cae = res.creditos_consumo.montoCae + '%';
		let tasa = res.creditos_consumo.tasa + '%';
		let varios = res.creditos_consumo.montoComisiones + res.creditos_consumo.montoImpuestos + res.creditos_consumo.montoSeguros;
		let otrosGastos = formatMonto(varios);

		let imageSantander = 'http://videas.tv/wp-content/uploads/2015/05/Santander-logo-videas.png';

		var aaa = new builder.ReceiptCard(session)
		.title('Estimado '+usuario.name+' el resultado de la simulacion para su credito de consumo es:')
		.items([
			builder.ReceiptItem.create(session, montoTotal,'Monto total del credito'),
			builder.ReceiptItem.create(session, valorCuota,'Valor cuota mensual'),
			builder.ReceiptItem.create(session, otrosGastos,'Seguros + impuestos + comision'),
			builder.ReceiptItem.create(session, cae,'Cae'),
			builder.ReceiptItem.create(session, tasa,'Tasa'),
			builder.ReceiptItem.create(session, '','')
		])
		.buttons([
			builder.CardAction.openUrl(session,'http://google.cl', 'Solicitar').image(imageSantander)
		]);
		
		var ccc = new builder.Message(session).addAttachment(aaa);
		
		session.send(ccc);
	})
}])



intents.onDefault(builder.DialogAction.send('Disculpa, no entiendo lo que dices')); // Default response if not find match

/********** end setup Intents ******************/


bot.dialog('/', intents);
server.post('/api/messages', connector.listen());


function validaRut(rutCompleto) {
	if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test( rutCompleto ))
		return false;
	var tmp 	= rutCompleto.split('-');
	var digv	= tmp[1]; 
	var rut 	= tmp[0];
	if ( digv == 'K' ) digv = 'k' ;
	return (dv(rut) == digv );
}
function dv(T){
	var M=0,S=1;
	for(;T;T=Math.floor(T/10))
		S=(S+T%10*(9-M++%6))%11;
	return S?S-1:'k';
}

function formatMonto(valor){
	if(valor === null){
		valor = 0;
		return valor;
	}
	else {
		var num = String(valor).toString().replace(/\./g,'');
		if(!isNaN(num)){
			num = num.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g,'$1.');
			num = num.split('').reverse().join('').replace(/^[\.]/,'');
			valor = num;
			return '$'+valor+'.-';
		} else { 
			console.log('Solo se permiten numeros');
			valor = String(valor).replace(/[^\d\.]*/g,'');
		}
	}
}